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
        {
          provide: AuthService,
          useValue: {
            isLoggedIn: () => true,
            getAccountInfo: () => ({ nameid: 'me' }),
          },
        },
      ],
    });
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('vi', { T_NOTIFICATIONS: 'Thông báo' });
    translate.use('vi');
    http = TestBed.inject(HttpTestingController);
    state = TestBed.inject(BlogNotificationService);
    spyOn(state as unknown as { connect(): void }, 'connect').and.stub();
  });
  // Closing the last menu cancels focus-triggered background refresh requests.
  afterEach(() => http.verify({ ignoreCancelled: true }));

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
    http.expectOne(`${url}/Unread`).flush({ UnreadCount: 0 });
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(['/news', 'category', 'post'], {
      queryParams: { commentId: 'reply-on-page-9' },
      fragment: 'news-comment-reply-on-page-9',
    });
    expect(state.activeMenu()).toBeNull();
    fixture.destroy();
    tick();
  }));

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
