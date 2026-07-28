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
	fonts: [
		{
			provider: fontProviders.google(),
			name: 'Asul',
			cssVariable: '--font-body',
			weights: [400, 700],
		},
		{
			provider: fontProviders.google(),
			name: 'Cinzel Decorative',
			cssVariable: '--font-display',
			weights: [400, 700],
		},
	],

	vite: {
		plugins: [tailwindcss()],
	},
});
