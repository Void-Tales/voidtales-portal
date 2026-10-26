// Day and month of a timestamp as the team lives them: in Berlin, not in UTC. A
// devlog post at 00:30 CEST belongs to that day, not to the one before. Plain JS,
// so astro.config.mjs and scripts/og.mjs cut months the same way as the pages.
const ymd = new Intl.DateTimeFormat('en-CA', {
	timeZone: 'Europe/Berlin',
	year: 'numeric',
	month: '2-digit',
	day: '2-digit',
});

/** @param {Date} date @returns {string} YYYY-MM-DD */
export const berlinDay = (date) => ymd.format(date);

/** @param {Date} date @returns {string} YYYY-MM */
export const berlinMonth = (date) => berlinDay(date).slice(0, 7);
