import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { NgForm } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { addDays, addMonths, startOfMonth } from 'date-fns';
import { NZ_ICONS } from 'ng-zorro-antd/icon';
import * as icons from '@ant-design/icons-angular/icons';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PersonalCalendarComponent } from './personal-calendar.component';
import { CalendarStatus } from '../../services/personal-calendar.service';

// Chỉ các khóa mà test kiểm tra nội dung; khóa khác hiện nguyên tên khóa
const TRANSLATIONS = {
  vi: { T_CALENDAR_LUNAR_LABEL: 'âm lịch ngày {{day}} tháng {{month}}{{leap}} năm {{year}}', T_CALENDAR_LUNAR_LEAP: ' nhuận', T_CALENDAR_LUNAR_NONE: 'không có dữ liệu âm lịch', T_CALENDAR_LEAP_SHORT: 'N', T_CALENDAR_LEAP_LEGEND: 'N: tháng nhuận', T_CALENDAR_MONTH_TITLE: 'Tháng {{month}}, {{year}}' },
  en: { T_CALENDAR_LUNAR_LABEL: 'lunar day {{day}} of month {{month}}{{leap}}, year {{year}}', T_CALENDAR_LUNAR_LEAP: ' (leap)', T_CALENDAR_MONTH_TITLE: '{{monthName}} {{year}}' },
};
function useLanguage(lang: 'vi' | 'en'): void {
  const translate = TestBed.inject(TranslateService);
  translate.setTranslation(lang, TRANSLATIONS[lang]);
  translate.use(lang);
}
const NO_COUNTS: Record<CalendarStatus, number> = { todo: 0, in_progress: 0, urgent: 0, done: 0, cancelled: 0 };
// Trang tải thêm danh sách việc theo trạng thái (kèm số đếm) khi mở và sau mỗi thay đổi.
function flushTasks(http: HttpTestingController, result: { Counts?: Partial<Record<CalendarStatus, number>>; Total?: number; Items?: unknown[] } = {}, status?: CalendarStatus): void {
  http.expectOne(req => req.url.endsWith('/PersonalCalendar/tasks') && req.params.get('status') === (status ?? null))
    .flush({ Counts: { ...NO_COUNTS, ...result.Counts }, Total: result.Total ?? 0, Items: result.Items ?? [] });
}

