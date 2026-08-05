import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// News keeps the frontmatter shape the old blog used, so the slugs the forum
// and blog redirects point at stay valid. `slug` drives the URL, not the
// filename.
const news = defineCollection({
	loader: glob({ base: './src/content/news', pattern: '**/*.md' }),
	schema: z.object({
		title: z.string(),
		pubDatetime: z.coerce.date(),
		slug: z.string(),
		description: z.string().optional(),
		featured: z.boolean().default(false),
	}),
});

// One file per Discord message on purpose: grouping into day blocks happens in
// the template, so the n8n pipeline only ever appends a file and never has to
// edit an existing one.
const devlog = defineCollection({
	loader: glob({ base: './src/content/devlog', pattern: '**/*.md' }),
	schema: z.object({
		date: z.coerce.date(),
		author: z.string().optional(),
	}),
});

export const collections = { news, devlog };
