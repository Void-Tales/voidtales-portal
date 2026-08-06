// Rendert alle OpenGraph-Karten (1200x630) aus einem SVG-Template: die
// Standardkarte der Seite plus je eine pro News-Eintrag und pro Devlog-Monat.
//
// Laeuft NACH `astro build` und schreibt direkt nach dist/ - die Fonts kommen
// aus dist/_astro/fonts/, und die HTML-Seiten verweisen ohnehin nur auf einen
// vorhersagbaren Pfad (/images/og/...), der zum Zeitpunkt des Deploys da ist.
//
// Fonts: sharp rendert SVG-Text ueber librsvg/pango, und das sieht
// ausschliesslich fontconfig-Fonts. Unbounded und Instrument Sans sind keine
// Systemfonts, liegen aber nach dem Build als woff2 in dist/. Die werden hier
// nach ttf entpackt (Binary woff2_decompress) und ueber eine temporaere
// fonts.conf bekanntgemacht. sharp wird erst DANACH importiert - fontconfig
// liest die Env beim ersten Text-Render, nicht spaeter.
//
// Doku: .claude/skills/brand-assets/SKILL.md
import { execFileSync } from 'node:child_process';
import {
	globSync,
	mkdtempSync,
	mkdirSync,
	copyFileSync,
	writeFileSync,
	readFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';

const OUT_DIR = 'dist/images/og';

// --- Fonts bereitstellen ---------------------------------------------------

const woff2Files = globSync('dist/_astro/fonts/*.woff2');
if (woff2Files.length === 0) {
	console.error('Keine Fonts in dist/_astro/fonts/ - erst "astro build" laufen lassen.');
	process.exit(1);
}
const fontDir = mkdtempSync(join(tmpdir(), 'og-fonts-'));
for (const f of woff2Files) {
	const target = join(fontDir, basename(f));
	copyFileSync(f, target);
	execFileSync('woff2_decompress', [target]); // schreibt .ttf daneben
}
writeFileSync(
	join(fontDir, 'fonts.conf'),
	`<?xml version="1.0"?>\n<!DOCTYPE fontconfig SYSTEM "fonts.dtd">\n<fontconfig>\n  <dir>${fontDir}</dir>\n  <cachedir>${fontDir}/cache</cachedir>\n</fontconfig>\n`
);
process.env.FONTCONFIG_FILE = join(fontDir, 'fonts.conf');

const sharp = (await import('sharp')).default;

// --- Design-Tokens ---------------------------------------------------------
// Spiegeln das Dark-Theme aus src/styles/global.css. Bei Farbwechsel hier mit.

const W = 1200;
const H = 630;
const bg = '#0a0714';
const bgRaised = '#140f22';
const text = '#ece8f6';
const muted = '#9b93b3';
const accent = '#a78bfa';

const shot = await sharp('public/images/index-dark.webp')
	.resize(W, H, { fit: 'cover' })
	.png()
	.toBuffer();
const shotUri = `data:image/png;base64,${shot.toString('base64')}`;

// --- Hilfsmittel -----------------------------------------------------------

const escape = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Zeichenbreite geschaetzt statt gemessen: echte Metriken braeuchten einen
// Font-Parser fuer einen Umbruch, der nur grob stimmen muss. Die Faktoren sind
// an beiden Familien abgelesen; Unbounded ist deutlich breiter als die Sans.
const wrap = (str, fontSize, factor, maxWidth, maxLines) => {
	const perChar = fontSize * factor;
	const limit = Math.max(8, Math.floor(maxWidth / perChar));
	const lines = [];
	let line = '';
	for (const word of String(str).split(/\s+/)) {
		const candidate = line ? `${line} ${word}` : word;
		if (candidate.length <= limit) {
			line = candidate;
		} else {
			if (line) lines.push(line);
			line = word;
			if (lines.length === maxLines) break;
		}
	}
	if (line && lines.length < maxLines) lines.push(line);
	if (lines.length === maxLines && lines.join(' ').length < String(str).length) {
		lines[maxLines - 1] = `${lines[maxLines - 1].replace(/[\s.,;:!?-]+$/, '')}…`;
	}
	return lines;
};

const defs = `
  <defs>
    <linearGradient id="scrim" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${bg}" stop-opacity="0.98"/>
      <stop offset="52%" stop-color="${bg}" stop-opacity="0.88"/>
      <stop offset="100%" stop-color="${bg}" stop-opacity="0.18"/>
    </linearGradient>
    <linearGradient id="floor" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0%" stop-color="${bg}" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="${bg}" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="glowTL" cx="0" cy="0" r="1">
      <stop offset="0%" stop-color="rgb(167 139 250 / 18%)"/>
      <stop offset="100%" stop-color="rgb(167 139 250 / 0%)"/>
    </radialGradient>
    <filter id="titleGlow" x="-30%" y="-60%" width="160%" height="220%">
      <feGaussianBlur stdDeviation="10" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="vGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="1.6" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <linearGradient id="vbg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${bgRaised}"/>
      <stop offset="100%" stop-color="${bg}"/>
    </linearGradient>
  </defs>`;

const backdrop = `
  <rect width="${W}" height="${H}" fill="${bg}"/>
  <image href="${shotUri}" x="0" y="0" width="${W}" height="${H}"/>
  <rect width="${W}" height="${H}" fill="url(#scrim)"/>
  <rect x="0" y="${H - 200}" width="${W}" height="200" fill="url(#floor)"/>
  <ellipse cx="120" cy="80" rx="700" ry="500" fill="url(#glowTL)"/>`;

// Domain-Badge mit dem V-Mark des Favicons. y ist variabel, weil die
// Eintragskarten unten mehr Text tragen als die Startseiten-Karte.
const badge = (y) => `
  <g transform="translate(84 ${y})">
    <rect width="44" height="44" rx="10" fill="url(#vbg)" stroke="rgb(236 232 246 / 12%)"/>
    <path d="M11 10.5 L22 31.5 L33 10.5" fill="none" stroke="${accent}" stroke-width="5"
          stroke-linecap="round" stroke-linejoin="round" filter="url(#vGlow)"/>
    <text x="62" y="29" font-family="Instrument Sans" font-weight="500" font-size="22"
          fill="${text}">portal.voidtales.win</text>
  </g>`;

const render = async (svg, file) => {
	await sharp(Buffer.from(svg), { density: 96 }).webp({ quality: 88 }).toFile(file);
};

// --- Startseiten-Karte -----------------------------------------------------
// Ersetzt das frueher von Hand angestossene gen-og.mjs. Copy spiegelt
// siteConfig.hero in src/config/site.js.

const heroCard = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${defs}${backdrop}
  <text x="84" y="176" font-family="monospace" font-size="19" letter-spacing="5" fill="${muted}">MINECRAFT MODPACK AND SERVER</text>
  <text x="84" y="266" font-family="Unbounded" font-weight="800" font-size="62" fill="${text}">Void</text>
  <text x="84" y="352" font-family="Unbounded" font-weight="800" font-size="62" fill="${accent}" filter="url(#titleGlow)">Tales</text>
  <text x="84" y="414" font-family="Instrument Sans" font-size="24" fill="${muted}">Six shattered realms, the fragments of a fallen</text>
  <text x="84" y="448" font-family="Instrument Sans" font-size="24" fill="${muted}">goddess, and the Soul Station between them.</text>
  ${badge(500)}
</svg>`;

// --- Eintragskarte ---------------------------------------------------------

const entryCard = ({ eyebrow, title, body }) => {
	// Titelgroesse stuft sich nach Laenge, damit ein langer Discord-Titel nicht
	// aus dem Bild laeuft und ein kurzer nicht verloren wirkt.
	const size = title.length <= 34 ? 56 : title.length <= 70 ? 46 : 40;
	const titleLines = wrap(title, size, 0.62, 1010, 3);
	const bodyLines = body ? wrap(body, 23, 0.5, 1000, 2) : [];

	const titleTop = 232;
	const lineHeight = size * 1.22;
	const titleSvg = titleLines
		.map(
			(l, i) =>
				`<text x="84" y="${titleTop + i * lineHeight}" font-family="Unbounded" font-weight="800" font-size="${size}" fill="${i === 0 ? text : accent}"${i === 0 ? '' : ' filter="url(#titleGlow)"'}>${escape(l)}</text>`
		)
		.join('\n  ');

	const bodyTop = titleTop + titleLines.length * lineHeight + 14;
	const bodySvg = bodyLines
		.map(
			(l, i) =>
				`<text x="84" y="${bodyTop + i * 32}" font-family="Instrument Sans" font-size="23" fill="${muted}">${escape(l)}</text>`
		)
		.join('\n  ');

	return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${defs}${backdrop}
  <text x="84" y="160" font-family="monospace" font-size="19" letter-spacing="5" fill="${muted}">${escape(eyebrow)}</text>
  ${titleSvg}
  ${bodySvg}
  ${badge(H - 130)}
</svg>`;
};

