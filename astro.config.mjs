import fs from 'node:fs';
import { defineConfig, fontProviders } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { siteConfig } from './src/config/site.js';
import { berlinMonth } from './src/utils/berlin.js';

// Written by scripts/media.mjs (runs in `prebuild`). Missing on a bare checkout,
// which is fine: images then render without intrinsic sizes instead of the
// config refusing to load.
const mediaSizes = fs.existsSync('./src/generated/media-sizes.json')
	? JSON.parse(fs.readFileSync('./src/generated/media-sizes.json', 'utf8'))
	: {};

// Written by scripts/youtube.mjs (prebuild): the videos with a local thumbnail.
const youtube = fs.existsSync('./src/generated/youtube.json')
	? JSON.parse(fs.readFileSync('./src/generated/youtube.json', 'utf8'))
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
		const key = `/devlog/${berlinMonth(date)}`;
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
			// Phones get the 800w copy (scripts/media.mjs). 44rem = .shell-narrow minus padding.
			if (size?.small) {
				ctx.setProperty(node, 'srcset', `${size.small} 800w, ${node.properties.src} ${size.w}w`);
				ctx.setProperty(node, 'sizes', '(width >= 48rem) 44rem, calc(100vw - 2rem)');
			}
			if (!node.properties?.loading) ctx.setProperty(node, 'loading', 'lazy');
			if (!node.properties?.decoding) ctx.setProperty(node, 'decoding', 'async');
		},
	},
};

/**
 * A YouTube address alone in a post (Discord embeds those, the web showed a raw URL)
 * becomes the same click-to-load preview as on the start page, with a thumbnail from
 * our own server. A link with words stays a link: the author chose that.
 */
const satteriYoutube = {
	name: 'youtube-facade',
	element: {
		filter: ['a'],
		visit(node, ctx) {
			const href = node.properties?.href ?? '';
			const id = href.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/)?.[1];
			const text = node.children?.[0]?.value ?? '';
			if (!id || !youtube[id] || !/^https?:\/\//.test(text)) return;
			const el = (tagName, properties = {}, children = []) => ({
				type: 'element',
				tagName,
				properties,
				children,
			});
			ctx.replaceNode(
				node,
				el(
					'a',
					{
						className: ['trailer-play', 'trailer-inline'],
						href,
						'data-embed': `https://www.youtube-nocookie.com/embed/${id}`,
						'aria-label': `Play ${youtube[id].title} (loads YouTube)`,
					},
					[
						el('img', {
							src: `/images/yt/${id}.webp`,
							srcset: `/images/yt/${id}-640.webp 640w, /images/yt/${id}.webp 1280w`,
							sizes: '(width >= 48rem) 44rem, calc(100vw - 2rem)',
							alt: '',
							width: 1280,
							height: 720,
							loading: 'lazy',
							decoding: 'async',
						}),
						el('svg', { viewBox: '0 0 68 48', 'aria-hidden': 'true' }, [
							el('path', {
								className: ['trailer-play-bg'],
								d: 'M66.5 7.7a8.5 8.5 0 0 0-6-6C55.2.3 34 .3 34 .3s-21.2 0-26.5 1.4a8.5 8.5 0 0 0-6 6C.1 13 .1 24 .1 24s0 11 1.4 16.3a8.5 8.5 0 0 0 6 6c5.3 1.4 26.5 1.4 26.5 1.4s21.2 0 26.5-1.4a8.5 8.5 0 0 0 6-6C67.9 35 67.9 24 67.9 24s0-11-1.4-16.3Z',
							}),
							el('path', { d: 'M27 34V14l18 10z', fill: '#fff' }),
						]),
					]
				)
			);
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
				// stats.hzwd.xyz = Umami. Beide Richtungen noetig: script-src fuer das
				// Laden, connect-src fuer den Beacon. Ohne connect-src laedt der
				// Tracker, initialisiert sich und sendet nie etwas - lautlos, weil
				// Astro das CSP-<meta> ans ENDE des <head> setzt: alles davor
				// (unser <script>) ist noch ungeregelt, jeder spaetere Request nicht.
				"connect-src 'self' https://api.mcstatus.io https://stats.hzwd.xyz", // ServerStatus.astro, Umami
				'frame-src https://www.youtube-nocookie.com https://dynmap.voidtales.win', // video facade, world map
				"base-uri 'self'",
				"form-action 'none'",
				"object-src 'none'",
			],
			// Pagefind sucht in einem WebAssembly-Modul. Ohne 'wasm-unsafe-eval'
			// blockt Chrome die Instanziierung und /search bleibt stumm. Das
			// Schluesselwort erlaubt WASM und sonst nichts - insbesondere kein
			// eval() und kein Inline-Script; die Hashes bleiben unangetastet.
			scriptDirective: {
				resources: ["'self'", "'wasm-unsafe-eval'", 'https://stats.hzwd.xyz'],
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
			//  /impressum/, /datenschutz/ - tragen noindex, gehoeren in keinen Index.
			filter: (page) =>
				!['/search/', '/impressum/', '/datenschutz/'].some((p) => page.includes(p)) &&
				!page.endsWith('/devlog/'),
			// Ohne lastmod sieht fuer einen Crawler jede der ~56 URLs gleich alt aus.
			serialize(item) {
				const path = new URL(item.url).pathname.replace(/\/$/, '') || '/';
				const lastmod = contentDates[path];
				return lastmod ? { ...item, lastmod } : item;
			},
		}),
	],

	markdown: {
		processor: satteri({ hastPlugins: [satteriImageSizes, satteriYoutube] }),
	},

	// Self-hosted, build-time fetched Google Fonts (no runtime request to
	// fonts.googleapis.com).
	// The cssVariables are deliberately named after the family, not after the
	// role: `--font-display` / `--font-body` are owned by the `@theme inline`
	// block in global.css, which points them at these.
	fonts: [
		// Local and trimmed: the pages only use 600 and 800, the Google file carries 200-900.
		// fonttools varLib.instancer wght=600:800, same 226 characters, 51 down to 35 KB.
		{
			provider: fontProviders.local(),
			name: 'Unbounded',
			cssVariable: '--font-unbounded',
			options: {
				variants: [
					{
						weight: '600 800',
						style: 'normal',
						src: ['./src/assets/fonts/unbounded-600-800.woff2'],
					},
				],
			},
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
