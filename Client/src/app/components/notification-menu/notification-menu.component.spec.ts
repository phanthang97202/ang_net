import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NotificationMenuComponent } from './notification-menu.component';
import { BlogNotificationService } from '../../services/blog-notification.service';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';
import { NZ_ICONS } from 'ng-zorro-antd/icon';
import { CalendarOutline } from '@ant-design/icons-angular/icons';

describe('Notification menu', () => {
  const url = `${environment.apiUrl}Notifications`;
  let http: HttpTestingController;
  let state: BlogNotificationService;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        NotificationMenuComponent,
        TranslateModule.forRoot(),
        NoopAnimationsModule,
      ],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: NZ_ICONS, useValue: [CalendarOutline] },
        {
          provide: AuthService,
          useValue: {
            isLoggedIn: () => true,
            getAccountInfo: () => ({ nameid: 'me' }),
            hasPermission: () => false,
          },
        },
      ],
    });
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('vi', {
      T_NOTIFICATIONS: 'Thông báo',
      T_NOTIFICATION_POST_LIKED: 'đã thả tim bài viết của bạn',
      T_NOTIFICATION_RATED: 'đã đánh giá bài viết của bạn {{point}}/10 điểm',
    });
    translate.use('vi');
    http = TestBed.inject(HttpTestingController);
    state = TestBed.inject(BlogNotificationService);
    spyOn(state as unknown as { connect(): void }, 'connect').and.stub();
  });
  // Closing the last menu cancels focus-triggered background refresh requests.
  afterEach(() => http.verify({ ignoreCancelled: true }));

  function settleUnread(count: number): void {
    // Chrome may also refresh the badge when the bell receives window focus.
    const requests = http.match(`${url}/Unread`);
    expect(requests.length).toBeGreaterThan(0);
    requests.forEach(request => request.flush({ UnreadCount: count }));
  }

  it('shows today’s calendar events separately from unread interactions and opens today', fakeAsync(() => {
    spyOn(TestBed.inject(AuthService), 'hasPermission').and.returnValue(true);
    const fixture = TestBed.createComponent(NotificationMenuComponent);
    fixture.detectChanges();
    http.expectOne(`${url}/Unread`).flush({ UnreadCount: 0 });
    http.expectOne(req => req.url.endsWith('/PersonalCalendar')).flush([{
      EventId: 'event-1', Title: 'Đi chơi', StartDate: '2026-10-27', EndDate: '2026-10-27',
      StartTime: '09:00', EndTime: '10:00', AllDay: false, Category: 'leisure', Location: '', Notes: '', Version: 1,
    }]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.calendar-indicator')).not.toBeNull();
    fixture.componentInstance.openChange(true);
    http.expectOne(req => req.url === url).flush({ Success: true, objResult: { DataList: [], HasMore: false, NextCursor: null, UnreadCount: 0, SnapshotAt: new Date().toISOString() } });
    http.expectOne(req => req.url.endsWith('/PersonalCalendar')).flush([{
      EventId: 'event-1', Title: 'Đi chơi', StartDate: '2026-10-27', EndDate: '2026-10-27',
      StartTime: '09:00', EndTime: '10:00', AllDay: false, Category: 'leisure', Location: '', Notes: '', Version: 1,
    }]);
    fixture.detectChanges(); tick(500); fixture.detectChanges();
    const link = document.querySelector('.calendar-reminder') as HTMLAnchorElement;
    expect(link?.textContent).toContain('Đi chơi');
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    link.click();
    expect(navigate).toHaveBeenCalledWith(['/calendar'], { queryParams: { date: fixture.componentInstance.calendar.today } });
    fixture.destroy(); tick();
  }));

  it('opens the bell list, shows unread state and routes to the exact comment', fakeAsync(() => {
    const fixture = TestBed.createComponent(NotificationMenuComponent);
    fixture.detectChanges();
    http.expectOne(`${url}/Unread`).flush({ UnreadCount: 1 });
    fixture.detectChanges();
    const bell = fixture.nativeElement.querySelector(
      'button'
    ) as HTMLButtonElement;
    expect(bell.getAttribute('aria-label')).toBe('Thông báo: 1');
    bell.click();
    fixture.detectChanges();
    tick(500);
    fixture.detectChanges();
    http
      .expectOne(req => req.url === url)
      .flush({
        Success: true,
        objResult: {
          DataList: [
            {
              NotificationId: 'notification',
              ActorName: 'Reader',
              ActorAvatar: null,
              NewsId: 'post',
              CategoryNewsId: 'category',
              CommentId: 'reply-on-page-9',
              Kind: 'Reply',
              Title: 'A post',
              Excerpt: '<script>plain text</script>',
              CreatedAt: new Date().toISOString(),
              ReadAt: null,
            },
          ],
          HasMore: false,
          NextCursor: null,
          UnreadCount: 1,
          SnapshotAt: new Date().toISOString(),
        },
      });
    fixture.detectChanges();
    tick();
    const link = document.querySelector(
      '.notification--unread'
    ) as HTMLAnchorElement;
    expect(link).not.toBeNull();
    expect(link.textContent).toContain('Reader');
    expect(link.querySelector('script')).toBeNull();
    expect(link.getAttribute('href')).toContain('commentId=reply-on-page-9');
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(
      true
    );
    link.click();
    fixture.detectChanges();
    tick(500);
    http.expectOne(`${url}/notification/Read`).flush({ UnreadCount: 0 });
    settleUnread(0);
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(['/news', 'category', 'post'], {
      queryParams: { commentId: 'reply-on-page-9' },
      fragment: 'news-comment-reply-on-page-9',
    });
    expect(state.activeMenu()).toBeNull();
    fixture.destroy();
    tick();
  }));

  for (const kind of ['PostLiked', 'Rated']) {
    it(`shows ${kind} notifications and opens the article without a comment destination`, fakeAsync(() => {
      const fixture = TestBed.createComponent(NotificationMenuComponent);
      fixture.detectChanges();
      http.expectOne(`${url}/Unread`).flush({ UnreadCount: 1 });
      const bell = fixture.nativeElement.querySelector(
        'button'
      ) as HTMLButtonElement;
      bell.click();
      fixture.detectChanges();
      tick(500);
      fixture.detectChanges();
      http
        .expectOne(request => request.url === url)
        .flush({
          Success: true,
          objResult: {
            DataList: [
              {
                NotificationId: 'reaction',
                ActorName: 'Reader',
                ActorAvatar: null,
                NewsId: 'post',
                CategoryNewsId: 'category',
                CommentId: null,
                Kind: kind,
                Point: kind === 'Rated' ? 0 : null,
                Title: 'A post',
                Excerpt: '',
                CreatedAt: new Date().toISOString(),
                ReadAt: null,
              },
            ],
            HasMore: false,
            NextCursor: null,
            UnreadCount: 1,
            SnapshotAt: new Date().toISOString(),
          },
        });
      fixture.detectChanges();
      tick();
      const link = document.querySelector('.notification') as HTMLAnchorElement;
      expect(link.getAttribute('href')).toBe('/news/category/post');
      expect(link.textContent).toContain(
        kind === 'Rated' ? '0/10 điểm' : 'đã thả tim'
      );
      expect(link.querySelector('.notification-excerpt')).toBeNull();
      const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(
        true
      );
      link.click();
      fixture.detectChanges();
      tick(500);
      http.expectOne(`${url}/reaction/Read`).flush({ UnreadCount: 0 });
      settleUnread(0);
      expect(navigate).toHaveBeenCalledOnceWith(
        ['/news', 'category', 'post'],
        {}
      );
      fixture.destroy();
      tick();
    }));
  }

  it('does not mark notifications as read merely by opening, and closes with Escape', fakeAsync(() => {
    const fixture = TestBed.createComponent(NotificationMenuComponent);
    fixture.detectChanges();
    http.expectOne(`${url}/Unread`).flush({ UnreadCount: 2 });
    const bell = fixture.nativeElement.querySelector(
      'button'
    ) as HTMLButtonElement;
    bell.click();
    fixture.detectChanges();
    tick(500);
    fixture.detectChanges();
    http
      .expectOne(req => req.url === url)
      .flush({
        Success: true,
        objResult: {
          DataList: [],
          HasMore: false,
          NextCursor: null,
          UnreadCount: 2,
          SnapshotAt: new Date().toISOString(),
        },
      });
    fixture.detectChanges();
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
    );
    fixture.detectChanges();
    tick(500);
    expect(state.activeMenu()).toBeNull();
    expect(state.unread()).toBe(2);
    http.expectNone(request => request.method === 'POST');
    expect(document.activeElement).toBe(bell);
    fixture.destroy();
    tick();
  }));
});
