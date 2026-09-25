// Pulls the item catalogue bundle from the media host and renders one icon per
// item for /items.
//
// The bundle (items.json + tex/<sha1>.png) is exported nightly on the game host
// from the MythicMobs definitions of the test and live server, already filtered
// to what may be public. Its format is the contract with
// srv-work/voidtales-itemkatalog/export.py - see the README there.
//
// Output: public/images/items/<id>.<hash>.webp (128 px) and src/generated/items.json,
// which the pages read. Textures are content-addressed, so the cache in
// .media-cache/items/ never goes stale; items.json is fetched fresh on every
// build.

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { render2d, render3d } from './render-model.mjs';

// ITEMS_SOURCE may be a URL or a local directory holding a bundle (for working
// on the pages without touching the media host).
const SOURCE =
	process.env.ITEMS_SOURCE ?? `${process.env.MEDIA_HOST ?? 'https://media.voidtales.win'}/items`;
const SIZE = 128;
const CACHE = path.resolve('.media-cache/items');
const OUT_DIR = path.resolve('public/images/items');
const DATA_FILE = path.resolve('src/generated/items.json');
const remote = /^https?:\/\//.test(SOURCE);

async function get(file) {
	if (!remote) return fs.readFileSync(path.join(SOURCE, file));
	// Cache-buster: the edge caches the media host for a month, and a frozen
	// items.json would silently pin the catalogue to an old day.
	const res = await fetch(`${SOURCE}/${file}?cb=${Date.now()}`, {
		signal: AbortSignal.timeout(60_000),
	});
	if (!res.ok) throw new Error(`${SOURCE}/${file} -> HTTP ${res.status}`);
	return Buffer.from(await res.arrayBuffer());
}

fs.mkdirSync(path.join(CACHE, 'tex'), { recursive: true });
// Rebuilt from scratch every time: an icon whose item left the catalogue must
// not linger in the image.
fs.rmSync(OUT_DIR, { recursive: true, force: true });
fs.mkdirSync(OUT_DIR, { recursive: true });

let bundle;
try {
	const raw = await get('items.json');
	bundle = JSON.parse(raw);
	fs.writeFileSync(path.join(CACHE, 'items.json'), raw);
} catch (err) {
	// Same rule as media.mjs: offline with a cache is fine, without one the
	// build stops instead of shipping an empty catalogue.
	const cached = path.join(CACHE, 'items.json');
	if (!fs.existsSync(cached)) {
		console.error(`items: bundle unreachable and no cache (${err.message})`);
		process.exit(1);
	}
	console.warn(`items: bundle unreachable, using cached copy (${err.message})`);
	bundle = JSON.parse(fs.readFileSync(cached, 'utf8'));
}
if (bundle.schema !== 1) {
	console.error(`items: unknown bundle schema ${bundle.schema}`);
	process.exit(1);
}

// Decoded textures, cropped to the first frame: an animated texture is a
// vertical strip of square frames.
// ponytail: assumes square frames, .mcmeta frame sizes are not in the bundle.
const textures = new Map();
async function loadTex(sha) {
	if (textures.has(sha)) return;
	const file = path.join(CACHE, 'tex', `${sha}.png`);
	if (!fs.existsSync(file)) fs.writeFileSync(file, await get(`tex/${sha}.png`));
	const img = sharp(file).ensureAlpha();
	const { width, height } = await img.metadata();
	const h = height > width && height % width === 0 ? width : height;
	const data = await img.extract({ left: 0, top: 0, width, height: h }).raw().toBuffer();
	textures.set(sha, { data, w: width, h });
}

const texOf = (icon) =>
	icon.kind === '2d'
		? icon.layers
		: icon.kind === '3d'
			? icon.elements.flatMap((e) => Object.values(e.faces).map((f) => f.texture))
			: [];

const placeholder = await sharp(
	Buffer.from(
		`<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}"><rect x="28" y="28" width="72" height="72" rx="10" fill="none" stroke="#9b93b3" stroke-opacity=".5" stroke-width="4" stroke-dasharray="10 8"/></svg>`
	)
)
	.webp({ lossless: true })
	.toBuffer();

// nginx serves /images/ as immutable for a year, so the name carries a hash
// of the content: a changed model gets a new URL instead of a stale cache.
const writeIcon = (id, webp) => {
	const name = `${id}.${createHash('sha1').update(webp).digest('hex').slice(0, 8)}.webp`;
	fs.writeFileSync(path.join(OUT_DIR, name), webp);
	return `/images/items/${name}`;
};

const items = [];
let missing = 0;
for (const item of bundle.items) {
	const { icon, ...rest } = item;
	try {
		for (const sha of texOf(icon)) await loadTex(sha);
		const tex = (sha) => textures.get(sha);
		if (icon.kind === 'missing') throw new Error(icon.reason);
		const rgba = icon.kind === '2d' ? render2d(icon, tex, SIZE) : render3d(icon, tex, SIZE);
		const webp = await sharp(Buffer.from(rgba.buffer), {
			raw: { width: SIZE, height: SIZE, channels: 4 },
		})
			.webp({ lossless: true })
			.toBuffer();
		items.push({ ...rest, icon: writeIcon(item.id, webp), iconMissing: false });
	} catch (err) {
		// A missing icon is a finding for the pack, not a reason to fail the site.
		items.push({ ...rest, icon: writeIcon(item.id, placeholder), iconMissing: true });
		console.warn(`items: ${item.id} without icon (${err.message})`);
		missing++;
	}
}

// The age of the bundle, read by the monitoring at the far end of the chain:
// one number that goes stale whether the export, the pull, the build or the
// nightly schedule stops.
fs.mkdirSync(path.resolve('public/items'), { recursive: true });
fs.writeFileSync(path.resolve('public/items/stand.txt'), `${bundle.generated}\n`);

fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
fs.writeFileSync(
	DATA_FILE,
	`${JSON.stringify({ generated: bundle.generated, sources: bundle.sources, items }, null, '\t')}\n`
);
console.log(
	`items: ${items.length} items, ${missing} placeholder icon(s), generated ${bundle.generated}`
);
