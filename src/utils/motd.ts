// Parser for Minecraft's legacy formatting codes (§ + one character).
//
// Why this exists: api.mcstatus.io also returns `motd.html`, but that would mean
// putting third-party markup into our DOM. This turns the raw string into plain
// data instead — the caller builds text nodes from it, so nothing from the
// server is ever parsed as HTML.

export interface MotdSegment {
	text: string;
	/** Hex colour from COLORS, or null for "inherit". Never taken from the input. */
	color: string | null;
	bold: boolean;
	italic: boolean;
	underline: boolean;
	strike: boolean;
}

export const COLORS: Record<string, string> = {
	'0': '#000000',
	'1': '#0000aa',
	'2': '#00aa00',
	'3': '#00aaaa',
	'4': '#aa0000',
	'5': '#aa00aa',
	'6': '#ffaa00',
	'7': '#aaaaaa',
	'8': '#555555',
	'9': '#5555ff',
	a: '#55ff55',
	b: '#55ffff',
	c: '#ff5555',
	d: '#ff55ff',
	e: '#ffff55',
	f: '#ffffff',
};

// The MOTD field is #14121a in both themes. Minecraft's dark codes fail WCAG AA
// (4.5:1) there: §9 blue sits at 3.65, black and dark blue are near invisible.
// Lifted towards white just far enough to pass, hue kept. MOTD only: item
// tooltips (minimessage.ts) keep the game's exact palette.
const MOTD_COLORS: Record<string, string> = {
	...COLORS,
	'0': '#808080',
	'1': '#7575d1',
	'4': '#c95e5e',
	'5': '#c44dc4',
	'8': '#808080',
	'9': '#6d6dff',
};

const RESET: Omit<MotdSegment, 'text'> = {
	color: null,
	bold: false,
	italic: false,
	underline: false,
	strike: false,
};

export function parseMotd(raw: string): MotdSegment[] {
	const segments: MotdSegment[] = [];
	let style = { ...RESET };

	const push = (text: string) => {
		if (text) segments.push({ text, ...style });
	};

	const [head, ...rest] = raw.split('§');
	push(head);

	for (const chunk of rest) {
		const code = chunk[0]?.toLowerCase();
		let text = chunk.slice(1);

		if (code && code in MOTD_COLORS) {
			// A colour code also clears formatting, like the vanilla client does.
			style = { ...RESET, color: MOTD_COLORS[code] };
		} else if (code === 'l') style.bold = true;
		else if (code === 'o') style.italic = true;
		else if (code === 'n') style.underline = true;
		else if (code === 'm') style.strike = true;
		else if (code === 'r') style = { ...RESET };
		else if (code === 'k') {
			// Obfuscated text: rendered as-is instead of animated scrambling.
		} else {
			// Unknown code — keep the character as literal text rather than dropping it.
			text = chunk;
		}

		push(text);
	}

	return segments;
}