describe('Personal calendar', () => {
  let http: HttpTestingController;
  let calendar: PersonalCalendarComponent;
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule, TranslateModule.forRoot(), PersonalCalendarComponent], providers: [provideRouter([])] });
    TestBed.overrideComponent(PersonalCalendarComponent, { set: { template: '' } });
    http = TestBed.inject(HttpTestingController);
    useLanguage('vi');
    const fixture = TestBed.createComponent(PersonalCalendarComponent);
    calendar = fixture.componentInstance;
    fixture.detectChanges();
    http.expectOne(req => req.url.endsWith('/PersonalCalendar')).flush([]);
    flushTasks(http);
  });
  afterEach(() => http.verify());

  it('shows events across days and fetches when navigating months', () => {
    const base = addDays(startOfMonth(calendar.today), 10);
    const start = calendar.key(base), end = calendar.key(addDays(base, 2));
    calendar.events = [{ id: 'a', version: 1, title: 'Đi chơi', date: start, endDate: end, start: '09:00', end: '10:00', allDay: false, category: 'leisure', location: '', notes: '', status: 'todo' }];
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
    expect(calendar.error).toBe('T_CALENDAR_SAVE_ERROR');
    calendar.save(form);
    const request = http.expectOne(req => req.method === 'POST' && req.url.endsWith('/PersonalCalendar'));
    expect(request.request.body.Title).toBe('Hẹn bạn');
    request.flush({ EventId: 'id', StartDate: calendar.draft.date });
    http.expectOne(req => req.method === 'GET' && req.url.endsWith('/PersonalCalendar')).flush([]);
    flushTasks(http);
    expect(calendar.saving).toBeFalse();
  });

  it('saves selected weekdays and the next-day end for an overnight shift', () => {
    calendar.openCreate();
    calendar.draft.title = 'Trực khách sạn';
    calendar.draft.date = '2026-10-29'; calendar.draft.endDate = '2026-10-30';
    calendar.draft.start = '19:00'; calendar.draft.end = '07:00';
    calendar.repeatWeekly = true;
    calendar.toggleRepeatDay(16); calendar.toggleRepeatDay(64);
    calendar.save({ invalid: false } as NgForm);
    const request = http.expectOne(req => req.method === 'POST' && req.url.endsWith('/PersonalCalendar'));
    expect(request.request.body.RepeatDays).toBe(80);
    expect(request.request.body.RepeatUntil).toBeNull();
    expect(request.request.body.EndDate).toBe('2026-10-30');
    request.flush({ EventId: 'id', StartDate: '2026-10-29' });
    http.expectOne(req => req.method === 'GET' && req.url.endsWith('/PersonalCalendar')).flush([]);
    flushTasks(http);
  });

  it('lets an existing long series be corrected without changing its repeat end date', () => {
    calendar.openEdit({ id: 'series', version: 1, title: 'Trực khách sạn', date: '2026-10-24', endDate: '2026-11-19', seriesStartDate: '2026-10-01', seriesEndDate: '2026-10-27', start: '19:00', end: '07:00', allDay: false, category: 'work', location: '', notes: '', status: 'todo', repeatDays: 80, repeatUntil: '2026-10-27' });
    expect(calendar.repeatDurationDays).toBe(26);
    expect(calendar.draft.endDate).toBe('2026-10-27');
    calendar.setRepeatDuration(1);
    expect(calendar.draft.endDate).toBe('2026-10-02');
    calendar.save({ invalid: false } as NgForm);
    const request = http.expectOne(req => req.method === 'PUT');
    expect(request.request.body.EndDate).toBe('2026-10-02');
    expect(request.request.body.RepeatUntil).toBe('2026-10-27');
    expect(request.request.body.RepeatDays).toBe(80);
    request.flush({ EventId: 'series', StartDate: '2026-10-01' });
    http.expectOne(req => req.method === 'GET' && req.url.endsWith('/PersonalCalendar')).flush([]);
    flushTasks(http);
  });

  it('keeps the duration when the first date changes and selects the next day for overnight hours', () => {
    calendar.openCreate();
    calendar.draft.date = '2026-10-01'; calendar.draft.endDate = '2026-10-01';
    calendar.changeRepeat(true);
    calendar.changeTime('start', '19:00'); calendar.changeTime('end', '07:00');
    expect(calendar.draft.endDate).toBe('2026-10-02');
    calendar.changeStartDate('2026-11-05');
    expect(calendar.draft.endDate).toBe('2026-11-06');
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

  it('switches month title, dates and lunar labels to English', () => {
    calendar.month = new Date(2025, 6, 1);
    calendar.selected = new Date(2025, 6, 25);
    expect(calendar.title).toBe('Tháng 7, 2025');
    useLanguage('en');
    expect(calendar.title).toBe('July 2025');
    expect(calendar.selectedLabel).toBe('Friday, July 25');
    expect(calendar.dateLabel(calendar.selected)).toBe('Friday, July 25, 2025');
    expect(calendar.tileMonth).toBe('JUL');
    expect(calendar.lunarLabel({ day: 1, month: 6, year: 2025, leapMonth: true })).toBe('lunar day 1 of month 6 (leap), year 2025');
  });

  it('lists every task with the chosen status across all dates and filters the month grid', () => {
    const date = addDays(startOfMonth(calendar.today), 3), key = calendar.key(date);
    const event = (id: string, status: CalendarStatus) => ({ id, version: 1, title: id, date: key, endDate: key, start: '09:00', end: '10:00', allDay: false, category: 'work' as const, location: '', notes: '', status });
    calendar.events = [event('a', 'urgent'), event('b', 'done'), event('c', 'urgent')];
    const task = (id: string, date: string, start: string) => ({ EventId: id, Version: 1, Title: id, StartDate: date, EndDate: date, StartTime: start, EndTime: '23:00', AllDay: false, Category: 'work', Location: '', Notes: '', Status: 'urgent' });

    calendar.setStatusFilter('urgent');
    expect(calendar.tasksLoading).toBeTrue();
    const request = http.expectOne(req => req.url.endsWith('/PersonalCalendar/tasks'));
    expect(request.request.params.get('status')).toBe('urgent');
    expect(request.request.params.get('today')).toBe(calendar.key(calendar.today));
    request.flush({ Counts: { ...NO_COUNTS, urgent: 3, done: 7 }, Total: 3, Items: [task('old', '2025-12-01', '08:00'), task('x', '2026-03-05', '08:00'), task('y', '2026-03-05', '10:00')] });
    expect(calendar.statusCounts).toEqual({ all: 10, todo: 0, in_progress: 0, urgent: 3, done: 7, cancelled: 0 });
    expect(calendar.taskGroups.map(group => [group.date, group.events.map(item => item.id)])).toEqual([['2025-12-01', ['old']], ['2026-03-05', ['x', 'y']]]);
    expect(calendar.taskTime(calendar.tasks[0])).toBe('08:00 – 23:00');
    // Lưới tháng cũng chỉ còn việc ở trạng thái đang lọc.
    expect(calendar.days.find(day => day.key === key)!.events.map(item => item.id)).toEqual(['a', 'c']);

    calendar.goToDate('2025-12-01');
    expect(calendar.key(calendar.selected)).toBe('2025-12-01');
    http.expectOne(req => req.url.endsWith('/PersonalCalendar')).flush([]);
    calendar.setStatusFilter('all');
    flushTasks(http);
    expect(calendar.tasks).toEqual([]);
  });

  it('changes the status of one occurrence and restores it when the API fails', () => {
    const occurrence = { id: 'series', version: 1, title: 'Gym', date: '2026-10-29', endDate: '2026-10-29', start: '18:00', end: '19:00', allDay: false, category: 'routine' as const, location: '', notes: '', status: 'todo' as CalendarStatus, repeatDays: 16 };
    calendar.events = [occurrence];
    calendar.changeStatus(occurrence, 'done');
    expect(occurrence.status).toBe('done');
    expect(calendar.isStatusPending(occurrence)).toBeTrue();
    const request = http.expectOne(req => req.method === 'PUT' && req.url.endsWith('/PersonalCalendar/series/status'));
    expect(request.request.body).toEqual({ Date: '2026-10-29', Status: 'done' });
    request.flush({});
    expect(calendar.isStatusPending(occurrence)).toBeFalse();
    // Số đếm và danh sách việc được tải lại sau khi đổi.
    flushTasks(http, { Counts: { done: 1 }, Total: 1 });
    expect(calendar.statusCounts.done).toBe(1);

    calendar.changeStatus(occurrence, 'cancelled');
    http.expectOne(req => req.url.endsWith('/status')).flush({}, { status: 500, statusText: 'Error' });
    expect(occurrence.status).toBe('done');
    expect(calendar.statusError).toBe('T_CALENDAR_STATUS_ERROR');
  });

  it('sends the initial status when creating but never when editing', () => {
    calendar.openCreate();
    calendar.draft.title = 'Gửi hồ sơ'; calendar.draft.status = 'urgent';
    calendar.save({ invalid: false } as NgForm);
    const create = http.expectOne(req => req.method === 'POST');
    expect(create.request.body.Status).toBe('urgent');
    create.flush({ EventId: 'id', StartDate: calendar.draft.date });
    http.expectOne(req => req.url.endsWith('/PersonalCalendar')).flush([]);
    flushTasks(http);

    calendar.openEdit({ ...calendar.draft, id: 'id', version: 1, status: 'done' });
    calendar.save({ invalid: false } as NgForm);
    const update = http.expectOne(req => req.method === 'PUT');
    expect(update.request.body.Status).toBeUndefined();
    update.flush({ EventId: 'id', StartDate: calendar.draft.date });
    http.expectOne(req => req.url.endsWith('/PersonalCalendar')).flush([]);
    flushTasks(http);
  });
});