// --- Inhalte einlesen ------------------------------------------------------
// Frontmatter wird hier von Hand geparst statt ueber astro:content: das Script
// laeuft ausserhalb von Astro, und die Felder sind flach und bekannt.

const frontmatter = (file) => {
	const raw = readFileSync(file, 'utf8');
	const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
	if (!match) return null;
	const data = { _body: raw.slice(match[0].length) };
	for (const line of match[1].split(/\r?\n/)) {
		const kv = line.match(/^(\w+):\s*(.*)$/);
		if (!kv) continue;
		let value = kv[2].trim();
		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1).replace(/\\n/g, ' ').replace(/\\"/g, '"');
		}
		data[kv[1]] = value;
	}
	return data;
};

// Der Auszug kommt aus dem Markdown-Body, nicht aus data.description: die wird
// vom Discord-Import hart auf 100 Zeichen gekappt und endet mitten im Wort
// ("...loyal compan..."). Auf einer Vorschaukarte ist das gut sichtbar.
// Dieselbe Regel steckt in src/utils/excerpt.ts fuer die Meta-Description -
// beide Seiten muessen denselben Text zeigen.
const excerpt = (body, max = 150) => {
	const plain = body
		.replace(/!\[[^\]]*\]\([^)]*\)/g, '') // Bilder
		.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // Links auf ihren Text
		.replace(/[#*_>`~]/g, '')
		.replace(/\s+/g, ' ')
		.trim();
	if (plain.length <= max) return plain;
	const cut = plain.slice(0, max);
	return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[\s.,;:!?-]+$/, '')}…`;
};

const dateLabel = (iso) =>
	new Intl.DateTimeFormat('en-GB', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
		timeZone: 'UTC',
	})
		.format(new Date(iso))
		.toUpperCase();

mkdirSync(OUT_DIR, { recursive: true });
await render(heroCard, `${OUT_DIR}/default.webp`);
let count = 1;

for (const file of globSync('src/content/news/**/*.md')) {
	const data = frontmatter(file);
	if (!data?.slug || !data.title) continue;
	await render(
		entryCard({
			eyebrow: `NEWS · ${dateLabel(data.pubDatetime)}`,
			title: data.title,
			body: excerpt(data._body),
		}),
		`${OUT_DIR}/news-${data.slug}.webp`
	);
	count++;
}

const months = new Set();
for (const file of globSync('src/content/devlog/**/*.md')) {
	const data = frontmatter(file);
	if (data?.date) months.add(new Date(data.date).toISOString().slice(0, 7));
}
for (const month of months) {
	const label = new Intl.DateTimeFormat('en-GB', {
		month: 'long',
		year: 'numeric',
		timeZone: 'UTC',
	}).format(new Date(`${month}-01T00:00:00Z`));
	await render(
		entryCard({
			eyebrow: 'DEVLOG',
			title: label,
			body: 'Day-to-day progress on Void Tales, straight from the team.',
		}),
		`${OUT_DIR}/devlog-${month}.webp`
	);
	count++;
}

console.log(`${count} OG-Karten in ${OUT_DIR}`);
