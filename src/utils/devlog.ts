// The id of a day block on a devlog page: day plus author. Shared by the month page
// and the start page, which links straight to a block.
export const devlogSlug = (s = '') =>
	s
		.toLowerCase()
		.normalize('NFKD')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');

export const devlogAnchor = (day: string, author?: string) =>
	[day, devlogSlug(author)].filter(Boolean).join('-');
