import { SolarDate } from 'lunar-date-vn';

export interface VietnameseLunarDate {
  day: number;
  month: number;
  year: number;
  leapMonth: boolean;
}

// Use calendar fields, not a UTC timestamp, so the displayed date stays stable
// regardless of the browser's time zone. The library uses Vietnamese tables.
export function vietnameseLunarDate(date: Date): VietnameseLunarDate | null {
  try {
    const year = date.getFullYear();
    // yearIndex/hour are required by the library's type; it sets yearIndex to the
    // year itself for Date input, and the hour does not affect the date.
    const result = new SolarDate({ day: date.getDate(), month: date.getMonth() + 1, year, yearIndex: year, hour: 0 }).toLunarDate()?.get();
    if (!result) return null;
    return { day: result.day, month: result.month, year: result.year, leapMonth: !!result.leap_month };
  } catch {
    // The conversion tables cover a finite range; keep the calendar usable outside it.
    return null;
  }
}
