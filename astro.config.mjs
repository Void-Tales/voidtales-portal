import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { siteConfig } from './src/config/site.js';

export default defineConfig({
	site: siteConfig.url,

	// Fully static: the site has no data source and no server-side secrets.
	output: 'static',

	integrations: [sitemap()],

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
