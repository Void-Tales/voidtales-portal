/**
 * Erzeugt einen Meta-Description-Auszug aus einem Markdown-Body.
 *
 * Warum nicht `entry.data.description`: die schreibt der n8n-Import und kappt
 * hart nach 100 Zeichen, mitten im Wort und mit angehaengten Punkten
 * ("...loyal compan..."). Genau dieser Text landete bisher im
 * <meta name="description"> und damit im Google-Snippet.
 *
 * scripts/og.mjs importiert diese Datei fuer die Vorschaukarten: Karte, Snippet
 * und News-Liste zeigen denselben Text.
 */
export function excerpt(body: string, max = 150): string {
	const plain = body
		.replace(/!\[[^\]]*\]\([^)]*\)/g, '') // Bilder raus
		.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // Links auf ihren Text reduzieren
		.replace(/[#*_>`~]/g, '')
		.replace(/\s+/g, ' ')
		.trim();

	if (plain.length <= max) return plain;
	const cut = plain.slice(0, max);
	return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[\s.,;:!?-]+$/, '')}…`;
}

/**
 * Kurzfassung eines News-Eintrags: die importierte Beschreibung, solange sie
 * nicht die gekappte ist (endet auf "..."), sonst ein Auszug aus dem Body.
 * Detailseite, News-Liste und OG-Karte nehmen alle diese Funktion.
 */
export function newsSummary(description: string | undefined, body: string): string {
	return description && !description.trim().endsWith('...') ? description : excerpt(body);
}
