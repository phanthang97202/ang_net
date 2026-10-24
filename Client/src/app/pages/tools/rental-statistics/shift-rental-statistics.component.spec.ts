import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { NZ_ICONS } from 'ng-zorro-antd/icon';
import * as icons from '@ant-design/icons-angular/icons';
import { addDays, format } from 'date-fns';
import { ShiftRentalStatisticsComponent } from './shift-rental-statistics.component';
import { ShiftRentalStatistics } from '../shift-report/types/shift-report-type';
import { AuthService } from '../../../services';

describe('Shift rental statistics', () => {
  let http: HttpTestingController;
  let permission: boolean;
  const response = (): ShiftRentalStatistics => ({
    FromDate: '2026-10-01',
    ToDate: '2026-10-03',
    ReceptionistName: '',
    Receptionists: ['Huy', 'Long'],
    Summary: {
      TotalRentals: 4,
      DayRentals: 3,
      NightRentals: 1,
      OtherRentals: 0,
      TotalReports: 3,
      IncompleteDays: 2,
    },
    Days: [
      {
        Date: '2026-10-01',
        DayRentals: 3,
        NightRentals: 1,
        OtherRentals: 0,
        DayReports: 1,
        NightReports: 1,
        OtherReports: 0,
        DayShiftReported: true,
        NightShiftReported: true,
      },
      {
        Date: '2026-10-02',
        DayRentals: 0,
        NightRentals: 0,
        OtherRentals: 0,
        DayReports: 1,
        NightReports: 0,
        OtherReports: 0,
        DayShiftReported: true,
        NightShiftReported: false,
      },
      {
        Date: '2026-10-03',
        DayRentals: 0,
        NightRentals: 0,
        OtherRentals: 0,
        DayReports: 0,
        NightReports: 0,
        OtherReports: 0,
        DayShiftReported: false,
        NightShiftReported: false,
      },
    ],
  });
  const request = () =>
    http.expectOne(req => req.url.endsWith('/RentalStatistics'));
  const create = () =>
    TestBed.runInInjectionContext(() => new ShiftRentalStatisticsComponent());
  beforeEach(() => {
    permission = true;
    TestBed.configureTestingModule({
      imports: [ShiftRentalStatisticsComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        { provide: NZ_ICONS, useValue: Object.values(icons) },
        {
          provide: AuthService,
          useValue: {
            isLoggedIn: () => true,
            hasPermission: (code: string) =>
              permission && code === 'rentalstatistics.view',
          },
        },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('sends local calendar dates and the selected receptionist without pagination', () => {
    const component = create();
    component.range = [new Date(2026, 9, 1), new Date(2026, 9, 3)];
    component.receptionist = 'Huy';
    component.load();
    const pending = request();
    expect(pending.request.params.get('fromDate')).toBe('2026-10-01');
    expect(pending.request.params.get('toDate')).toBe('2026-10-03');
    expect(pending.request.params.get('receptionistName')).toBe('Huy');
    expect(pending.request.params.has('pageSize')).toBeFalse();
    pending.flush(response());
    expect(component.data!.Summary.TotalRentals).toBe(4);
    expect(component.receptionists).toEqual(['Huy', 'Long']);
  });

  it('cancels stale filters and clears old values on a failed request', () => {
    const component = create();
    component.load();
    const old = request();
    component.receptionist = 'Long';
    component.load();
    expect(old.cancelled).toBeTrue();
    request().flush(response());
    component.load();
    expect(component.data).toBeNull();
    request().flush({}, { status: 503, statusText: 'Unavailable' });
    expect(component.loading).toBeFalse();
    expect(component.data).toBeNull();
    expect(component.error).toContain('Vui lòng thử lại');
    component.load();
    request().flush(response());
    expect(component.error).toBe('');
  });

  it('rejects invalid ranges locally and cancels an in-flight request without calling an invalid API', () => {
    const component = create();
    component.load();
    const pending = request();
    component.range = [new Date(2026, 0, 1), new Date(2026, 9, 3)];
    component.load();
    expect(pending.cancelled).toBeTrue();
    expect(component.error).toContain('93');
    expect(component.data).toBeNull();
    http.expectNone(req => req.url.includes('/RentalStatistics'));
    component.range = [];
    component.load();
    expect(component.error).toContain('đầy đủ');
  });

  it('uses recorded rentals for shares and keeps zero denominators undefined', () => {
    const component = create();
    component.load();
    request().flush(response());
    expect(component.percent(3, 4)).toBe(75);
    expect(component.percent(0, 0)).toBeNull();
    expect(component.axisMax).toBeGreaterThanOrEqual(3);
    component.mode = 'share';
    expect(component.axisMax).toBe(100);
    expect(component.height(response().Days[0], 'day')).toBe(75);
    expect(component.height(response().Days[0], 'night')).toBe(25);
    expect(component.describe(response().Days[1])).toContain('Ca ngày 0 lượt');
    expect(component.describe(response().Days[1])).toContain(
      'Ca đêm chưa có báo cáo'
    );
  });

  it('leaves the share undefined on days missing a shift, in the chart and the summary', () => {
    const component = create();
    const data = response();
    data.Days[1].DayRentals = 5;
    component.load();
    request().flush(data);
    component.setMode('share');
    expect(component.hasShare(data.Days[1])).toBeFalse();
    expect(component.height(data.Days[1], 'day')).toBe(0);
    expect(component.hasPoint(data.Days[1], 'day')).toBeFalse();
    // Only 01/10 has both shifts: 3 day / 1 night.
    expect(component.share).toEqual({ day: 75, night: 25 });
  });

  it('draws share as a stacked area and never as two mirrored lines', () => {
    const component = create();
    component.load();
    request().flush(response());
    expect(component.chartType).toBe('line');
    component.setMode('share');
    expect(component.chartType).toBe('area');
    expect(component.linePath('day')).toBe('M29,60');
    expect(component.linePath('night', true)).toBe('M29,60 L29,0 L29,0 Z');
    component.setMode('count');
    component.chartType = 'bar';
    component.setMode('share');
    expect(component.chartType).toBe('bar');
  });

  it('judges missing shifts across all receptionists and locks share for one receptionist', () => {
    const component = create();
    component.mode = 'share';
    const data = response();
    data.ReceptionistName = 'Huy';
    data.Days[1].NightShiftReported = true;
    component.receptionist = 'Huy';
    component.load();
    request().flush(data);
    expect(component.mode).toBe('count');
    expect(component.coverageLabel(data.Days[0])).toBe('');
    expect(component.coverageLabel(data.Days[1])).toBe('');
    expect(component.coverageLabel(data.Days[2])).toBe('—');
    expect(component.describe(data.Days[1])).toContain(
      'Ca đêm do lễ tân khác trực'
    );
  });

  it('does not flag shifts of today as missing and blocks future dates', () => {
    const component = create();
    const day = { ...response().Days[1] };
    expect(component.coverageLabel(day)).toBe('Thiếu ca');
    day.Date = format(new Date(), 'yyyy-MM-dd');
    expect(component.coverageLabel(day)).toBe('');
    expect(component.disabledDate(new Date())).toBeFalse();
    expect(component.disabledDate(addDays(new Date(), 1))).toBeTrue();
  });

  it('shows the server validation message for a rejected filter', () => {
    const component = create();
    component.load();
    request().flush(
      { message: 'Tên lễ tân tối đa 100 ký tự.' },
      { status: 400, statusText: 'Bad Request' }
    );
    expect(component.error).toBe('Tên lễ tân tối đa 100 ký tự.');
  });

  it('requires the dedicated permission before fetching statistics', () => {
    const component = create();
    component.load();
    const pending = request();
    permission = false;
    component.load();
    expect(pending.cancelled).toBeTrue();
    expect(component.data).toBeNull();
    expect(component.error).toContain('không có quyền');
    http.expectNone(req => req.url.endsWith('/RentalStatistics'));
  });

  it('keeps gaps for missing shifts and plots recorded zero on the baseline', () => {
    const component = create();
    const data = response();
    data.Days.push({ ...data.Days[0], Date: '2026-10-04' });
    component.load();
    request().flush(data);
    expect(component.linePath('day')).toContain('L87,240');
    expect(component.linePath('day')).not.toContain('L145,');
    expect(component.linePath('day')).toContain('M203,');
    expect(component.linePath('night')).not.toContain('L87,');
    expect(component.linePath('day', true)).toContain('Z');
    component.mode = 'share';
    expect(component.hasPoint(data.Days[1], 'day')).toBeFalse();
  });

  it('renders daily columns and changes to stacked percentages without another request', async () => {
    await TestBed.compileComponents();
    const fixture = TestBed.createComponent(ShiftRentalStatisticsComponent);
    fixture.detectChanges();
    request().flush(response());
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.column').length).toBe(3);
    expect(
      fixture.nativeElement.querySelectorAll('svg.line-graph path.line').length
    ).toBe(2);
    fixture.nativeElement
      .querySelector('.chart-types button:last-child')
      .click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('path.area').length).toBe(2);
    fixture.nativeElement
      .querySelector('.chart-types button:first-child')
      .click();
    const toggle = fixture.nativeElement.querySelector(
      '.mode button:last-child'
    ) as HTMLButtonElement;
    toggle.click();
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('.columns.share')
    ).not.toBeNull();
    const bar = fixture.nativeElement.querySelector('.bar.day') as HTMLElement;
    expect(bar.style.height).toBe('75%');
    expect(
      fixture.nativeElement.querySelectorAll('.coverage-label')[1].textContent
    ).toContain('Thiếu ca');
    expect(
      fixture.nativeElement.querySelector('.chart-types button:nth-child(2)')
        .disabled
    ).toBeTrue();
    http.expectNone(req => req.url.includes('/RentalStatistics'));
  });

  it('disables the share toggle when one receptionist is shown', async () => {
    await TestBed.compileComponents();
    const fixture = TestBed.createComponent(ShiftRentalStatisticsComponent);
    fixture.detectChanges();
    request().flush({ ...response(), ReceptionistName: 'Huy' });
    fixture.detectChanges();
    const share = fixture.nativeElement.querySelector(
      '.mode button:last-child'
    ) as HTMLButtonElement;
    expect(share.disabled).toBeTrue();
  });

  it('scrolls the chart so the latest reported day is visible', async () => {
    await TestBed.compileComponents();
    const fixture = TestBed.createComponent(ShiftRentalStatisticsComponent);
    fixture.nativeElement.style.width = '480px';
    fixture.detectChanges();
    const data = response();
    data.Days = Array.from({ length: 30 }, (_, i) => ({
      ...data.Days[0],
      Date: format(new Date(2026, 8, i + 1), 'yyyy-MM-dd'),
    }));
    request().flush(data);
    fixture.detectChanges();
    const scroll = fixture.nativeElement.querySelector(
      '.chart-scroll'
    ) as HTMLElement;
    expect(scroll.scrollLeft).toBeGreaterThan(0);
    expect(scroll.scrollLeft).toBeCloseTo(
      scroll.scrollWidth - scroll.clientWidth,
      -1
    );
  });
});
