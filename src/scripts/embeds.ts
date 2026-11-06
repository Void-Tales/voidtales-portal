// Click to load: a thumbnail link until somebody asks for the real thing, so a page
// costs no YouTube player and sends nothing to Google on load. Without JS the link
// simply opens the video. Covers the start page and videos inside news and devlog.
for (const link of document.querySelectorAll<HTMLAnchorElement>('.trailer-play')) {
	link.addEventListener('click', (e) => {
		e.preventDefault();
		const frame = document.createElement('iframe');
		const url = new URL(link.dataset.embed!);
		url.searchParams.set('autoplay', '1');
		frame.src = url.toString();
		frame.title = link.getAttribute('aria-label')?.replace(/^Play /, '') ?? 'Video';
		frame.className = 'video-frame';
		frame.allow =
			'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
		frame.allowFullscreen = true;
		link.replaceWith(frame);
	});
}

// The world map embeds where a mouse can drive it. A map inside a scrolling page
// traps the thumb on a phone, so touch keeps the plain link to the full map.
if (matchMedia('(pointer: fine)').matches) {
	for (const link of document.querySelectorAll<HTMLAnchorElement>('[data-map-embed]')) {
		link.addEventListener('click', (e) => {
			e.preventDefault();
			const frame = document.createElement('iframe');
			frame.src = link.href;
			frame.title = 'Void Tales live map';
			frame.className = 'map-frame';
			frame.allowFullscreen = true;
			link.closest('.map-grid')?.classList.add('is-live');
			link.replaceWith(frame);
			frame.focus();
		});
	}
}
