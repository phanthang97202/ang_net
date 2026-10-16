import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { BlogNotificationService } from './blog-notification.service';
import { AuthService } from './auth.service';
import { BlogNotification } from '../interfaces/blog-notification';
import { environment } from '../../environments/environment';

describe('Blog notifications state', () => {
  let state: BlogNotificationService;
  let http: HttpTestingController;
  let account: string;
  const url = `${environment.apiUrl}Notifications`;
  const item = (id: string): BlogNotification => ({
    NotificationId: id,
    ActorName: 'Reader',
    ActorAvatar: null,
    NewsId: 'post',
    CategoryNewsId: 'category',
    CommentId: id,
    Kind: 'Reply',
    Title: 'A post',
    TitleEn: null,
    Excerpt: 'A reply',
    CreatedAt: '2026-10-15T07:00:00Z',
    ReadAt: null,
  });
  const page = (items: BlogNotification[], more = false) => ({
    Success: true,
    objResult: {
      DataList: items,
      HasMore: more,
      NextCursor: more ? 'next-page' : null,
      SnapshotAt: '2026-10-16T07:00:00Z',
      UnreadCount: 2,
    },
  });
  beforeEach(() => {
    account = 'me';
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AuthService,
          useValue: {
            isLoggedIn: () => !!account,
            getAccountInfo: () => ({ nameid: account }),
          },
        },
      ],
    });
    state = TestBed.inject(BlogNotificationService);
    http = TestBed.inject(HttpTestingController);
    spyOn(state as unknown as { connect(): void }, 'connect').and.stub();
    state.syncAccount();
    http.expectOne(`${url}/Unread`).flush({ UnreadCount: 2 });
  });
  afterEach(() => http.verify());

  it('loads on opening and appends cursor pages without duplicated notifications', () => {
    state.show('desktop', true);
    const first = http.expectOne(req => req.url === url);
    expect(first.request.params.has('cursor')).toBeFalse();
    first.flush(page([item('a')], true));
    state.load();
    const second = http.expectOne(req => req.url === url);
    expect(second.request.params.get('cursor')).toBe('next-page');
    second.flush(page([item('a'), item('b')]));
    expect(state.items().map(row => row.NotificationId)).toEqual(['a', 'b']);
    expect(state.hasMore()).toBeFalse();
    state.show('desktop', false);
    expect(state.activeMenu()).toBeNull();
    expect(state.unread()).toBe(2);
  });

  it('marks only notifications through the loaded snapshot and persists individual reads', () => {
    state.show('menu', true);
    const response = page([
      item('a'),
      { ...item('b'), CreatedAt: '2026-10-16T07:00:00Z' },
    ]);
    response.objResult.SnapshotAt = '2026-10-16T07:00:00.123Z';
    http.expectOne(req => req.url === url).flush(response);
    state.read(item('a'));
    http.expectOne(`${url}/a/Read`).flush({ UnreadCount: 1 });
    http.expectOne(`${url}/Unread`).flush({ UnreadCount: 1 });
    expect(state.items()[0].ReadAt).not.toBeNull();
    expect(state.items()[1].ReadAt).toBeNull();
    state.read();
    const readAll = http.expectOne(`${url}/ReadAll`);
    expect(readAll.request.body).toEqual({
      Through: '2026-10-16T07:00:00.123Z',
    });
    readAll.flush({ UnreadCount: 0 });
    http.expectOne(`${url}/Unread`).flush({ UnreadCount: 0 });
    expect(state.unread()).toBe(0);
    expect(state.items().every(row => !!row.ReadAt)).toBeTrue();
  });

  it('clears private state and cancels in-flight responses when the account changes', () => {
    state.show('menu', true);
    const previous = http.expectOne(req => req.url === url);
    account = 'someone-else';
    state.syncAccount();
    expect(previous.cancelled).toBeTrue();
    expect(state.items()).toEqual([]);
    expect(state.activeMenu()).toBeNull();
    http.expectOne(`${url}/Unread`).flush({ UnreadCount: 7 });
    expect(state.unread()).toBe(7);
    account = '';
    state.syncAccount();
    expect(state.unread()).toBe(0);
    expect(state.items()).toEqual([]);
  });

  it('refreshes a page fetched before a read instead of restoring stale unread rows', () => {
    state.show('menu', true);
    http.expectOne(req => req.url === url).flush(page([item('a')]));
    state.load(true);
    const stale = http.expectOne(req => req.url === url);
    state.read(item('a'));
    http.expectOne(`${url}/a/Read`).flush({ UnreadCount: 0 });
    http.expectOne(`${url}/Unread`).flush({ UnreadCount: 0 });
    stale.flush(page([item('a')]));
    http
      .expectOne(req => req.url === url)
      .flush(page([{ ...item('a'), ReadAt: '2026-10-16T07:00:01Z' }]));
    expect(state.items()[0].ReadAt).not.toBeNull();
  });

  it('ignores stale unread responses after a read and allows retry after a failed page', () => {
    state.show('menu', true);
    http.expectOne(req => req.url === url).flush(page([item('a')]));
    state.refreshUnread();
    const stale = http.expectOne(`${url}/Unread`);
    state.read(item('a'));
    http.expectOne(`${url}/a/Read`).flush({ UnreadCount: 0 });
    stale.flush({ UnreadCount: 99 });
    expect(state.unread()).toBe(0);
    http.expectOne(`${url}/Unread`).flush({ UnreadCount: 0 });
    state.load(true);
    http
      .expectOne(req => req.url === url)
      .flush('offline', { status: 503, statusText: 'Offline' });
    expect(state.error()).toBeTrue();
    state.load(true);
    http.expectOne(req => req.url === url).flush(page([item('b')]));
    expect(state.error()).toBeFalse();
    expect(state.items()[0].NotificationId).toBe('b');
  });
});
