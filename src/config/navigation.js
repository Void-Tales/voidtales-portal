import { siteConfig } from './site.js';

// Single source for the header navigation. Rendered twice (desktop bar +
// mobile dropdown) from this one list — never duplicate the links again.
// The gallery mirrors header and footer with absolute URLs
// (voidtales-gallery src/config/navigation.js): a change here goes there too.
export const navigationLinks = [
	{ label: 'Home', href: '/' },
	{ label: 'Wiki', href: '/wiki/' },
	{ label: 'Items', href: '/items/' },
	{ label: 'Gallery', href: 'https://gallery.voidtales.win' },
	{ label: 'News', href: '/news/' },
	{ label: 'Devlog', href: '/devlog/' },
	{ label: 'Discord', href: 'https://discord.gg/QEMQsFect6' },
	// BlueMap since the 26.2 update, but the hostname stayed: it is in links and
	// bookmarks. bluemap.voidtales.win is a 301 to this one, not a second origin.
	{ label: 'World Map', href: 'https://dynmap.voidtales.win' },
];

// Buttons in the "Follow the Journey" section at the bottom of the page.
// Home and World Map are places you get to from the nav already, not things
// to "follow" - same reasoning that used to keep Search out before it moved
// to an icon button in the header. Items is a page to look things up in, not a
// channel to follow.
export const socialLinks = navigationLinks.filter(
	(l) => !['World Map', 'Home', 'Items'].includes(l.label)
);

// In nav order, whatever order the labels come in.
const pick = (...labels) => navigationLinks.filter((n) => labels.includes(n.label));

// Footer: the header links plus Modrinth and the legal pages, grouped.
export const footerColumns = [
	{ title: 'Explore', links: pick('Home', 'Wiki', 'Items', 'Gallery', 'World Map') },
	{
		title: 'Community',
		links: [
			...pick('News', 'Devlog', 'Discord'),
			{ label: 'Modrinth', href: siteConfig.modrinthUrl },
		],
	},
	{
		title: 'Legal',
		links: [
			{ label: 'Impressum', href: '/impressum/' },
			{ label: 'Datenschutz', href: '/datenschutz/' },
		],
	},
];

// Portal and gallery are one site to the visitor and share a tab. Discord, the
// map and Modrinth open a new one.
export const isExternal = (href) =>
	!href.startsWith('/') && !/^https:\/\/(portal|gallery)\.voidtales\.win/.test(href);

// Header highlight: Home only on the start page, every other entry for its
// whole subtree (/news/<slug>/ lights up News, /newsletter would not). The
// hrefs end in "/" (no 301 from nginx); the path may or may not.
export const isCurrent = (href, path) => {
	if (href === '/') return path === '/';
	const base = href.replace(/\/$/, '');
	return href.startsWith('/') && (path === base || path.startsWith(`${base}/`));
};