describe('Personal calendar lunar dates', () => {
  it('keeps the dialog actions below the scrollable form on a short screen', () => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, TranslateModule.forRoot(), PersonalCalendarComponent],
      providers: [provideRouter([]), { provide: NZ_ICONS, useValue: Object.values(icons) }],
    });
    const http = TestBed.inject(HttpTestingController);
    useLanguage('vi');
    const fixture = TestBed.createComponent(PersonalCalendarComponent);
    fixture.detectChanges();
    http.expectOne(req => req.url.endsWith('/PersonalCalendar')).flush([]);
    flushTasks(http);
    fixture.componentInstance.repeatWeekly = true;
    fixture.detectChanges();
    const dialog: HTMLDialogElement = fixture.nativeElement.querySelector('dialog');
    const form: HTMLElement = dialog.querySelector('form')!;
    form.style.maxHeight = '350px';
    dialog.showModal();
    const scroll: HTMLElement = dialog.querySelector('.dialog-scroll')!;
    const actions: HTMLElement = dialog.querySelector('.dialog-actions')!;
    expect(scroll.scrollHeight).toBeGreaterThan(scroll.clientHeight);
    expect(scroll.getBoundingClientRect().bottom).toBeLessThanOrEqual(actions.getBoundingClientRect().top + 1);
    scroll.scrollTop = scroll.scrollHeight;
    expect(scroll.scrollTop).toBeGreaterThan(0);
    expect(scroll.getBoundingClientRect().bottom).toBeLessThanOrEqual(actions.getBoundingClientRect().top + 1);
    dialog.close();
    http.verify();
  });

  it('renders the lunar day under each solar day with N for a leap month', () => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, TranslateModule.forRoot(), PersonalCalendarComponent],
      providers: [provideRouter([]), { provide: NZ_ICONS, useValue: Object.values(icons) }],
    });
    const http = TestBed.inject(HttpTestingController);
    useLanguage('vi');
    const fixture = TestBed.createComponent(PersonalCalendarComponent);
    fixture.componentInstance.month = new Date(2025, 6, 1);
    fixture.detectChanges();
    http.expectOne(req => req.url.endsWith('/PersonalCalendar')).flush([]);
    flushTasks(http);
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

  it('renders status filters, changes a status and lists the filtered status across all dates', async () => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, TranslateModule.forRoot(), PersonalCalendarComponent],
      providers: [provideRouter([]), { provide: NZ_ICONS, useValue: Object.values(icons) }],
    });
    const http = TestBed.inject(HttpTestingController);
    useLanguage('vi');
    const fixture = TestBed.createComponent(PersonalCalendarComponent);
    fixture.detectChanges();
    const today = fixture.componentInstance.key(fixture.componentInstance.today);
    const event = (id: string, title: string, status: CalendarStatus) => ({ EventId: id, Version: 1, Title: title, StartDate: today, EndDate: today, StartTime: '09:00', EndTime: '10:00', AllDay: false, Category: 'work', Location: '', Notes: '', Status: status });
    http.expectOne(req => req.url.endsWith('/PersonalCalendar')).flush([event('a', 'Gửi hồ sơ', 'urgent'), event('b', 'Họp nhóm', 'done')]);
    flushTasks(http, { Counts: { urgent: 4, done: 9 }, Total: 13 });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const page: HTMLElement = fixture.nativeElement;
    expect(page.querySelectorAll('.status-filter button').length).toBe(6);
    // Số trên nút lọc là toàn hệ thống, không phải tháng đang xem.
    expect(page.querySelector('.status-filter [data-status="urgent"] .status-count')!.textContent!.trim()).toBe('4');
    expect(page.querySelector('.day-event[data-status="done"]')).not.toBeNull();
    const urgent = page.querySelector('.agenda-event[data-status="urgent"]')!;
    const select: HTMLSelectElement = urgent.querySelector('select.event-status')!;
    expect(select.selectedOptions[0].textContent!.trim()).toBe('T_CALENDAR_STATUS_URGENT');

    select.selectedIndex = fixture.componentInstance.statuses.findIndex(status => status.id === 'in_progress');
    select.dispatchEvent(new Event('change'));
    http.expectOne(req => req.method === 'PUT' && req.url.endsWith('/PersonalCalendar/a/status')).flush({});
    flushTasks(http, { Counts: { urgent: 3, in_progress: 1, done: 9 }, Total: 13 });
    fixture.detectChanges();
    expect(page.querySelector('.agenda-event[data-status="in_progress"]')).not.toBeNull();

    (page.querySelector('.status-filter [data-status="done"]') as HTMLButtonElement).click();
    flushTasks(http, { Counts: { urgent: 3, in_progress: 1, done: 9 }, Total: 9, Items: [event('b', 'Họp nhóm', 'done'), { ...event('c', 'Dọn nhà', 'done'), StartDate: '2025-12-01', EndDate: '2025-12-01' }] }, 'done');
    fixture.detectChanges();
    expect(page.querySelector('.agenda-card h2')!.textContent!.trim()).toBe('T_CALENDAR_STATUS_DONE');
    expect(page.querySelectorAll('.task-date').length).toBe(2);
    expect(Array.from(page.querySelectorAll('.agenda-event strong'), item => item.textContent)).toEqual(['Họp nhóm', 'Dọn nhà']);
    expect(page.querySelectorAll('.day-event[data-status="urgent"]').length).toBe(0);
    http.verify();
  });
});
