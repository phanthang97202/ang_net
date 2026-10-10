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
  let canSendImage: boolean;
  let accountId: string;
  let canDelete: boolean;
  beforeEach(() => {
    canSend = false;
    canSendImage = false;
    accountId = 'me';
    canDelete = false;
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: AuthService,
          useValue: {
            getToken: () => 'test-token',
            getAccountInfo: () => ({ nameid: accountId, email: '' }),
            hasPermission: (p: string) =>
              p === 'chat.view' ||
              (p === 'chat.send' && canSend) ||
              (p === 'chat.send_image' && canSendImage) ||
              (p === 'chat.delete' && canDelete),
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
  it('blocks deleting before HTTP without chat.delete permission', async () => {
    await expectAsync(service.deleteMessage('m1')).toBeRejected();
    http.expectNone(() => true);
  });
  it('removes the deleted preview, emits once and reloads the authoritative unread count', async () => {
    canDelete = true;
    service.latestMessage.set({ MessageId: 'm/1' } as any);
    const events: string[] = [];
    service.deleted$.subscribe(m => events.push(m.MessageId));
    for (let i = 0; i < 2; i++) {
      const deleting = service.deleteMessage('m/1');
      const req = http.expectOne(r => r.url.endsWith('/chat/m%2F1'));
      expect(req.request.method).toBe('DELETE');
      req.flush({ Success: true, Data: { MessageId: 'm/1', Sequence: 3 } });
      await deleting;
      expect(service.latestMessage()).toBeNull();
      const notification = http.expectOne(r =>
        r.url.endsWith('/notifications')
      );
      notification.flush({
        Success: true,
        Data: { UnreadCount: 0, LatestMessage: null },
      });
      await Promise.resolve();
    }
    expect(events).toEqual(['m/1']);
    expect(service.isMessageDeleted('m/1')).toBeTrue();
    expect(service.unreadCount()).toBe(0);
    service.stopConnection();
    expect(service.isMessageDeleted('m/1')).toBeFalse();
  });
  it('requires send permission and a file below 2 MB, then uploads through the protected chat API', () => {
    const file = new File(['image'], 'a.png', { type: 'image/png' });
    let failed = false;
    service.sendImage(file).subscribe({ error: () => (failed = true) });
    expect(failed).toBeTrue();
    canSend = true;
    canSendImage = true;
    failed = false;
    service
      .sendImage(
        new File([new Uint8Array(2 * 1024 * 1024)], 'a.png', {
          type: 'image/png',
        })
      )
      .subscribe({ error: () => (failed = true) });
    expect(failed).toBeTrue();
    http.expectNone(r => r.url.endsWith('/image'));
    service.sendImage(file).subscribe();
    const request = http.expectOne(r => r.url.endsWith('/chat/image'));
    expect(request.request.method).toBe('POST');
    expect(request.request.body.get('file').size).toBe(file.size);
    request.flush({
      Success: true,
      Data: { MessageId: 'image-1', Type: 'image', Message: '[Hình ảnh]' },
    });
  });
  it('blocks image upload and realtime image sending when only text send permission is granted', async () => {
    canSend = true;
    expect(service.canSend).toBeTrue();
    expect(service.canSendImage).toBeFalse();
    let denied = false;
    service
      .sendImage(new File(['sample'], 'a.png', { type: 'image/png' }))
      .subscribe({ error: () => (denied = true) });
    expect(denied).toBeTrue();
    const start = spyOn(service, 'startConnection').and.resolveTo();
    await expectAsync(
      service.sendMessage('account:me', 'https://example.com/a.png', 'jpg')
    ).toBeRejectedWithError('Bạn không có quyền gửi ảnh.');
    expect(start).not.toHaveBeenCalled();
    http.expectNone(() => true);
  });
  it('fetches an image as binary through authenticated HTTP and cancels on disconnect', () => {
    service.getImage('m/1').subscribe({ error: () => undefined });
    const image = http.expectOne(r => r.url.endsWith('/chat/m%2F1/image'));
    expect(image.request.responseType).toBe('blob');
    service.stopConnection();
    expect(image.cancelled).toBeTrue();
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
