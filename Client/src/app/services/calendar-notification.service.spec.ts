import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { format } from 'date-fns';
import { AuthService } from './auth.service';
import { CalendarNotificationService } from './calendar-notification.service';
import { PersonalCalendarService } from './personal-calendar.service';

describe('Calendar reminders', () => {
  let user = 'alice';
  let allowed = true;
  let http: HttpTestingController;
  let reminders: CalendarNotificationService;
  const today = () => format(new Date(), 'yyyy-MM-dd');
  const event = () => ({ EventId: 'event', Title: 'Đi chơi', StartDate: today(), EndDate: today(), StartTime: '09:00', EndTime: '10:00', AllDay: false, Category: 'leisure' as const, Location: '', Notes: '', Version: 1 });
  beforeEach(() => {
    user = 'alice'; allowed = true;
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), { provide: AuthService, useValue: {
      isLoggedIn: () => !!user, hasPermission: () => allowed, getAccountInfo: () => ({ nameid: user }),
    } }] });
    http = TestBed.inject(HttpTestingController);
    reminders = TestBed.inject(CalendarNotificationService);
  });
  afterEach(() => { reminders.detach(); http.verify({ ignoreCancelled: true }); });
  it('loads only today for the permitted account and clears data on logout', () => {
    reminders.attach();
    const request = http.expectOne(req => req.url.endsWith('/PersonalCalendar'));
    expect(request.request.params.get('from')).toBe(today());
    expect(request.request.params.get('to')).toBe(today());
    request.flush([event()]);
    expect(reminders.events()[0].Title).toBe('Đi chơi');
    user = '';
    reminders.syncAccount();
    expect(reminders.events()).toEqual([]);
  });
  it('refreshes after a calendar change and never restores a previous account response', () => {
    reminders.attach();
    const old = http.expectOne(req => req.url.endsWith('/PersonalCalendar'));
    user = 'bob'; reminders.syncAccount();
    expect(old.cancelled).toBeTrue();
    http.expectOne(req => req.url.endsWith('/PersonalCalendar')).flush([event()]);
    const api = TestBed.inject(PersonalCalendarService);
    api.create({ Title: 'Hẹn', StartDate: today(), EndDate: today(), StartTime: '11:00', EndTime: '12:00', AllDay: false, Category: 'personal', Location: '', Notes: '', Version: 0 }).subscribe();
    http.expectOne(req => req.method === 'POST' && req.url.endsWith('/PersonalCalendar')).flush(event());
    http.expectOne(req => req.method === 'GET' && req.url.endsWith('/PersonalCalendar')).flush([]);
    expect(reminders.events()).toEqual([]);
    allowed = false; reminders.syncAccount();
    expect(reminders.events()).toEqual([]);
  });
});
