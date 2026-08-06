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
				"frame-src https://www.youtube-nocookie.com", // trailer embed
				"base-uri 'self'",
				"form-action 'none'",
				"object-src 'none'",
			],
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

	integrations: [sitemap()],

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
