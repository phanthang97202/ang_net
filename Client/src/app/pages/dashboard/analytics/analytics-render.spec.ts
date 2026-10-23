import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { NZ_ICONS } from 'ng-zorro-antd/icon';
import {
  ArrowLeftOutline,
  ReloadOutline,
  CalendarOutline,
  TeamOutline,
  GlobalOutline,
  ReadOutline,
  PlayCircleOutline,
  VideoCameraOutline,
  InfoCircleOutline,
  HistoryOutline,
  WarningOutline,
  ArrowUpOutline,
  BarChartOutline,
} from '@ant-design/icons-angular/icons';
import { AnalyticsComponent } from './analytics.component';

describe('Canonical analytics rendered states', () => {
  it('renders missing as a dash, preserves real partial counts and explains the selected metric', () => {
    TestBed.configureTestingModule({
      imports: [
        AnalyticsComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot(),
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: NZ_ICONS,
          useValue: [
            ArrowLeftOutline,
            ReloadOutline,
            CalendarOutline,
            TeamOutline,
            GlobalOutline,
            ReadOutline,
            PlayCircleOutline,
            VideoCameraOutline,
            InfoCircleOutline,
            HistoryOutline,
            WarningOutline,
            ArrowUpOutline,
            BarChartOutline,
          ],
        },
      ],
    });
    const fixture = TestBed.createComponent(AnalyticsComponent);
    const http = TestBed.inject(HttpTestingController);
    const counts = { Sessions: 0, Pages: 0, Articles: 0, Movies: 1, Reels: 0 };
    http
      .expectOne(req => req.url.endsWith('/Analytics/Report'))
      .flush({
        Success: true,
        Data: {
          From: '2026-10-17',
          To: '2026-10-23',
          PreviousFrom: '2026-10-10',
          PreviousTo: '2026-10-16',
          GeneratedAt: '2026-10-23T10:00:00Z',
          CollectionStartedAt: '2026-10-23T08:19:21Z',
          Current: counts,
          Previous: { ...counts, Movies: 0 },
          Online: 0,
          Points: [{ ...counts, Bucket: '2026-10-23' }],
          PreviousPoints: [],
          TopArticles: [],
          TopMovies: [],
          DataQuality: {
            Sessions: {
              Current: 'unavailable',
              Previous: 'unavailable',
              CanCompare: false,
              Reason: 'Dữ liệu liên tục từ 15:19 23/10/2026',
            },
            Movies: {
              Current: 'partial',
              Previous: 'unavailable',
              CanCompare: false,
              Reason: 'Dữ liệu liên tục từ 15:19 23/10/2026',
            },
          },
        },
      });
    fixture.detectChanges();
    const cards = fixture.nativeElement.querySelectorAll(
      '.metric-grid button'
    ) as NodeListOf<HTMLButtonElement>;
    expect(cards[0].querySelector('strong')?.textContent).toBe('—');
    expect(cards[3].querySelector('strong')?.textContent?.trim()).toBe('1');
    expect(cards[3].textContent).toContain('Số liệu một phần');
    expect(fixture.nativeElement.textContent).not.toContain(
      'Chưa đủ dữ liệu so sánh'
    );
    cards[3].click();
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('.collection-notice').textContent
    ).toContain('23/10/2026');
    expect(fixture.componentInstance.canCompare('Movies')).toBeFalse();
    http.verify();
    fixture.destroy();
  });
});
