import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { NgForm } from '@angular/forms';
import { addDays, addMonths, startOfMonth } from 'date-fns';
import { PersonalCalendarComponent } from './personal-calendar.component';

describe('Personal calendar', () => {
  let http: HttpTestingController;
  let calendar: PersonalCalendarComponent;
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule, PersonalCalendarComponent] });
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
});
