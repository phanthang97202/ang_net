import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { NgForm } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { addDays, addMonths, startOfMonth } from 'date-fns';
import { NZ_ICONS } from 'ng-zorro-antd/icon';
import * as icons from '@ant-design/icons-angular/icons';
import { PersonalCalendarComponent } from './personal-calendar.component';

describe('Personal calendar', () => {
  let http: HttpTestingController;
  let calendar: PersonalCalendarComponent;
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule, PersonalCalendarComponent], providers: [provideRouter([])] });
    TestBed.overrideComponent(PersonalCalendarComponent, { set: { template: '' } });
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(PersonalCalendarComponent);
    calendar = fixture.componentInstance;
    fixture.detectChanges();
    http.expectOne(req => req.url.endsWith('/PersonalCalendar')).flush([]);
  });
  afterEach(() => http.verify());

  it('shows events across days and fetches when navigating months', () => {
    const base = addDays(startOfMonth(calendar.today), 10);
    const start = calendar.key(base), end = calendar.key(addDays(base, 2));
    calendar.events = [{ id: 'a', version: 1, title: 'Đi chơi', date: start, endDate: end, start: '09:00', end: '10:00', allDay: false, category: 'leisure', location: '', notes: '' }];
    calendar.select(addDays(base, 1));
    expect(calendar.selectedEvents.length).toBe(1);
    const month = calendar.month;
    calendar.changeMonth(1);
    expect(calendar.month).toEqual(addMonths(startOfMonth(month), 1));
    expect(calendar.loading).toBeTrue();
    http.expectOne(req => req.method === 'GET' && req.url.endsWith('/PersonalCalendar')).flush([]);
  });

  it('validates dates and saves to the API, keeping the draft if saving fails', () => {
    const form = { invalid: false } as NgForm;
    calendar.openCreate();
    calendar.draft.title = 'Hẹn bạn'; calendar.draft.start = '12:00'; calendar.draft.end = '11:00';
    calendar.save(form);
    expect(calendar.error).toBeTruthy();
    http.expectNone(req => req.method === 'POST');
    calendar.draft.end = '13:00'; calendar.save(form);
    http.expectOne(req => req.method === 'POST' && req.url.endsWith('/PersonalCalendar')).flush({}, { status: 500, statusText: 'Error' });
    expect(calendar.draft.title).toBe('Hẹn bạn');
    expect(calendar.error).toContain('Không thể lưu');
    calendar.save(form);
    const request = http.expectOne(req => req.method === 'POST' && req.url.endsWith('/PersonalCalendar'));
    expect(request.request.body.Title).toBe('Hẹn bạn');
    request.flush({ EventId: 'id', StartDate: calendar.draft.date });
    http.expectOne(req => req.method === 'GET' && req.url.endsWith('/PersonalCalendar')).flush([]);
    expect(calendar.saving).toBeFalse();
  });

  it('puts the Vietnamese lunar date on every day and flags months with a leap month', () => {
    const day = (key: string) => calendar.days.find(item => calendar.key(item.date) === key)!;
    calendar.month = new Date(2025, 6, 1);
    expect(day('2025-07-25').lunar).toEqual({ day: 1, month: 6, year: 2025, leapMonth: true });
    expect(calendar.lunarLabel(day('2025-07-25').lunar)).toBe('âm lịch ngày 1 tháng 6 nhuận năm 2025');
    expect(calendar.hasLeapMonth).toBeTrue();
    calendar.month = new Date(2026, 1, 1);
    expect(day('2026-02-17').lunar).toEqual({ day: 1, month: 1, year: 2026, leapMonth: false });
    expect(calendar.hasLeapMonth).toBeFalse();
    expect(calendar.lunarLabel(null)).toBe('không có dữ liệu âm lịch');
  });
});

describe('Personal calendar lunar dates', () => {
  it('renders the lunar day under each solar day with N for a leap month', () => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, PersonalCalendarComponent],
      providers: [provideRouter([]), { provide: NZ_ICONS, useValue: Object.values(icons) }],
    });
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(PersonalCalendarComponent);
    fixture.componentInstance.month = new Date(2025, 6, 1);
    fixture.detectChanges();
    http.expectOne(req => req.url.endsWith('/PersonalCalendar')).flush([]);
    fixture.detectChanges();

    const cells: HTMLElement[] = [...fixture.nativeElement.querySelectorAll('.calendar-day')];
    const cell = (label: string) => cells.find(item => item.getAttribute('aria-label')!.includes(label))!;
    const leapStart = cell('ngày 25 tháng 7 năm 2025');
    expect(leapStart.querySelector('.lunar-day')!.textContent!.trim()).toBe('1/6N');
    expect(leapStart.querySelector('.lunar-day')!.classList).toContain('lunar-day--new-month');
    expect(leapStart.getAttribute('aria-label')).toContain('âm lịch ngày 1 tháng 6 nhuận năm 2025');
    expect(cell('ngày 24 tháng 7 năm 2025').querySelector('.lunar-day')!.textContent!.trim()).toBe('30/6');
    expect(fixture.nativeElement.querySelector('.calendar-footer').textContent).toContain('N: tháng nhuận');

    // A change detection pass between pointer down and click must not replace the target.
    leapStart.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.calendar-day')[cells.indexOf(leapStart)]).toBe(leapStart);
    leapStart.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.key(fixture.componentInstance.selected)).toBe('2025-07-25');
    http.verify();
  });
});
