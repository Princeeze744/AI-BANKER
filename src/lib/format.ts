// Formatting is done by hand (no locale APIs) so server and browser always agree.
export const TODAY = Date.UTC(2026, 9, 6); // the demo's "today": 6 Oct 2026
const DAY = 86400000;
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const dateOf = (offset: number) => new Date(TODAY + offset * DAY);
export const dom = (offset: number) => dateOf(offset).getUTCDate();
export const dow = (offset: number) => dateOf(offset).getUTCDay();
export const monthIdx = (offset: number) => dateOf(offset).getUTCMonth();
export const monthName = (offset: number) => MONTH[monthIdx(offset)];
export const monShort = (offset: number) => MON[monthIdx(offset)].toUpperCase();

export function ordinal(n: number) {
  const s = n % 100;
  if (s >= 11 && s <= 13) return `${n}th`;
  return `${n}${["th", "st", "nd", "rd"][n % 10] ?? "th"}`;
}
export const shortDate = (offset: number) => `${dom(offset)} ${MON[monthIdx(offset)]}`;
export const dayDate = (offset: number) => `${DOW[dow(offset)]} ${dom(offset)} ${MON[monthIdx(offset)]}`;
export function relDay(offset: number) {
  if (offset === 0) return "Today";
  if (offset === -1) return "Yesterday";
  if (offset === 1) return "Tomorrow";
  return dayDate(offset);
}

// For the middle of a sentence: "today", "tomorrow", "on Thu 8 Oct".
export function whenText(offset: number) {
  if (offset === 0) return "today";
  if (offset === 1) return "tomorrow";
  return `on ${dayDate(offset)}`;
}

export function naira(n: number, opts: { kobo?: boolean; sign?: boolean } = {}) {
  const neg = n < 0;
  const abs = Math.abs(n);
  const whole = Math.floor(opts.kobo ? abs : Math.round(abs));
  const str = String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const kobo = opts.kobo ? "." + String(Math.round((abs - whole) * 100)).padStart(2, "0") : "";
  const sign = neg ? "−" : opts.sign ? "+" : "";
  return `${sign}₦${str}${kobo}`;
}
// Rounded for speech: ₦193,640 -> ₦193,600
export const nairaRound = (n: number) => naira(Math.round(n / 100) * 100);
export const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

// Same day next month, as a day offset (25 Sep -> 25 Oct).
export function nextMonthSameDay(offset: number) {
  const d = dateOf(offset);
  const next = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
  return Math.round((next - TODAY) / 86400000);
}
