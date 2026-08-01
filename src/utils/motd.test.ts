// Self-check for the MOTD parser: node src/utils/motd.test.ts
import assert from 'node:assert/strict';
import { parseMotd } from './motd.ts';

// The live Void Tales MOTD.
const live = parseMotd('§dChap§9ter 1.1\n§dEnter Th§9e Void Update');
assert.deepEqual(
	live.map((s) => [s.text, s.color]),
	[
		['Chap', '#ff55ff'],
		['ter 1.1\n', '#5555ff'],
		['Enter Th', '#ff55ff'],
		['e Void Update', '#5555ff'],
	]
);

// Text before the first code keeps the default style.
assert.deepEqual(parseMotd('plain §cred')[0], {
	text: 'plain ',
	color: null,
	bold: false,
	italic: false,
	underline: false,
	strike: false,
});

// Formatting stacks, a colour resets it, §r clears everything.
const styled = parseMotd('§l§obold italic§cred§rplain');
assert.deepEqual(styled[0], {
	text: 'bold italic',
	color: null,
	bold: true,
	italic: true,
	underline: false,
	strike: false,
});
assert.equal(styled[1].bold, false, 'colour code must clear formatting');
assert.equal(styled[1].color, '#ff5555');
assert.deepEqual(styled[2], {
	text: 'plain',
	color: null,
	bold: false,
	italic: false,
	underline: false,
	strike: false,
});

// Unknown codes stay visible instead of silently eating a character.
assert.equal(
	parseMotd('§zweird')
		.map((s) => s.text)
		.join(''),
	'zweird'
);

// Nothing from the input can end up in a colour value.
assert.ok(
	parseMotd('§d"><script>alert(1)</script>').every(
		(s) => s.color === null || /^#[0-9a-f]{6}$/.test(s.color)
	),
	'colours must come from the fixed table only'
);

console.log('motd parser: all checks passed');
