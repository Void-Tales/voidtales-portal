// Single source for the header navigation. Rendered twice (desktop bar +
// mobile dropdown) from this one list — never duplicate the links again.
export const navigationLinks = [
	{ label: 'Wiki', href: 'https://wiki.voidtales.win' },
	{ label: 'Gallery', href: 'https://gallery.voidtales.win' },
	{ label: 'News', href: '/news' },
	{ label: 'Devlog', href: '/devlog' },
	{ label: 'Search', href: '/search' },
	{ label: 'Discord', href: 'https://discord.voidtales.win' },
	// The old mobile menu pointed at bluemap.voidtales.win, which is a 404.
	{ label: 'World Map', href: 'https://dynmap.voidtales.win' },
];

// Buttons in the "Follow the Journey" section at the bottom of the page.
// Search is a tool, not a place to follow — same reasoning as World Map.
export const socialLinks = navigationLinks.filter(
	(l) => l.label !== 'World Map' && l.label !== 'Search'
);

// News and Devlog live on this site now, so the link list is no longer purely
// external — only off-site links get a new tab.
export const isExternal = (href) => !href.startsWith('/');
