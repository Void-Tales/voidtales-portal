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
	category: 'equipment' | 'consumable' | 'statgem' | 'effectgem' | 'heirloom' | 'gemtool' | 'other';
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
	{ key: 'heirloom', label: 'Heirlooms' },
	{ key: 'gemtool', label: 'Gem Tools' },
	{ key: 'other', label: 'Other' },
] as const;

export const STATUS_LABEL: Record<ItemStatus, string | null> = {
	live: null,
	experimental: 'Experimental',
	changedOnTest: 'Changes in testing',
};

export const regionLabel = (item: Item) => item.region ?? 'General';

/** The region when it says something: "General" is the absence of one, and "Gemstones" is a folder, not a place. */
export const regionShown = (item: Item) =>
	item.region && item.region !== 'Gemstones' ? item.region : null;

/** Lore as the game has it, without the placeholder a writer left for later. */
export function loreLines(item: Item): string[] {
	const at = item.lore.findIndex((l) => /^insert lore later$/i.test(plainText(l).trim()));
	if (at < 0) return item.lore;
	// The separator above the placeholder would be left alone otherwise.
	const end = plainText(item.lore[at - 1] ?? '').trim() === '—' ? at - 1 : at;
	return [...item.lore.slice(0, end), ...item.lore.slice(at + 1)];
}

/** Same group first, then same category: what to look at next from an item page. */
export function relatedItems(item: Item, count = 6): Item[] {
	const others = items.filter((i) => i.id !== item.id);
	const group = others.filter((i) => i.group === item.group && i.category === item.category);
	const category = others.filter((i) => i.category === item.category && !group.includes(i));
	return [...group, ...category].slice(0, count);
}

export const generated = new Date(data.generated);

const order = (i: Item) => CATEGORIES.findIndex((c) => c.key === i.category);

// The bundle has one "gem" category; the page splits it by id, the same prefix
// export.py lets through.
const gemKind = (id: string) =>
	id.startsWith('StatGem')
		? 'statgem'
		: id.startsWith('EffectGem')
			? 'effectgem'
			: id.startsWith('Heirloom')
				? 'heirloom'
				: 'gemtool';

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
	const lore = loreLines(item);
	const at = lore.findIndex((l) => plainText(l) === '—');
	return at < 0
		? ''
		: lore
				.slice(at + 1)
				.map(plainText)
				.join(' ')
				.trim();
}
