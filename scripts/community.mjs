// The start page's screenshot strip, chosen from the gallery at build time.
//
// Liked or commented shots first, then the newest, at most three per author so
// the strip shows the community and not one person. Originals are re-encoded
// here because the gallery's largest thumb (800w) is too soft for a tall crop on
// a phone. Only the WebP ships; a failed lookup writes an empty list and the page
// falls back to the fixed images in site.js, a gallery outage must not stop a build.

import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const GALLERY = process.env.GALLERY_HOST ?? 'https://gallery.voidtales.win';
const COUNT = 6;
const PER_AUTHOR = 3;
const MIN_WIDTH = 1600;
// Mean brightness 0-255. Below this a tile is a black rectangle at strip size.
const MIN_BRIGHTNESS = 38;

const OUT_DIR = path.resolve('public/images/community');
const OUT_FILE = path.resolve('src/generated/community.json');

const fetchBuffer = async (url) => {
	const res = await fetch(url, { signal: AbortSignal.timeout(60_000) });
	if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
	return Buffer.from(await res.arrayBuffer());
};
const fetchJson = async (url) => JSON.parse((await fetchBuffer(url)).toString());

/** Filenames and Discord's default "image" are not titles. */
export const realTitle = (title = '') => {
	const t = title.replace(/^SPOILER_/i, '').trim();
	if (!t || /^image(-\d+)?$/i.test(t) || /^default-\d+$/i.test(t) || /^\d{4}-\d{2}-\d{2}/.test(t))
		return '';
	return t.replace(/[_-]+/g, ' ').trim();
};

export function pick(images, stats, count = COUNT) {
	const score = (i) => (stats[i.id]?.likes ?? 0) * 2 + (stats[i.id]?.comments ?? 0);
	const pool = images.filter(
		(i) => !i.isDefault && !/spoiler/i.test(i.title) && i.width >= MIN_WIDTH && i.author
	);
	const newest = (a, b) => b.date.localeCompare(a.date);
	const loved = pool
		.filter((i) => score(i) > 0)
		.sort((a, b) => score(b) - score(a) || newest(a, b));
	const rest = pool.filter((i) => score(i) === 0).sort(newest);
	const perAuthor = new Map();
	const out = [];
	for (const i of [...loved, ...rest]) {
		if (out.length === count) break;
		const n = perAuthor.get(i.author) ?? 0;
		if (n >= PER_AUTHOR) continue;
		perAuthor.set(i.author, n + 1);
		out.push(i);
	}
	return out;
}

async function main() {
	fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
	fs.mkdirSync(OUT_DIR, { recursive: true });
	let list = [];
	try {
		const images = await fetchJson(`${GALLERY}/images.json?cb=${Date.now()}`);
		const stats = await fetchJson(`${GALLERY}/api/stats`).catch(() => ({}));
		// Dark shots drop out here rather than in pick(): it costs a download per image.
		const bright = [];
		for (const image of pick(images, stats, images.length)) {
			if (bright.length === COUNT * 3) break;
			const thumb = await fetchBuffer(`${GALLERY}/images/thumbs/${image.id}-200.webp`).catch(
				() => null
			);
			if (!thumb) continue;
			const { channels } = await sharp(thumb).stats();
			const mean = channels.slice(0, 3).reduce((sum, c) => sum + c.mean, 0) / 3;
			if (mean >= MIN_BRIGHTNESS) bright.push(image);
		}
		for (const image of pick(bright, stats)) {
			const original = await fetchBuffer(`${GALLERY}${image.imageUrl}`);
			const big = `${image.id}.webp`;
			const small = `${image.id}-800.webp`;
			await sharp(original)
				.resize({ width: 1600, withoutEnlargement: true })
				.webp({ quality: 80 })
				.toFile(path.join(OUT_DIR, big));
			await sharp(original)
				.resize({ width: 800 })
				.webp({ quality: 80 })
				.toFile(path.join(OUT_DIR, small));
			const title = realTitle(image.title);
			list.push({
				id: image.id,
				src: `/images/community/${big}`,
				small: `/images/community/${small}`,
				author: image.author,
				alt: `Screenshot by ${image.author}${title ? `: ${title}` : ''}`,
				url: `${GALLERY}/#img-${image.id}`,
			});
		}
		console.log(`community strip: ${list.map((i) => `${i.id} (${i.author})`).join(', ')}`);
	} catch (err) {
		console.warn(`community strip: falling back to the fixed images (${err.message})`);
		list = [];
	}
	fs.writeFileSync(OUT_FILE, `${JSON.stringify(list, null, '\t')}\n`);
}

if (process.argv[1]?.endsWith('community.mjs')) await main();
