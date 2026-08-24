/**
 * Pure business-rule functions (spec section 4).
 * No I/O here — DB-aware wrappers (e.g. checking ExtraClosedDate) live in
 * lib/leave.ts once that's built. Kept dependency-free and unit-testable.
 */

export type ClosedReason =
  | { closed: false }
  | { closed: true; reason: "sunday" | "bank-holiday" | "extra-closure"; label: string };

/** Opening hours per weekday, per spec. Sunday = closed. */
const HOURS_BY_WEEKDAY: Record<number, number> = {
  0: 0, // Sunday
  1: 7.5,
  2: 7.5,
  3: 7.5,
  4: 7.5,
  5: 7.5,
  6: 4, // Saturday
};

function toUTCDate(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function sameDate(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

/** Easter Sunday via the Meeus/Jones/Butcher algorithm (Gregorian). */
export function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3=March, 4=April
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

/** nth weekday of a month (1-indexed occurrence), or last if position = -1. */
function nthWeekdayOfMonth(year: number, monthIndex0: number, weekday: number, position: number): Date {
  if (position > 0) {
    const first = new Date(Date.UTC(year, monthIndex0, 1));
    const firstWeekday = first.getUTCDay();
    const offset = (weekday - firstWeekday + 7) % 7;
    const day = 1 + offset + (position - 1) * 7;
    return new Date(Date.UTC(year, monthIndex0, day));
  }
  // last occurrence: start from last day of month and walk back
  const lastDay = new Date(Date.UTC(year, monthIndex0 + 1, 0));
  const lastWeekday = lastDay.getUTCDay();
  const offset = (lastWeekday - weekday + 7) % 7;
  return addDays(lastDay, -offset);
}

/**
 * England bank holidays for a given year, calculated algorithmically.
 * Returns a Map keyed by "YYYY-MM-DD" -> label.
 */
export function englandBankHolidays(year: number): Map<string, string> {
  const holidays = new Map<string, string>();
  const key = (d: Date) => d.toISOString().slice(0, 10);

  // New Year's Day — if Sat/Sun, observed the following Monday.
  const newYears = new Date(Date.UTC(year, 0, 1));
  const nyDow = newYears.getUTCDay();
  const newYearsObserved = nyDow === 6 ? addDays(newYears, 2) : nyDow === 0 ? addDays(newYears, 1) : newYears;
  holidays.set(key(newYearsObserved), "New Year's Day");

  // Good Friday & Easter Monday
  const easter = easterSunday(year);
  holidays.set(key(addDays(easter, -2)), "Good Friday");
  holidays.set(key(addDays(easter, 1)), "Easter Monday");

  // Early May (1st Monday), Spring (last Monday of May), Summer (last Monday of August)
  holidays.set(key(nthWeekdayOfMonth(year, 4, 1, 1)), "Early May Bank Holiday");
  holidays.set(key(nthWeekdayOfMonth(year, 4, 1, -1)), "Spring Bank Holiday");
  holidays.set(key(nthWeekdayOfMonth(year, 7, 1, -1)), "Summer Bank Holiday");

  // Christmas Day + Boxing Day, with gov.uk substitute-day logic.
  const christmas = new Date(Date.UTC(year, 11, 25));
  const boxing = new Date(Date.UTC(year, 11, 26));
  const christmasDow = christmas.getUTCDay();

  let christmasObserved: Date;
  let boxingObserved: Date;

  if (christmasDow === 6) {
    // 25 Dec Saturday -> Christmas observed Mon 27th, Boxing Day observed Tue 28th
    christmasObserved = new Date(Date.UTC(year, 11, 27));
    boxingObserved = new Date(Date.UTC(year, 11, 28));
  } else if (christmasDow === 0) {
    // 25 Dec Sunday -> Boxing Day stays Mon 26th, Christmas observed Tue 27th
    boxingObserved = new Date(Date.UTC(year, 11, 26));
    christmasObserved = new Date(Date.UTC(year, 11, 27));
  } else if (christmasDow === 5) {
    // 25 Dec Friday -> Christmas stays Fri 25th, Boxing Day observed Mon 28th
    christmasObserved = christmas;
    boxingObserved = new Date(Date.UTC(year, 11, 28));
  } else {
    // Otherwise both stay on their calendar dates
    christmasObserved = christmas;
    boxingObserved = boxing;
  }

  holidays.set(key(christmasObserved), "Christmas Day");
  holidays.set(key(boxingObserved), "Boxing Day");

  return holidays;
}

/**
 * Determine whether a date is closed, per priority:
 * ExtraClosedDate > bank holiday > Sunday.
 * extraClosedDates: Map of "YYYY-MM-DD" -> label, passed in by the caller
 * (loaded from the ExtraClosedDate table).
 */
export function getClosedReason(date: Date, extraClosedDates: Map<string, string>): ClosedReason {
  const d = toUTCDate(date);
  const key = d.toISOString().slice(0, 10);

  if (extraClosedDates.has(key)) {
    return { closed: true, reason: "extra-closure", label: extraClosedDates.get(key)! };
  }

  const bankHolidays = englandBankHolidays(d.getUTCFullYear());
  if (bankHolidays.has(key)) {
    return { closed: true, reason: "bank-holiday", label: bankHolidays.get(key)! };
  }

  if (d.getUTCDay() === 0) {
    return { closed: true, reason: "sunday", label: "Sunday" };
  }

  return { closed: false };
}

/** Opening hours for a single date, respecting closed-day priority. 0 if closed. */
export function hoursForDate(date: Date, extraClosedDates: Map<string, string>): number {
  const closed = getClosedReason(date, extraClosedDates);
  if (closed.closed) return 0;
  return HOURS_BY_WEEKDAY[toUTCDate(date).getUTCDay()];
}

/**
 * Total leave hours for an inclusive date range, per the opening-hours rules.
 * Closed days (Sundays, bank holidays, extra closures) contribute 0 and are
 * excluded from the total.
 */
export function calculateLeaveHours(startDate: Date, endDate: Date, extraClosedDates: Map<string, string>): number {
  let total = 0;
  let cursor = toUTCDate(startDate);
  const end = toUTCDate(endDate);
  // Safety cap so a bad input can't loop forever.
  let guard = 0;
  while (cursor.getTime() <= end.getTime() && guard < 3660) {
    total += hoursForDate(cursor, extraClosedDates);
    cursor = addDays(cursor, 1);
    guard++;
  }
  return total;
}

export { sameDate };
