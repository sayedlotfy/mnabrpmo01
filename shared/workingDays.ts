/**
 * Saudi Arabia Working Days Calculator
 * Work week: Sunday (0) to Thursday (4)
 * Excludes: Friday (5), Saturday (6)
 * Excludes: Saudi official public holidays and national occasions
 *
 * Holidays are defined in Gregorian calendar for predictability.
 * Hijri-based holidays (Eid, National Day) are approximated per year.
 * Source: Saudi Ministry of Human Resources official holiday schedule.
 */

// ---- Saudi Public Holidays (Gregorian approximations) ----
// Format: "YYYY-MM-DD"
// These are updated annually; we cover 2024-2027 for practical use.

const SAUDI_HOLIDAYS: Record<string, string[]> = {
  "2024": [
    // Founding Day - Feb 22
    "2024-02-22",
    // Eid Al-Fitr (approx Apr 9-13, 5 days)
    "2024-04-09", "2024-04-10", "2024-04-11", "2024-04-12", "2024-04-13",
    // Eid Al-Adha (approx Jun 15-19, 5 days)
    "2024-06-15", "2024-06-16", "2024-06-17", "2024-06-18", "2024-06-19",
    // National Day - Sep 23
    "2024-09-23",
  ],
  "2025": [
    // Founding Day - Feb 22
    "2025-02-22",
    // Eid Al-Fitr (approx Mar 30 - Apr 3, 5 days)
    "2025-03-30", "2025-03-31", "2025-04-01", "2025-04-02", "2025-04-03",
    // Eid Al-Adha (approx Jun 5-9, 5 days)
    "2025-06-05", "2025-06-06", "2025-06-07", "2025-06-08", "2025-06-09",
    // National Day - Sep 23
    "2025-09-23",
  ],
  "2026": [
    // Founding Day - Feb 22
    "2026-02-22",
    // Eid Al-Fitr (approx Mar 20-24, 5 days)
    "2026-03-20", "2026-03-21", "2026-03-22", "2026-03-23", "2026-03-24",
    // Eid Al-Adha (approx May 26-30, 5 days)
    "2026-05-26", "2026-05-27", "2026-05-28", "2026-05-29", "2026-05-30",
    // National Day - Sep 23
    "2026-09-23",
  ],
  "2027": [
    // Founding Day - Feb 22
    "2027-02-22",
    // Eid Al-Fitr (approx Mar 9-13, 5 days)
    "2027-03-09", "2027-03-10", "2027-03-11", "2027-03-12", "2027-03-13",
    // Eid Al-Adha (approx May 15-19, 5 days)
    "2027-05-15", "2027-05-16", "2027-05-17", "2027-05-18", "2027-05-19",
    // National Day - Sep 23
    "2027-09-23",
  ],
};

/**
 * Build a Set of all holiday strings for fast lookup
 */
function buildHolidaySet(): Set<string> {
  const set = new Set<string>();
  for (const dates of Object.values(SAUDI_HOLIDAYS)) {
    for (const d of dates) {
      set.add(d);
    }
  }
  return set;
}

const HOLIDAY_SET = buildHolidaySet();

/**
 * Check if a given date is a Saudi working day
 * Working days: Sunday (0) to Thursday (4), excluding public holidays
 */
export function isSaudiWorkingDay(date: Date): boolean {
  const day = date.getDay(); // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  if (day === 5 || day === 6) return false; // Friday or Saturday
  const iso = toISODate(date);
  if (HOLIDAY_SET.has(iso)) return false;
  return true;
}

/**
 * Format date as YYYY-MM-DD
 */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Count Saudi working days between two dates (inclusive of both endpoints)
 * @param startStr YYYY-MM-DD
 * @param endStr   YYYY-MM-DD
 */
export function countWorkingDays(startStr: string, endStr: string): number {
  const start = new Date(startStr + "T00:00:00");
  const end = new Date(endStr + "T00:00:00");
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  if (start > end) return 0;

  let count = 0;
  const cur = new Date(start);
  while (cur <= end) {
    if (isSaudiWorkingDay(cur)) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

/**
 * Count working days consumed from project start to today,
 * EXCLUDING periods when the project was paused.
 *
 * @param startStr       Project start date YYYY-MM-DD
 * @param todayStr       Today's date YYYY-MM-DD (defaults to today)
 * @param pausePeriods   Array of { pauseDate, resumeDate } (resumeDate null if still paused)
 */
export function countConsumedWorkingDays(
  startStr: string,
  todayStr: string,
  pausePeriods: Array<{ pauseDate: string; resumeDate: string | null }>
): number {
  const start = new Date(startStr + "T00:00:00");
  const today = new Date(todayStr + "T00:00:00");
  if (isNaN(start.getTime()) || isNaN(today.getTime())) return 0;
  if (start > today) return 0;

  // Build pause intervals as Date ranges
  const pauses: Array<{ from: Date; to: Date }> = pausePeriods.map((p) => ({
    from: new Date(p.pauseDate + "T00:00:00"),
    to: p.resumeDate ? new Date(p.resumeDate + "T00:00:00") : new Date(today),
  }));

  let count = 0;
  const cur = new Date(start);
  while (cur <= today) {
    if (isSaudiWorkingDay(cur)) {
      // Check if this day falls within any pause period
      const isPaused = pauses.some((p) => cur >= p.from && cur <= p.to);
      if (!isPaused) count++;
    }
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

/**
 * Count total paused working days from pause periods
 */
export function countPausedWorkingDays(
  pausePeriods: Array<{ pauseDate: string; resumeDate: string | null }>,
  todayStr: string
): number {
  let total = 0;
  for (const p of pausePeriods) {
    const from = p.pauseDate;
    const to = p.resumeDate ?? todayStr;
    total += countWorkingDays(from, to);
  }
  return total;
}

/**
 * Get today's date as YYYY-MM-DD
 */
export function todayISO(): string {
  return toISODate(new Date());
}

/**
 * Get list of holidays in a given year (for display)
 */
export function getHolidaysForYear(year: number): string[] {
  return SAUDI_HOLIDAYS[String(year)] ?? [];
}

/**
 * Add N working days to a given start date, returning the new date as YYYY-MM-DD.
 * Skips weekends (Fri/Sat) and Saudi public holidays.
 * @param startStr YYYY-MM-DD base date
 * @param days     Number of working days to add (positive integer)
 */
export function addWorkingDays(startStr: string, days: number): string {
  if (days <= 0) return startStr;
  const cur = new Date(startStr + "T00:00:00");
  if (isNaN(cur.getTime())) return startStr;
  let added = 0;
  while (added < days) {
    cur.setDate(cur.getDate() + 1);
    if (isSaudiWorkingDay(cur)) added++;
  }
  return toISODate(cur);
}

/**
 * Get all holidays as a sorted array
 */
export function getAllHolidays(): string[] {
  const all: string[] = [];
  for (const dates of Object.values(SAUDI_HOLIDAYS)) {
    all.push(...dates);
  }
  return all.sort();
}
