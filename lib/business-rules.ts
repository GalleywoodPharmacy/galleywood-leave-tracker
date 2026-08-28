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
  1: 8,
  2: 8,
  3: 8,
  4: 8,
  5: 8,
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

/** A person's normal working hours for each day of the week (0 = Sunday ... 6 = Saturday). */
export type WeeklyRota = {
  sun: number;
  mon: number;
  tue: number;
  wed: number;
  thu: number;
  fri: number;
  sat: number;
};

/**
 * A single day's leave hours for a specific person, using their own rota
 * instead of the pharmacy's blanket opening hours. Still 0 on any closed
 * day (Sunday/bank holiday/extra closure) regardless of what their rota says
 * — nobody is scheduled to work a day the pharmacy is shut.
 */
export function hoursForDateForRota(date: Date, extraClosedDates: Map<string, string>, rota: WeeklyRota): number {
  const closed = getClosedReason(date, extraClosedDates);
  if (closed.closed) return 0;
  const byWeekday = [rota.sun, rota.mon, rota.tue, rota.wed, rota.thu, rota.fri, rota.sat];
  return byWeekday[toUTCDate(date).getUTCDay()];
}

/**
 * Total leave hours for an inclusive date range, for a specific person's
 * rota. A day they don't work contributes 0; a short day contributes just
 * those hours; a closed day contributes 0 regardless of their rota.
 */
export function calculateLeaveHoursForRota(
  startDate: Date,
  endDate: Date,
  extraClosedDates: Map<string, string>,
  rota: WeeklyRota
): number {
  let total = 0;
  let cursor = toUTCDate(startDate);
  const end = toUTCDate(endDate);
  let guard = 0;
  while (cursor.getTime() <= end.getTime() && guard < 3660) {
    total += hoursForDateForRota(cursor, extraClosedDates, rota);
    cursor = addDays(cursor, 1);
    guard++;
  }
  return total;
}

/** One closed day that falls on a working day and its hour cost. */
export type BankHolidayBreakdownItem = { dateKey: string; label: string; hours: number };

/**
 * Bank holiday + extra-closure days that fall on a day this person normally
 * works, within the given year — each with the hours it costs them. Only
 * includes days that actually land on a working day (rota hours > 0 that
 * weekday); a closure on a day off contributes nothing and isn't listed.
 * Sorted earliest first.
 *
 * fromDateKey ("YYYY-MM-DD"), if given, excludes any closure before that
 * date — used to leave out bank holidays that happened before someone
 * started, when pro-rating their first year's entitlement.
 */
export function bankHolidayBreakdownForRota(
  rota: WeeklyRota,
  year: number,
  extraClosedDates: Map<string, string>,
  fromDateKey?: string
): BankHolidayBreakdownItem[] {
  const byWeekday = [rota.sun, rota.mon, rota.tue, rota.wed, rota.thu, rota.fri, rota.sat];
  const countedDates = new Set<string>();
  const items: BankHolidayBreakdownItem[] = [];

  const bankHolidays = englandBankHolidays(year);
  for (const [dateKey, label] of bankHolidays.entries()) {
    countedDates.add(dateKey);
    const weekday = new Date(dateKey + "T00:00:00.000Z").getUTCDay();
    const hours = byWeekday[weekday];
    if (hours > 0) items.push({ dateKey, label, hours: Math.round(hours * 10) / 10 });
  }

  for (const [dateKey, label] of extraClosedDates.entries()) {
    if (!dateKey.startsWith(String(year))) continue;
    if (countedDates.has(dateKey)) continue;
    countedDates.add(dateKey);
    const weekday = new Date(dateKey + "T00:00:00.000Z").getUTCDay();
    const hours = byWeekday[weekday];
    if (hours > 0) items.push({ dateKey, label, hours: Math.round(hours * 10) / 10 });
  }

  const filtered = fromDateKey ? items.filter((i) => i.dateKey >= fromDateKey) : items;
  filtered.sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  return filtered;
}

/**
 * Bank holiday + extra-closure hours that fall on a day this person
 * normally works, within the given year — the amount their statutory
 * entitlement gets reduced by. Just the total from bankHolidayBreakdownForRota.
 */
export function bankHolidayHoursForRota(
  rota: WeeklyRota,
  year: number,
  extraClosedDates: Map<string, string>,
  fromDateKey?: string
): number {
  const total = bankHolidayBreakdownForRota(rota, year, extraClosedDates, fromDateKey).reduce(
    (sum, item) => sum + item.hours,
    0
  );
  return Math.round(total * 10) / 10;
}

