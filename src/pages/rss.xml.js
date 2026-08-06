import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { siteConfig } from '../config/site.js';
import { excerpt } from '../utils/excerpt';

// Nur News, nicht der Devlog: der Devlog hat keine Eintrags-URLs, sondern
// Tagesanker in Monatsseiten. Ein Feed aus Ankern liefert jedem Reader
// dieselbe Seite mehrfach.
export async function GET(context) {
	const entries = (await getCollection('news')).sort(
		(a, b) => b.data.pubDatetime.valueOf() - a.data.pubDatetime.valueOf()
	);

	return rss({
		title: siteConfig.name,
		description: 'Announcements from the world of Void Tales.',
		site: context.site ?? siteConfig.url,
		items: entries.map((entry) => ({
			title: entry.data.title,
			pubDate: entry.data.pubDatetime,
			link: `/news/${entry.data.slug}/`,
			description:
				entry.data.description && !entry.data.description.trim().endsWith('...')
					? entry.data.description
					: excerpt(entry.body ?? ''),
		})),
	});
}
