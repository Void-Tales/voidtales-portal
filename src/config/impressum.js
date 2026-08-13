// Ladungsfaehige Anschrift fuer /impressum und /datenschutz.
//
// Die Werte kommen zur Build-Zeit aus den GitHub-Secrets IMPRESSUM_ADDRESS und
// IMPRESSUM_PHONE (siehe Dockerfile + .github/workflows/deploy.yml) und stehen
// deshalb nicht im Repo - das hier ist oeffentlich.
//
// process.env, nicht import.meta.env: Astro 6 hat das Umschreiben von
// import.meta.env auf process.env fuer Variablen ohne PUBLIC_-Praefix entfernt.
// Kein PUBLIC_-Praefix ist genau richtig, sonst landete der Wert im Client-Bundle.
//
// Ohne Secret (lokaler Build, `pnpm build`) greift der Fallback sichtbar, statt
// dass der Build bricht oder eine leere Adresse live geht.
const FALLBACK = '(Anschrift nicht gesetzt: nur der Deploy-Build kennt sie)';

export const addressLines = (process.env.IMPRESSUM_ADDRESS || FALLBACK)
	.split('|')
	.map((line) => line.trim())
	.filter(Boolean);

export const phone = (process.env.IMPRESSUM_PHONE || '').trim();

// tel:-Ziel aus der Anzeigenummer: Leerzeichen raus, fuehrende 0 zu +49 (DE).
export const phoneHref = phone.replace(/\s+/g, '').replace(/^0/, '+49');

export const contactEmail = 'admin@voidtales.win';
