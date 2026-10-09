// The item catalogue as the pages see it: src/generated/items.json, written by
// scripts/items.mjs from the nightly bundle. Missing on a bare checkout until
// `pnpm run prebuild` has run once.
import data from '../generated/items.json';
import { plainText } from './minimessage.ts';

export type ItemStatus = 'live' | 'experimental' | 'changedOnTest';

export interface Item {
	id: string;
	name: string;
	lore: string[];
	type: string[];
	status: ItemStatus;
	category: 'equipment' | 'consumable' | 'statgem' | 'effectgem' | 'other';
	region: string | null;
	group: string;
	file: string;
	material: string;
	icon: string;
	iconMissing: boolean;
}

export const CATEGORIES = [
	{ key: 'equipment', label: 'Equipment' },
	{ key: 'consumable', label: 'Consumables' },
	{ key: 'statgem', label: 'Stat Gems' },
	{ key: 'effectgem', label: 'Effect Gems' },
	{ key: 'other', label: 'Other' },
] as const;

export const STATUS_LABEL: Record<ItemStatus, string | null> = {
	live: null,
	experimental: 'Experimental',
	changedOnTest: 'Changes in testing',
};

export const regionLabel = (item: Item) => item.region ?? 'General';

export const generated = new Date(data.generated);

const order = (i: Item) => CATEGORIES.findIndex((c) => c.key === i.category);

// The bundle has one "gem" category; the page splits it by id, the same prefix
// export.py lets through.
const gemKind = (id: string) => (id.startsWith('StatGem') ? 'statgem' : 'effectgem');

export const items: Item[] = data.items
	.map((i) => ({ ...i, category: i.category === 'gem' ? gemKind(i.id) : i.category }) as Item)
	.toSorted(
		(a, b) =>
			order(a) - order(b) ||
			regionLabel(a).localeCompare(regionLabel(b)) ||
			a.group.localeCompare(b.group) ||
			plainText(a.name).localeCompare(plainText(b.name))
	);

/** The flavour text: every line after the "—" separator. */
export function flavour(item: Item): string {
	const at = item.lore.findIndex((l) => plainText(l) === '—');
	return at < 0
		? ''
		: item.lore
				.slice(at + 1)
				.map(plainText)
				.join(' ')
				.trim();
}
