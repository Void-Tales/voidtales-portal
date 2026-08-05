// Pulls the news/devlog originals from the media host and derives the WebP
// files the pages actually reference.
//
// The originals stay out of the repo and out of the shipped image: they land in
// .media-cache/ (build-only), and only the WebP goes to public/images/. Videos
// are never downloaded, entries link to them on the media host directly.
//
// Idempotent: an existing cache file is not re-fetched, an existing WebP is not
// re-encoded. In CI the whole step is one Docker layer, invalidated by the
// MEDIA_DIGEST build arg (see .github/workflows/deploy.yml).

import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

// Width/height of every generated WebP, written out for the templates: without
// intrinsic sizes a lazily loaded image reserves no space and the page jumps
// while scrolling.
const SIZES_FILE = path.resolve('src/generated/media-sizes.json');
const sizes = fs.existsSync(SIZES_FILE) ? JSON.parse(fs.readFileSync(SIZES_FILE, 'utf8')) : {};

const HOST = process.env.MEDIA_HOST ?? 'https://media.voidtales.win';
const KINDS = ['news', 'devlog'];
const VIDEO = /\.(mp4|mov|webm|mkv)$/i;
const IMAGE = /\.(png|jpe?g|webp|gif|bmp)$/i;
const MAX_WIDTH = 1600;

async function listing(url) {
	const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
	if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
	const html = await res.text();
	// nginx autoindex, one <a href="file"> per entry. A regex beats pulling in
	// an HTML parser for a page this rigid.
	return [...html.matchAll(/href="([^"?/][^"]*)"/g)]
		.map((m) => decodeURIComponent(m[1]))
		.filter((f) => IMAGE.test(f));
}

let failed = 0;

for (const kind of KINDS) {
	const cacheDir = path.resolve('.media-cache', kind);
	const outDir = path.resolve('public/images', kind);
	fs.mkdirSync(cacheDir, { recursive: true });
	fs.mkdirSync(outDir, { recursive: true });

	let files;
	try {
		files = await listing(`${HOST}/${kind}/`);
	} catch (err) {
		// Offline with a warm cache is fine locally; an empty cache is not, that
		// would ship a page whose images all 404 while the build stays green.
		const cached = fs.readdirSync(cacheDir).filter((f) => IMAGE.test(f));
		if (cached.length === 0) {
			console.error(`${kind}: media host unreachable and no cache (${err.message})`);
			process.exit(1);
		}
		console.warn(`${kind}: media host unreachable, using ${cached.length} cached files`);
		files = cached;
	}

	for (const file of files) {
		if (VIDEO.test(file)) continue;
		const cached = path.join(cacheDir, file);
		if (!fs.existsSync(cached)) {
			const url = `${HOST}/${kind}/${encodeURIComponent(file)}`;
			const res = await fetch(url, { signal: AbortSignal.timeout(120_000) });
			if (!res.ok) {
				console.error(`download failed: ${url} -> HTTP ${res.status}`);
				failed++;
				continue;
			}
			fs.writeFileSync(cached, Buffer.from(await res.arrayBuffer()));
			console.log(`fetched ${kind}/${file}`);
		}

		const webp = path.join(outDir, `${path.parse(file).name}.webp`);
		const key = `/images/${kind}/${path.basename(webp)}`;
		if (fs.existsSync(webp) && sizes[key]) continue;
		try {
			// animated: true keeps GIFs moving, without it sharp writes frame one.
			const info = await sharp(cached, { animated: /\.gif$/i.test(file) })
				.resize({ width: MAX_WIDTH, withoutEnlargement: true })
				.webp({ quality: 80 })
				.toFile(webp);
			// An animated WebP stacks its frames vertically, so info.height is
			// the whole strip — divide it back down to one frame.
			sizes[key] = { w: info.width, h: Math.round(info.height / (info.pages || 1)) };
			console.log(`encoded ${kind}/${path.basename(webp)}`);
		} catch (err) {
			console.error(`encode failed: ${kind}/${file} (${err.message})`);
			failed++;
		}
	}

	fs.writeFileSync(path.resolve('.media-cache', `.${kind}_synced`), 'synced\n');
}

fs.mkdirSync(path.dirname(SIZES_FILE), { recursive: true });
fs.writeFileSync(SIZES_FILE, `${JSON.stringify(sizes, null, '\t')}\n`);

if (failed > 0) {
	console.error(`${failed} media file(s) failed - refusing to build a page with holes in it`);
	process.exit(1);
}
