// Self-check for the item text parser: node src/utils/minimessage.test.ts
import assert from 'node:assert/strict';
import { parseMiniMessage, plainText, toRuns } from './minimessage.ts';

const pick = (raw: string) => parseMiniMessage(raw).map((s) => [s.text, s.color, s.bold, s.italic]);

// A real lore line: hex colour, then a legacy code that recolours the rest.
assert.deepEqual(pick('<color:#DEBF66>🔻 &7Blade'), [
	['🔻 ', '#debf66', false, false],
	['Blade', '#aaaaaa', false, false],
]);

// &l before a MiniMessage colour keeps the bold (section headers look like this).
assert.deepEqual(pick('&l<color:#DEBF66>Base Stats'), [['Base Stats', '#debf66', true, false]]);

// Italic value after a label, same colour.
assert.deepEqual(pick('<color:#C6F7EC>Damage: &o20'), [
	['Damage: ', '#c6f7ec', false, false],
	['20', '#c6f7ec', false, true],
]);

// MythicMobs escapes.
assert.equal(plainText('Dodge <color:#E0DB8D><&lb>Drop<&rb>'), 'Dodge [Drop]');
assert.equal(plainText('&7Cooldown<&co><&sp>5s'), 'Cooldown: 5s');

// A gradient spans segments until it is closed, then a colour takes over; an
// unclosed gradient runs to the end, as in game.
const name = parseMiniMessage(
	'<gradient:#bdbdbd:#a9a9b5:#8b8b97>Strength &lGem</gradient> <color:#bdbdbd>| +0.5'
);
const runs = toRuns(name);
assert.deepEqual(runs[0].gradient, ['#bdbdbd', '#a9a9b5', '#8b8b97']);
assert.deepEqual(
	runs[0].segments.map((s) => [s.text, s.bold]),
	[
		['Strength ', false],
		['Gem', true],
	]
);
assert.equal(runs[1].gradient, null);
assert.equal(parseMiniMessage('<gradient:#C8C8C8:#8E8E8E>Assassin Hood I')[0].gradient?.length, 2);

// Unknown tags vanish, a lone & stays text.
assert.equal(plainText('<glyph:coin>Salt & Pepper'), 'Salt & Pepper');

// Nothing from the input reaches a colour value unless it is a clean #rrggbb.
assert.ok(
	parseMiniMessage(
		'<color:red;background:url(x)>a<color:#12345g>b<gradient:#fff:javascript>c'
	).every(
		(s) =>
			(s.color === null || /^#[0-9a-f]{6}$/.test(s.color)) &&
			(s.gradient === null || s.gradient.every((c) => /^#[0-9a-f]{6}$/.test(c)))
	),
	'colours must be validated'
);

console.log('minimessage parser: all checks passed');