/**
 * UK statutory annual leave entitlement for one person, in hours:
 *
 *   (their weekly contracted hours × 5.6) − (bank holiday + extra-closure
 *   hours that fall on a day they normally work, within the given year)
 *
 * This is the standard "5.6 weeks including bank holidays" calculation —
 * the pharmacy being shut on a bank holiday already uses up part of a
 * person's entitlement, so those hours come off the top once here rather
 * than being deducted again when a leave request happens to span one
 * (which is why hoursForDateForRota above still returns 0 for closed days:
 * double-counting would short-change the person twice for the same day).
 *
 * startDate, if given and it falls within the requested year, pro-rates the
 * entitlement: the full (weekly hours × 5.6) figure is scaled down by the
 * fraction of the year remaining from that date (days remaining ÷ days in
 * the year), and only bank holidays on/after that date count against them
 * — ones that happened before they joined don't reduce their entitlement.
 * A startDate in a later year than requested returns 0 (they hadn't
 * started yet); a startDate in an earlier year is treated as a full year
 * (their first partial year has already passed).
 */
export function calculateStatutoryAnnualHours(
  rota: WeeklyRota,
  year: number,
  extraClosedDates: Map<string, string>,
  startDate?: Date | null
): number {
  const weeklyHours = rota.sun + rota.mon + rota.tue + rota.wed + rota.thu + rota.fri + rota.sat;
  const fullEntitlement = weeklyHours * 5.6;

  let fraction = 1;
  let fromDateKey: string | undefined;

  if (startDate) {
    const startYear = startDate.getUTCFullYear();
    if (startYear > year) {
      return 0;
    }
    if (startYear === year) {
      const yearStartMs = Date.UTC(year, 0, 1);
      const nextYearStartMs = Date.UTC(year + 1, 0, 1);
      const totalDays = Math.round((nextYearStartMs - yearStartMs) / 86400000);
      const startMs = Date.UTC(year, startDate.getUTCMonth(), startDate.getUTCDate());
      const remainingDays = Math.round((nextYearStartMs - startMs) / 86400000);
      fraction = Math.max(0, Math.min(1, remainingDays / totalDays));
      fromDateKey = startDate.toISOString().slice(0, 10);
    }
  }

  const proRatedEntitlement = fullEntitlement * fraction;
  const closureHoursOnWorkingDays = bankHolidayHoursForRota(rota, year, extraClosedDates, fromDateKey);

  return Math.max(0, Math.round((proRatedEntitlement - closureHoursOnWorkingDays) * 10) / 10);
}

export type BlackoutPeriod = { startDateKey: string; endDateKeyInclusive: string; label: string };

export function getBlackoutPeriods(year: number): BlackoutPeriod[] {
  const key = (d: Date) => d.toISOString().slice(0, 10);

  const christmasStart = new Date(Date.UTC(year, 11, 11));
  const christmasEnd = new Date(Date.UTC(year, 11, 24));

  const easter = easterSunday(year);
  const goodFriday = addDays(easter, -2);
  const easterBlackoutEnd = addDays(goodFriday, -1);
  const easterBlackoutStart = addDays(easterBlackoutEnd, -6);

  return [
    { startDateKey: key(christmasStart), endDateKeyInclusive: key(christmasEnd), label: "Black out period (pre-Christmas)" },
    {
      startDateKey: key(easterBlackoutStart),
      endDateKeyInclusive: key(easterBlackoutEnd),
      label: "Black out period (pre-Easter)",
    },
  ];
}

export function getBlackoutLabelForDate(dateKey: string, periods: BlackoutPeriod[]): string | null {
  for (const p of periods) {
    if (dateKey >= p.startDateKey && dateKey <= p.endDateKeyInclusive) return p.label;
  }
  return null;
}

export type SaturdayTeam = { names: string[]; color: "flamingo" | "banana" };

const SATURDAY_TEAM_ANCHOR = "2026-09-29";
const SATURDAY_TEAM_A = ["Anna", "Kirsty", "Irma", "Chloe"];
const SATURDAY_TEAM_B = ["Aleks", "Hayley", "Chloe"];

export function getSaturdayTeam(date: Date): SaturdayTeam | null {
  if (date.getUTCDay() !== 6) return null;
  const anchor = new Date(SATURDAY_TEAM_ANCHOR + "T00:00:00.000Z");
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const diffWeeks = Math.round((target.getTime() - anchor.getTime()) / 86400000) / 7;
  const weeksMod = ((diffWeeks % 2) + 2) % 2;
  return weeksMod === 0 ? { names: SATURDAY_TEAM_A, color: "flamingo" } : { names: SATURDAY_TEAM_B, color: "banana" };
}

export { sameDate };