import { vietnameseLunarDate } from './vietnamese-lunar-date';

describe('Vietnamese lunar dates', () => {
  it('converts the day before and the first day of Tết 2026', () => {
    expect(vietnameseLunarDate(new Date(2026, 1, 16))).toEqual({ day: 29, month: 12, year: 2025, leapMonth: false });
    expect(vietnameseLunarDate(new Date(2026, 1, 17))).toEqual({ day: 1, month: 1, year: 2026, leapMonth: false });
  });

  it('identifies leap month six in 2025 and returns to the next month', () => {
    expect(vietnameseLunarDate(new Date(2025, 6, 25))).toEqual({ day: 1, month: 6, year: 2025, leapMonth: true });
    expect(vietnameseLunarDate(new Date(2025, 7, 23))).toEqual({ day: 1, month: 7, year: 2025, leapMonth: false });
  });

  it('uses the Vietnamese calendar rather than Chinese calendar for 1968', () => {
    expect(vietnameseLunarDate(new Date(1968, 0, 29))).toEqual({ day: 1, month: 1, year: 1968, leapMonth: false });
  });

  it('keeps unsupported dates from breaking the calendar', () => {
    expect(vietnameseLunarDate(new Date(2300, 0, 1))).toBeNull();
  });
});
