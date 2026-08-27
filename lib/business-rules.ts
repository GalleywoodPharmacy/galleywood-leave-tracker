export type ClosedReason =
  | { closed: false }
  | { closed: true; reason: "sunday" | "bank-holiday" | "extra-closure"; label: string };

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
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

function nthWeekdayOfMonth(year: number, monthIndex0: number, weekday: number, position: number): Date {
  if (position > 0) {
    const first = new Date(Date.UTC(year, monthIndex0, 1));
    const firstWeekday = first.getUTCDay();
    const offset = (weekday - firstWeekday + 7) % 7;
    const day = 1 + offset + (position - 1) * 7;
    return new Date(Date.UTC(year, monthIndex0, day));
  }
  const lastDay = new Date(Date.UTC(year, monthIndex0 + 1, 0));
  const lastWeekday = lastDay.getUTCDay();
  const offset = (lastWeekday - weekday + 7) % 7;
  return addDays(lastDay, -offset);
}

export function englandBankHolidays(year: number): Map<string, string> {
  const holidays = new Map<string, string>();
  const key = (d: Date) => d.toISOString().slice(0, 10);

  const newYears = new Date(Date.UTC(year, 0, 1));
  const nyDow = newYears.getUTCDay();
  const newYearsObserved = nyDow === 6 ? addDays(newYears, 2) : nyDow === 0 ? addDays(newYears, 1) : newYears;
  holidays.set(key(newYearsObserved), "New Year's Day");

  const easter = easterSunday(year);
  holidays.set(key(addDays(easter, -2)), "Good Friday");
  holidays.set(key(addDays(easter, 1)), "Easter Monday");

  holidays.set(key(nthWeekdayOfMonth(year, 4, 1, 1)), "Early May Bank Holiday");
  holidays.set(key(nthWeekdayOfMonth(year, 4, 1, -1)), "Spring Bank Holiday");
  holidays.set(key(nthWeekdayOfMonth(year, 7, 1, -1)), "Summer Bank Holiday");

  const christmas = new Date(Date.UTC(year, 11, 25));
  const boxing = new Date(Date.UTC(year, 11, 26));
  const christmasDow = christmas.getUTCDay();

  let christmasObserved: Date;
  let boxingObserved: Date;

  if (christmasDow === 6) {
    christmasObserved = new Date(Date.UTC(year, 11, 27));
    boxingObserved = new Date(Date.UTC(year, 11, 28));
  } else if (christmasDow === 0) {
    boxingObserved = new Date(Date.UTC(year, 11, 26));
    christmasObserved = new Date(Date.UTC(year, 11, 27));
  } else if (christmasDow === 5) {
    christmasObserved = christmas;
    boxingObserved = new Date(Date.UTC(year, 11, 28));
  } else {
    christmasObserved = christmas;
    boxingObserved = boxing;
  }

  holidays.set(key(christmasObserved), "Christmas Day");
  holidays.set(key(boxingObserved), "Boxing Day");

  return holidays;
}

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

export function hoursForDate(date: Date, extraClosedDates: Map<string, string>): number {
  const closed = getClosedReason(date, extraClosedDates);
  if (closed.closed) return 0;
  return HOURS_BY_WEEKDAY[toUTCDate(date).getUTCDay()];
}

export function calculateLeaveHours(startDate: Date, endDate: Date, extraClosedDates: Map<string, string>): number {
  let total = 0;
  let cursor = toUTCDate(startDate);
  const end = toUTCDate(endDate);
  let guard = 0;
  while (cursor.getTime() <= end.getTime() && guard < 3660) {
    total += hoursForDate(cursor, extraClosedDates);
    cursor = addDays(cursor, 1);
    guard++;
  }
  return total;
}

export type WeeklyRota = {
  sun: number;
  mon: number;
  tue: number;
  wed: number;
  thu: number;
  fri: number;
  sat: number;
};

export function hoursForDateForRota(date: Date, extraClosedDates: Map<string, string>, rota: WeeklyRota): number {
  const closed = getClosedReason(date, extraClosedDates);
  if (closed.closed) return 0;
  const byWeekday = [rota.sun, rota.mon, rota.tue, rota.wed, rota.thu, rota.fri, rota.sat];
  return byWeekday[toUTCDate(date).getUTCDay()];
}

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

export type BankHolidayBreakdownItem = { dateKey: string; label: string; hours: number };

export function bankHolidayBreakdownForRota(
  rota: WeeklyRota,
  year: number,
  extraClosedDates: Map<string, string>
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

  items.sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  return items;
}

export function bankHolidayHoursForRota(rota: WeeklyRota, year: number, extraClosedDates: Map<string, string>): number {
  const total = bankHolidayBreakdownForRota(rota, year, extraClosedDates).reduce((sum, item) => sum + item.hours, 0);
  return Math.round(total * 10) / 10;
}

export function calculateStatutoryAnnualHours(
  rota: WeeklyRota,
  year: number,
  extraClosedDates: Map<string, string>
): number {
  const weeklyHours = rota.sun + rota.mon + rota.tue + rota.wed + rota.thu + rota.fri + rota.sat;
  const entitlement = weeklyHours * 5.6;
  const closureHoursOnWorkingDays = bankHolidayHoursForRota(rota, year, extraClosedDates);

  return Math.max(0, Math.round((entitlement - closureHoursOnWorkingDays) * 10) / 10);
}

export { sameDate };