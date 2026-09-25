// Single source for the header navigation. Rendered twice (desktop bar +
// mobile dropdown) from this one list — never duplicate the links again.
export const navigationLinks = [
	{ label: 'Home', href: '/' },
	{ label: 'Wiki', href: '/wiki' },
	{ label: 'Items', href: '/items' },
	{ label: 'Gallery', href: 'https://gallery.voidtales.win' },
	{ label: 'News', href: '/news' },
	{ label: 'Devlog', href: '/devlog' },
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

// News and Devlog live on this site now, so the link list is no longer purely
// external — only off-site links get a new tab.
export const isExternal = (href) => !href.startsWith('/');
