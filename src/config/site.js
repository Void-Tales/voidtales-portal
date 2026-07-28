// Central site configuration. All copy, URLs and metadata live here — never
// hard-code these values into components.

export const siteConfig = {
	name: 'Void Tales',
	titleTemplate: '%s · Void Tales',
	description: 'A station between worlds ✨',
	url: 'https://portal.voidtales.win',
	themeColor: '#000000',

	// Social preview images. Note: SVG previews are ignored by Discord/X/Slack —
	// swap these for 1200x630 PNGs when link previews matter.
	ogImage: '/og.svg',
	twitterImage: '/twitter.svg',
	twitterCard: 'summary_large_image',
	twitterSite: '@shinsnowly',

	// Minecraft server shown in the status panel. Queried client-side against
	// api.mcstatus.io (which sends `access-control-allow-origin: *`).
	mcServerHost: 'play.voidtales.win',
	mcServerPort: 25565,

	modrinthUrl: 'https://modrinth.com/modpack/void-tales',
	discordUrl: 'https://discord.voidtales.win',

	hero: {
		title: 'Void Tales',
		subtitle: 'A station between worlds ✨',
	},

	trailer: {
		title: 'Watch the Trailer',
		subtitle: 'Step into the world of Void Tales.',
		embedUrl: 'https://www.youtube-nocookie.com/embed/sIdqXmTkGsE',
	},

	footer:
		'Void Tales ~ Created by Hyphonical & Inventory 💙 Not affiliated with Mojang or Microsoft. All rights reserved.',
};

// The two story sections between the connect panel and the carousel.
export const storySections = [
	{
		title: 'Through Ash and Arcana',
		image: '/images/portal-1.webp',
		tilt: 'tilt-left',
		body: 'You awaken in a world undone, where the goddess Phia lies scattered and silent, her fragments hidden across realms touched by the void. At the center of it all stands the Soul Station—a place where memory drifts, where paths between worlds converge. To walk this journey is to seek not only the pieces of a fallen divinity, but also the shape of your own forgotten self.',
		points: [
			'Gather Phia’s fragments, hidden in worlds fractured by the void.',
			'Shape your soul with relics, sigils, and attunements.',
			'Confront the trials that guard the way between memory and rebirth.',
		],
	},
	{
		title: 'The Shattered Realms',
		image: '/images/portal-2.webp',
		tilt: 'tilt-right',
		body: 'The lands you cross are more than ruins—they are kingdoms long surrendered to time. In the autumn-bound halls of Falwhind, beneath the endless trees of Ibya, or in the buried stone of Aridia, every shadow holds its own memory. Battles rise and fall, strange events twist the present, and creatures beyond reason linger in the dark. Here, to lose yourself is to step closer to the truth the world has hidden.',
		points: [
			'Wander realms each marked by their own history and peril.',
			'Face encounters, events, and challenges that shift with the world.',
			'Discover the strange beauty of being lost—and the wonder of finding your way.',
		],
	},
];

// News items in the connect panel. Static for now; a workflow could generate this.
export const newsItems = [
	{ text: 'Event: Saturday 20:00', dot: 'bg-purple-500/80' },
	{ text: 'New questline now live', dot: 'bg-indigo-500/80' },
];

export const galleryImages = [
	'/images/grid-1.webp',
	'/images/grid-2.webp',
	'/images/grid-3.webp',
	'/images/grid-4.webp',
	'/images/grid-5.webp',
	'/images/grid-6.webp',
];
