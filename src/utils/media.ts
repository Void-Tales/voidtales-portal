// What the templates need to know about images inside news and devlog Markdown.
import sizes from '../generated/media-sizes.json';

type Size = { w: number; h: number; small?: string };
const table = sizes as Record<string, Size>;

export interface EntryImage {
	src: string;
	srcset?: string;
	width?: number;
	height?: number;
}

/** First still image of a post. GIFs are skipped: megabytes for a 13rem thumbnail. */
export function firstImage(body = ''): EntryImage | null {
	for (const [, alt, src] of body.matchAll(/!\[([^\]]*)\]\((\/images\/[^)\s]+)\)/g)) {
		if (/\.gif$/i.test(alt)) continue;
		const size = table[src];
		return {
			src: size?.small ?? src,
			srcset: size?.small ? `${size.small} 800w, ${src} ${size.w}w` : undefined,
			width: size?.w,
			height: size?.h,
		};
	}
	return null;
}
