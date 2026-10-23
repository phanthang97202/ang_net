import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { MovieViewLogsComponent } from './movie-view-logs.component';

describe('Movie log data flow', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads by cursor, keeps rows on failure and cancels old filters', () => {
    const component = TestBed.runInInjectionContext(
      () => new MovieViewLogsComponent()
    );
    const request = () =>
      http.expectOne(req => req.url.endsWith('/MovieViewLogs'));

    request().flush({
      Success: true,
      Data: { Items: [{ EventId: 'a' }], NextCursor: 'page-2' },
    });
    component.more();
    const second = request();
    expect(second.request.params.get('cursor')).toBe('page-2');
    second.flush({}, { status: 503, statusText: 'Unavailable' });
    expect(component.rows.length).toBe(1);
    expect(component.nextCursor).toBe('page-2');

    component.more();
    request().flush({
      Success: true,
      Data: {
        Items: [{ EventId: 'a' }, { EventId: 'b' }],
        NextCursor: 'page-3',
      },
    });
    expect(component.rows.map(row => row.EventId)).toEqual(['a', 'b']);

    component.more();
    const stale = request();
    component.keyword = 'another film';
    component.search();
    expect(stale.cancelled).toBeTrue();
    const filtered = request();
    expect(filtered.request.params.get('keyword')).toBe('another film');
    expect(filtered.request.params.has('cursor')).toBeFalse();
    filtered.flush({ Success: true, Data: { Items: [], NextCursor: null } });
    expect(component.rows.length).toBe(0);
  });
});
