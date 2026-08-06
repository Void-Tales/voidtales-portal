import fs from 'node:fs';
import { defineConfig, fontProviders } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { siteConfig } from './src/config/site.js';

// Written by scripts/media.mjs (runs in `prebuild`). Missing on a bare checkout,
// which is fine: images then render without intrinsic sizes instead of the
// config refusing to load.
const mediaSizes = fs.existsSync('./src/generated/media-sizes.json')
	? JSON.parse(fs.readFileSync('./src/generated/media-sizes.json', 'utf8'))
	: {};

/**
 * Path -> ISO date, for the sitemap's `lastmod`.
 *
 * Read from the frontmatter with fs rather than from the content layer: the
 * sitemap integration builds its list outside `astro:content`, and a config
 * file cannot await a collection. The shapes are flat and known, so a regex is
 * enough — the same reasoning as in scripts/og.mjs.
 */
const contentDates = (() => {
	const dates = {};
	const read = (dir, field) =>
		fs.existsSync(dir)
			? fs.readdirSync(dir).flatMap((file) => {
					if (!file.endsWith('.md')) return [];
					const raw = fs.readFileSync(`${dir}/${file}`, 'utf8');
					const value = raw.match(new RegExp(`^${field}:\\s*"?([^"\\n]+)"?`, 'm'))?.[1];
					const slug = raw.match(/^slug:\s*"?([^"\n]+)"?/m)?.[1];
					return value ? [{ date: new Date(value), slug }] : [];
				})
			: [];

	for (const { date, slug } of read('./src/content/news', 'pubDatetime')) {
		if (slug) dates[`/news/${slug}`] = date.toISOString();
	}

	// The devlog has no per-entry page: a month URL is as fresh as its newest
	// entry, and /devlog itself mirrors the newest month.
	const devlog = read('./src/content/devlog', 'date');
	for (const { date } of devlog) {
		const key = `/devlog/${date.toISOString().slice(0, 7)}`;
		if (!dates[key] || date.toISOString() > dates[key]) dates[key] = date.toISOString();
	}
	const newest = devlog.map((e) => e.date).sort((a, b) => b - a)[0];
	if (newest) {
		dates['/devlog'] = newest.toISOString();
		dates['/news'] = Object.entries(dates)
			.filter(([k]) => k.startsWith('/news/'))
			.map(([, v]) => v)
			.sort()
			.at(-1);
	}
	// Die Startseite zeigt den neuesten Stand von beidem.
	dates['/'] = Object.values(dates).sort().at(-1);
	return dates;
})();

/**
 * Stamps every Markdown image with its real width/height plus lazy loading.
 * News and devlog entries carry their images inline in the body, so the
 * templates never see an `<img>` — this is the one place that can size them,
 * and an image without intrinsic size reserves no space, so the page jumps
 * around as it loads.
 *
 * A Sätteri HAST plugin, not a rehype one: Astro 7 renders Markdown with
 * Sätteri by default, and `markdown.rehypePlugins` would drag the whole site
 * back onto the legacy unified() pipeline just for this.
 */
const satteriImageSizes = {
	name: 'image-sizes',
	element: {
		filter: ['img'],
		visit(node, ctx) {
			const size = mediaSizes[node.properties?.src];
			if (size) {
				ctx.setProperty(node, 'width', size.w);
				ctx.setProperty(node, 'height', size.h);
			}
			if (!node.properties?.loading) ctx.setProperty(node, 'loading', 'lazy');
			if (!node.properties?.decoding) ctx.setProperty(node, 'decoding', 'async');
		},
	},
};

export default defineConfig({
	site: siteConfig.url,

	// Fully static: the site has no data source and no server-side secrets.
	output: 'static',

	// The Discord -> Markdown -> site pipeline turns a chat channel into a trust
	// boundary, and Markdown may carry raw HTML. Astro hashes every inline
	// script and style at build time, so this stays strict without
	// 'unsafe-inline' on script-src.
	//
	// `frame-ancestors` is deliberately absent: browsers ignore it inside a
	// <meta> CSP. Clickjacking is covered by X-Frame-Options at the edge.
	security: {
		csp: {
			directives: [
				"default-src 'self'",
				"img-src 'self' data: https://media.voidtales.win",
				"connect-src 'self' https://api.mcstatus.io", // ServerStatus.astro
				'frame-src https://www.youtube-nocookie.com', // trailer embed
				"base-uri 'self'",
				"form-action 'none'",
				"object-src 'none'",
			],
			// Pagefind sucht in einem WebAssembly-Modul. Ohne 'wasm-unsafe-eval'
			// blockt Chrome die Instanziierung und /search bleibt stumm. Das
			// Schluesselwort erlaubt WASM und sonst nichts - insbesondere kein
			// eval() und kein Inline-Script; die Hashes bleiben unangetastet.
			scriptDirective: {
				resources: ["'self'", "'wasm-unsafe-eval'"],
			},
			// Card animations carry their stagger index as style="--i: n".
			// Attribute styles cannot be hashed and cannot execute anything, so
			// this stays scoped to style-src-attr; script-src is untouched.
			// (`style-src*` is rejected inside `directives` on purpose - Astro
			// wants it here so it can keep its own hashes in style-src-elem.)
			styleDirective: {
				resources: ["'self'", { resource: "'unsafe-inline'", kind: 'attribute' }],
			},
		},
	},

	integrations: [
		sitemap({
			// Raus aus der Sitemap:
			//  /search  - eine Eingabemaske, kein Inhalt (traegt zusaetzlich noindex)
			//  /devlog/ - Alias auf den neuesten Monat, canonical zeigt auf die
			//             Monats-URL. Beide anzumelden waere Duplicate Content.
			filter: (page) => !page.includes('/search/') && !page.endsWith('/devlog/'),
			// Ohne lastmod sieht fuer einen Crawler jede der ~56 URLs gleich alt aus.
			serialize(item) {
				const path = new URL(item.url).pathname.replace(/\/$/, '') || '/';
				const lastmod = contentDates[path];
				return lastmod ? { ...item, lastmod } : item;
			},
		}),
	],

	markdown: {
		processor: satteri({ hastPlugins: [satteriImageSizes] }),
	},

	// Self-hosted, build-time fetched Google Fonts (no runtime request to
	// fonts.googleapis.com).
	// The cssVariables are deliberately named after the family, not after the
	// role: `--font-display` / `--font-body` are owned by the `@theme inline`
	// block in global.css, which points them at these.
	fonts: [
		{
			provider: fontProviders.google(),
			name: 'Unbounded',
			cssVariable: '--font-unbounded',
			weights: [400, 600, 800],
		},
		{
			provider: fontProviders.google(),
			name: 'Instrument Sans',
			cssVariable: '--font-instrument-sans',
			weights: [400, 500, 600],
		},
	],

	vite: {
		plugins: [tailwindcss()],
	},
});
