import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import {
  AnalyticsComponent,
  shiftDay,
  vietnamDay,
} from './analytics.component';
import { AnalyticsReport } from '../../../services/web-analytics.service';

describe('Analytics dashboard data flow', () => {
  let http: HttpTestingController;
  const counts = { Sessions: 1, Pages: 2, Articles: 3, Movies: 4, Reels: 5 };
  const report = (): AnalyticsReport => ({
    From: '2026-10-22',
    To: '2026-10-23',
    PreviousFrom: '2026-10-20',
    PreviousTo: '2026-10-21',
    GeneratedAt: '2026-10-23T06:00:00Z',
    CollectionStartedAt: '2026-09-01T00:00:00Z',
    PreviousPeriodComplete: true,
    Online: 2,
    Current: counts,
    Previous: counts,
    Points: [
      { ...counts, Bucket: '2026-10-22' },
      { ...counts, Bucket: '2026-10-23' },
    ],
    PreviousPoints: [
      { ...counts, Bucket: '2026-10-20' },
      { ...counts, Bucket: '2026-10-21' },
    ],
    TopArticles: [],
    TopMovies: [],
  });
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  const create = () =>
    TestBed.runInInjectionContext(() => new AnalyticsComponent());
  const request = () =>
    http.expectOne(req => req.url.endsWith('/Analytics/Report'));

  it('requests the selected range and derives chart points from the API response', () => {
    const component = create();
    const pending = request();
    expect(pending.request.params.get('from')).toBe(shiftDay(vietnamDay(), -6));
    pending.flush({ Success: true, Data: report() });
    expect(component.loading).toBeFalse();
    expect(component.chartPoints.length).toBe(2);
    component.selectMetric('Movies');
    expect(component.chartPoints[0].value).toBe(4);
  });

  it('cancels an older range request instead of rendering a stale response', () => {
    const component = create();
    const old = request();
    component.selectPreset(1);
    expect(old.cancelled).toBeTrue();
    const current = request();
    expect(current.request.params.get('from')).toBe(
      current.request.params.get('to')
    );
    current.flush({ Success: true, Data: report() });
  });

  it('disables comparisons when the previous period is not fully covered', () => {
    const component = create();
    component.compare = true;
    request().flush({
      Success: true,
      Data: { ...report(), PreviousPeriodComplete: false },
    });
    expect(component.compare).toBeFalse();
    expect(component.delta('Sessions')).toBe('');
  });

  it('leaves gaps before collection began instead of inventing zeroes', () => {
    const component = create();
    request().flush({
      Success: true,
      Data: {
        ...report(),
        CollectionStartedAt: '2026-10-23T00:00:00Z',
        Points: [
          { ...counts, Sessions: 0, Bucket: '2026-10-22' },
          { ...counts, Bucket: '2026-10-23' },
        ],
      },
    });
    expect(component.chartPoints.length).toBe(1);
    expect(component.chartPoints[0].index).toBe(1);
  });

  it('shows retryable API errors without retaining old metrics', () => {
    const component = create();
    request().flush('failed', { status: 503, statusText: 'Unavailable' });
    expect(component.loading).toBeFalse();
    expect(component.report).toBeNull();
    expect(component.error).toContain('thử lại');
    component.refresh();
    request().flush({ Success: true, Data: report() });
    expect(component.error).toBe('');
  });

  it('does not draw either comparison line into future hours', () => {
    const component = create();
    const data = report();
    data.Points = [
      { ...counts, Bucket: '2026-10-23T12' },
      { ...counts, Bucket: '2026-10-23T23' },
    ];
    data.PreviousPoints = [
      { ...counts, Bucket: '2026-10-22T12' },
      { ...counts, Bucket: '2026-10-22T23' },
    ];
    request().flush({ Success: true, Data: data });
    component.compare = true;
    component.draw();
    expect(component.chartPoints.length).toBe(1);
    expect(component.currentPath).not.toContain('L');
    expect(component.previousPath).not.toContain('L');
  });

  it('formats Vietnam midnight and calendar arithmetic consistently', () => {
    expect(vietnamDay(new Date('2026-10-22T17:00:00Z'))).toBe('2026-10-23');
    expect(shiftDay('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('distinguishes unavailable from a real zero and respects server quality instead of oldest records', () => {
    const component = create();
    const data = report();
    data.Current = { ...counts, Sessions: 0 };
    data.DataQuality = {
      Sessions: {
        Current: 'unavailable',
        Previous: 'unavailable',
        CanCompare: false,
        Reason: 'Dữ liệu từ 23/10',
      },
    };
    request().flush({ Success: true, Data: data });
    expect(component.metricValue('Sessions')).toBe('—');
    expect(component.canCompare('Sessions')).toBeFalse();
    expect(component.delta('Sessions')).toBe('');
    data.DataQuality.Sessions = {
      Current: 'complete',
      Previous: 'complete',
      CanCompare: true,
      Reason: '',
    };
    expect(component.metricValue('Sessions')).toBe(0);
    expect(component.canCompare('Sessions')).toBeTrue();
  });

  it('keeps partial historical facts without exposing technical labels', () => {
    const component = create();
    component.from = '2026-10-22';
    const data = report();
    data.Coverage = { Movies: '2026-10-23T00:00:00Z' };
    data.DataQuality = {
      Movies: {
        Current: 'partial',
        Previous: 'unavailable',
        CanCompare: false,
        Reason: 'Lịch sử một phần',
      },
    };
    request().flush({ Success: true, Data: data });
    component.selectMetric('Movies');
    expect(component.chartPoints.length).toBe(2);
    expect(component.delta('Movies')).toBe('');
    expect(component.canCompare('Movies')).toBeFalse();
  });
});
