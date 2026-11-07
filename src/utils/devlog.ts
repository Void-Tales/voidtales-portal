import type { CollectionEntry } from 'astro:content';
import { berlinDay } from './berlin.js';

// The id of a day block on a devlog page: day plus author. Shared by the month page,
// the start page and the feed, which all link straight to a block.
export const devlogSlug = (s = '') =>
	s
		.toLowerCase()
		.normalize('NFKD')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');

export const devlogAnchor = (day: string, author?: string) =>
	[day, devlogSlug(author)].filter(Boolean).join('-');

type Entry = CollectionEntry<'devlog'>;
export type DevlogGroup = {
	id: string;
	day: string;
	author?: string;
	date: Date;
	reboot: boolean;
	entries: Entry[];
};

// A day of messages by the same person is one thought, so it renders as one block
// with the messages as consecutive paragraphs. Grouping lives here and not in the
// import, which keeps the n8n side at "write one file".
// The anchor is day plus author: two people posting on the same day gave two blocks
// with the same id. Counted in time order, so a new post never renumbers an older
// block. Reboot posts get their own blocks and their own anchors (`reboot-…`), so a
// Reboot post never changes the id of a regular block on the same day.
// Oldest first.
export function devlogGroups(entries: Entry[]): DevlogGroup[] {
	const groups: DevlogGroup[] = [];
	const seen = new Map<string, number>();
	for (const entry of [...entries].sort((a, b) => a.data.date.valueOf() - b.data.date.valueOf())) {
		const day = berlinDay(entry.data.date);
		const reboot = entry.data.track === 'reboot';
		const last = groups.at(-1);
		if (last && last.day === day && last.author === entry.data.author && last.reboot === reboot) {
			last.entries.push(entry);
			continue;
		}
		const base = (reboot ? 'reboot-' : '') + devlogAnchor(day, entry.data.author);
		const n = (seen.get(base) ?? 0) + 1;
		seen.set(base, n);
		groups.push({
			id: n === 1 ? base : `${base}-${n}`,
			day,
			author: entry.data.author,
			date: entry.data.date,
			reboot,
			entries: [entry],
		});
	}
	return groups;
}
