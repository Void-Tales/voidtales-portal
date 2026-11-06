// Local thumbnails for every YouTube video the site links, so a page shows a
// preview without any request to Google until somebody clicks play (/datenschutz).
// Writes public/images/yt/<id>.webp plus -640, and src/generated/youtube.json with
// the title for astro.config.mjs and the start page. A video that is gone (no
// oEmbed answer) gets no entry: its link simply stays a link.

import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { siteConfig } from '../src/config/site.js';

const OUT_DIR = path.resolve('public/images/yt');
const OUT_FILE = path.resolve('src/generated/youtube.json');
const ID = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/g;

const walk = (dir) =>
	fs
		.readdirSync(dir, { withFileTypes: true })
		.flatMap((e) =>
			e.isDirectory()
				? walk(path.join(dir, e.name))
				: e.name.endsWith('.md')
					? [path.join(dir, e.name)]
					: []
		);

const ids = new Set(siteConfig.film.videos.map((v) => v.id));
for (const file of walk('src/content')) {
	for (const m of fs.readFileSync(file, 'utf8').matchAll(ID)) ids.add(m[1]);
}

const get = (url) => fetch(url, { signal: AbortSignal.timeout(30_000) });

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
const out = {};
for (const id of ids) {
	try {
		const watch = encodeURIComponent(`https://www.youtube.com/watch?v=${id}`);
		const meta = await get(`https://www.youtube.com/oembed?url=${watch}&format=json`);
		if (!meta.ok) {
			console.warn(`youtube ${id}: no oEmbed (HTTP ${meta.status}), stays a plain link`);
			continue;
		}
		const { title } = await meta.json();
		let thumb = await get(`https://i.ytimg.com/vi/${id}/maxresdefault.jpg`);
		if (!thumb.ok) thumb = await get(`https://i.ytimg.com/vi/${id}/hqdefault.jpg`);
		if (!thumb.ok) throw new Error(`thumbnail HTTP ${thumb.status}`);
		const buffer = Buffer.from(await thumb.arrayBuffer());
		// 16:9 crop: hqdefault carries black bars.
		const encode = (w, name) =>
			sharp(buffer)
				.resize(w, Math.round((w * 9) / 16), { fit: 'cover' })
				.webp({ quality: 80 })
				.toFile(path.join(OUT_DIR, name));
		await encode(1280, `${id}.webp`);
		await encode(640, `${id}-640.webp`);
		out[id] = { title };
	} catch (err) {
		// A hiccup on one thumbnail is no reason to stop a deploy.
		console.warn(`youtube ${id}: ${err.message}, stays a plain link`);
	}
}
fs.writeFileSync(OUT_FILE, `${JSON.stringify(out, null, '\t')}\n`);
console.log(`youtube: ${Object.keys(out).length}/${ids.size} videos`);
