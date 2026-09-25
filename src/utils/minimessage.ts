// Parser for the item text in the catalogue: MythicMobs lore and names, a mix
// of MiniMessage tags (<color:#hex>, <gradient:a:b[:c]>) and legacy &-codes.
//
// Same rule as the MOTD parser next door: the input becomes plain data, never
// markup. Colours come only from the fixed legacy table or a validated
// #rrggbb, so nothing from the item files can reach a style attribute
// unchecked. Unknown tags are dropped (they are formatting like glyphs or
// fonts, not text); unknown &-sequences stay visible as text.

import { COLORS } from './motd.ts';

export interface MiniSegment {
	text: string;
	/** '#rrggbb' or null for the surrounding colour. */
	color: string | null;
	/** Colour stops of the gradient this text is part of, or null. */
	gradient: string[] | null;
	bold: boolean;
	italic: boolean;
	underline: boolean;
	strike: boolean;
}

/** Consecutive segments that share one gradient, so it can span them like in game. */
export interface MiniRun {
	gradient: string[] | null;
	segments: MiniSegment[];
}

// MythicMobs escapes for characters its own parser would otherwise eat.
const ESCAPES: Record<string, string> = {
	'&lb': '[',
	'&rb': ']',
	'&sp': ' ',
	'&co': ':',
	'&sq': "'",
	'&dq': '"',
	'&da': '-',
	'&cm': ',',
	'&sc': ';',
	'&eq': '=',
	'&ha': '#',
	'&lc': '{',
	'&rc': '}',
	'&lt': '<',
	'&gt': '>',
};

const NAMED: Record<string, string> = {
	black: COLORS['0'],
	dark_blue: COLORS['1'],
	dark_green: COLORS['2'],
	dark_aqua: COLORS['3'],
	dark_red: COLORS['4'],
	dark_purple: COLORS['5'],
	gold: COLORS['6'],
	gray: COLORS['7'],
	dark_gray: COLORS['8'],
	blue: COLORS['9'],
	green: COLORS.a,
	aqua: COLORS.b,
	red: COLORS.c,
	light_purple: COLORS.d,
	yellow: COLORS.e,
	white: COLORS.f,
};

const DECORATIONS: Record<
	string,
	keyof Pick<MiniSegment, 'bold' | 'italic' | 'underline' | 'strike'>
> = {
	bold: 'bold',
	b: 'bold',
	italic: 'italic',
	i: 'italic',
	em: 'italic',
	underlined: 'underline',
	u: 'underline',
	strikethrough: 'strike',
	st: 'strike',
};

const LEGACY_DECO: Record<string, keyof typeof DECORATIONS> = {
	l: 'bold',
	o: 'italic',
	n: 'u',
	m: 'st',
};

const HEX = /^#[0-9a-f]{6}$/;

function colour(value: string): string | null {
	const v = value.toLowerCase();
	return HEX.test(v) ? v : (NAMED[v] ?? null);
}

export function parseMiniMessage(raw: string): MiniSegment[] {
	const out: MiniSegment[] = [];
	let style = {
		color: null as string | null,
		bold: false,
		italic: false,
		underline: false,
		strike: false,
	};
	let gradient: string[] | null = null;

	const push = (text: string) => {
		if (!text) return;
		const last = out.at(-1);
		const same =
			last &&
			last.gradient === gradient &&
			last.color === style.color &&
			last.bold === style.bold &&
			last.italic === style.italic &&
			last.underline === style.underline &&
			last.strike === style.strike;
		if (same) last.text += text;
		else out.push({ text, gradient, ...style });
	};

	// Tags, legacy codes (& or §) and everything in between.
	for (const [token] of raw.matchAll(/<[^<>]*>|[&§][0-9a-fk-or]|[^<&§]+|[<&§]/gi)) {
		if (token.startsWith('<') && token.endsWith('>')) {
			const tag = token.slice(1, -1);
			if (tag in ESCAPES) {
				push(ESCAPES[tag]);
				continue;
			}
			const [name, ...args] = tag.toLowerCase().split(':');
			if (name === 'color' || name === 'colour' || name === 'c') {
				style.color = colour(args[0] ?? '');
				gradient = null;
			} else if (name in NAMED) {
				style.color = NAMED[name];
				gradient = null;
			} else if (name === 'gradient') {
				const stops = args.map(colour).filter((c): c is string => c !== null);
				// A fresh array per tag: runs are grouped by identity.
				gradient = stops.length >= 2 ? stops : null;
			} else if (name === '/gradient') {
				gradient = null;
			} else if (name === '/color' || name === '/colour' || name === '/c') {
				style.color = null;
			} else if (name in DECORATIONS) {
				style[DECORATIONS[name]] = true;
			} else if (name.startsWith('/') && name.slice(1) in DECORATIONS) {
				style[DECORATIONS[name.slice(1)]] = false;
			} else if (name === 'reset' || name === 'r') {
				style = { color: null, bold: false, italic: false, underline: false, strike: false };
				gradient = null;
			}
			continue;
		}
		if (/^[&§][0-9a-fk-or]$/i.test(token)) {
			const code = token[1].toLowerCase();
			if (code in COLORS) {
				// Like the vanilla client: a colour code clears the formatting.
				style = {
					color: COLORS[code],
					bold: false,
					italic: false,
					underline: false,
					strike: false,
				};
				gradient = null;
			} else if (code in LEGACY_DECO) style[DECORATIONS[LEGACY_DECO[code]]] = true;
			else if (code === 'r') {
				style = { color: null, bold: false, italic: false, underline: false, strike: false };
				gradient = null;
			}
			// &k (obfuscated) is shown as plain text.
			continue;
		}
		push(token);
	}
	return out;
}

/** Groups segments into runs that share one gradient. */
export function toRuns(segments: MiniSegment[]): MiniRun[] {
	const runs: MiniRun[] = [];
	for (const s of segments) {
		const last = runs.at(-1);
		if (last && s.gradient && last.gradient === s.gradient) last.segments.push(s);
		else runs.push({ gradient: s.gradient, segments: [s] });
	}
	return runs;
}

/** Plain text, for titles, alt text and search. */
export const plainText = (raw: string) =>
	parseMiniMessage(raw)
		.map((s) => s.text)
		.join('')
		.trim();
