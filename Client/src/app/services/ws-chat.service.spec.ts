import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ChatService } from './ws-chat.service';
import { AuthService } from './auth.service';

describe('Chat service notification state', () => {
  let service: ChatService;
  let http: HttpTestingController;
  let canSend: boolean;
  let accountId: string;
  beforeEach(() => {
    canSend = false;
    accountId = 'me';
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: AuthService,
          useValue: {
            getToken: () => 'test-token',
            getAccountInfo: () => ({ nameid: accountId, email: '' }),
            hasPermission: (p: string) => p === 'chat.view' || canSend,
          },
        },
      ],
    });
    service = TestBed.inject(ChatService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => {
    service.stopConnection();
    http.verify();
  });
  it('rejects sending before invoking a connection without send permission', async () => {
    await expectAsync(
      service.sendMessage('account:me', 'Hi', 'string')
    ).toBeRejected();
    http.expectNone(() => true);
  });
  it('ignores older responses and clears private notification state on disconnect', async () => {
    const first = service.syncNotifications();
    const a = http.expectOne(r => r.url.endsWith('/notifications'));
    const second = service.syncNotifications();
    const b = http.expectOne(r => r.url.endsWith('/notifications'));
    b.flush({
      Success: true,
      Data: { UnreadCount: 1, LatestMessage: { Message: 'New' } },
    });
    await second;
    a.flush({
      Success: true,
      Data: { UnreadCount: 5, LatestMessage: { Message: 'Old' } },
    });
    await first;
    expect(service.unreadCount()).toBe(1);
    expect(service.latestMessage()?.Message).toBe('New');
    const third = service.syncNotifications();
    const c = http.expectOne(r => r.url.endsWith('/notifications'));
    service.stopConnection();
    expect(c.cancelled).toBeTrue();
    await third;
    expect(service.unreadCount()).toBe(0);
    expect(service.latestMessage()).toBeNull();
  });
  it('cancels pending private requests when the account changes', async () => {
    const old = service.syncNotifications();
    const a = http.expectOne(r => r.url.endsWith('/notifications'));
    accountId = 'other';
    const current = service.syncNotifications();
    const b = http.expectOne(r => r.url.endsWith('/notifications'));
    expect(a.cancelled).toBeTrue();
    b.flush({
      Success: true,
      Data: { UnreadCount: 2, LatestMessage: { Message: 'Current account' } },
    });
    await Promise.all([old, current]);
    expect(service.unreadCount()).toBe(2);
    expect(service.latestMessage()?.Message).toBe('Current account');
  });
});
