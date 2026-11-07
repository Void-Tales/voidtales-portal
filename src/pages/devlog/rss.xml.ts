import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { siteConfig } from '../../config/site.js';
import { berlinDay, berlinMonth } from '../../utils/berlin.js';
import { devlogGroups } from '../../utils/devlog';
import { excerpt } from '../../utils/excerpt';

const dayFormat = new Intl.DateTimeFormat('en-GB', {
	day: 'numeric',
	month: 'long',
	year: 'numeric',
	timeZone: 'Europe/Berlin',
});

// One item per day block, linked to its anchor on the month page, so every item
// has its own URL. Today's blocks are left out: a block grows while its author keeps
// posting, and most readers never fetch an item again once they've seen it. The
// nightly build picks the day up once it's over.
// Reboot blocks keep the veil here too: a date and a hint, no words from the post.
export async function GET(context: APIContext) {
	const today = berlinDay(new Date());
	const groups = devlogGroups(await getCollection('devlog'))
		.filter((g) => g.day < today)
		.reverse();

	return rss({
		title: `${siteConfig.name} Devlog`,
		description: 'Day-by-day progress on Void Tales, straight from the team.',
		site: context.site ?? siteConfig.url,
		// Otherwise the package appends a slash to every link, after the anchor.
		trailingSlash: false,
		items: groups.map((g) => ({
			title: `${g.reboot ? 'Reboot' : 'Devlog'}: ${dayFormat.format(g.date)}${g.author ? `, ${g.author}` : ''}`,
			pubDate: g.date,
			link: `/devlog/${berlinMonth(g.date)}/#${g.id}`,
			description: g.reboot
				? 'Something stirs in the Reboot. Look closer on the devlog.'
				: excerpt(g.entries.map((e) => e.body ?? '').join('\n\n'), 300),
		})),
	});
}
