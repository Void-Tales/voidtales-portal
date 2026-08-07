// Single source for the header navigation. Rendered twice (desktop bar +
// mobile dropdown) from this one list — never duplicate the links again.
export const navigationLinks = [
	{ label: 'Home', href: '/' },
	{ label: 'Wiki', href: '/wiki' },
	{ label: 'Gallery', href: 'https://gallery.voidtales.win' },
	{ label: 'News', href: '/news' },
	{ label: 'Devlog', href: '/devlog' },
	{ label: 'Discord', href: 'https://discord.gg/QEMQsFect6' },
	// The old mobile menu pointed at bluemap.voidtales.win, which is a 404.
	{ label: 'World Map', href: 'https://dynmap.voidtales.win' },
];

// Buttons in the "Follow the Journey" section at the bottom of the page.
// Home and World Map are places you get to from the nav already, not things
// to "follow" - same reasoning that used to keep Search out before it moved
// to an icon button in the header.
export const socialLinks = navigationLinks.filter(
	(l) => l.label !== 'World Map' && l.label !== 'Home'
);

// News and Devlog live on this site now, so the link list is no longer purely
// external — only off-site links get a new tab.
export const isExternal = (href) => !href.startsWith('/');
