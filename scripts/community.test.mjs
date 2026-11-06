// node scripts/community.test.mjs: what the strip must never show.
import assert from 'node:assert/strict';
import { pick, realTitle } from './community.mjs';

const shot = (id, author, date, extra = {}) => ({
	id,
	author,
	date,
	title: 'image',
	isDefault: false,
	width: 1920,
	...extra,
});

// Likes beat age, the per-author cap holds, spoilers, defaults and small images stay out.
const images = [
	shot('new1', 'a', '2026-09-01'),
	shot('new2', 'a', '2026-08-01'),
	shot('new3', 'a', '2026-07-01'),
	shot('new4', 'a', '2026-06-01'),
	shot('old', 'b', '2025-01-01'),
	shot('liked', 'c', '2024-01-01'),
	shot('spoiler', 'd', '2026-10-01', { title: 'SPOILER_2026-10-01_12.00.00' }),
	shot('default', 'e', '2026-10-01', { isDefault: true }),
	shot('small', 'f', '2026-10-01', { width: 800 }),
];
const out = pick(images, { liked: { likes: 2, comments: 0 } }).map((i) => i.id);
assert.deepEqual(out, ['liked', 'new1', 'new2', 'new3', 'old']);

// A title only counts when somebody wrote it.
for (const t of [
	'image',
	'image-24',
	'default-3',
	'2026-02-01_18.55.16',
	'SPOILER_2025-10-15_18.22.38',
])
	assert.equal(realTitle(t), '');
assert.equal(realTitle('shin_vs_cyn_3'), 'shin vs cyn 3');
console.log('community: ok');
