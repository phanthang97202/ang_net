import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { NZ_ICONS } from 'ng-zorro-antd/icon';
import * as icons from '@ant-design/icons-angular/icons';
import { signal } from '@angular/core';
import { of, Subject } from 'rxjs';
import { ChatWidgetComponent } from './chat-widget.component';
import { ChatService } from '../../services/ws-chat.service';
import { AuthService, ShowErrorService } from '../../services';
import { IChat } from '../../interfaces';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { By } from '@angular/platform-browser';
import { ChatBoxComponent } from './chat-box.component';

describe('Chat notification widget', () => {
  let chat: any;
  beforeEach(() => {
    chat = {
      canView: true,
      canSend: false,
      identity: 'account:me',
      unreadCount: signal(2),
      latestMessage: signal({
        UserId: 'other',
        SenderName: 'Bạn',
        Message: '<img src=x onerror=alert(1)>',
        Type: 'string',
      }),
      error: signal(''),
      connected: signal(true),
      received$: new Subject<IChat>(),
      reconnected$: new Subject<void>(),
      startConnection: jasmine.createSpy().and.resolveTo(),
      stopConnection: jasmine.createSpy(),
      getMessage: () => of({ objResult: { DataList: [], ItemCount: 0 } }),
      markRead: jasmine.createSpy().and.resolveTo(),
      sendMessage: jasmine.createSpy().and.resolveTo(),
      uploadImage: jasmine.createSpy(),
    };
    TestBed.configureTestingModule({
      imports: [
        ChatWidgetComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot(),
        HttpClientTestingModule,
      ],
      providers: [
        { provide: ChatService, useValue: chat },
        { provide: NZ_ICONS, useValue: Object.values(icons) },
        {
          provide: AuthService,
          useValue: { getAccountInfo: () => ({ nameid: 'me', email: '' }) },
        },
        {
          provide: ShowErrorService,
          useValue: { setShowError: jasmine.createSpy() },
        },
      ],
    });
  });
  it('shows unread count and a safe latest-message label without opening chat', fakeAsync(() => {
    const f = TestBed.createComponent(ChatWidgetComponent);
    f.detectChanges();
    tick();
    expect(chat.startConnection).toHaveBeenCalledTimes(1);
    expect(f.nativeElement.querySelector('.chat-unread').textContent).toContain(
      '2'
    );
    expect(
      f.nativeElement.querySelector('.chat-preview').textContent
    ).toContain('<img src=x onerror=alert(1)>');
    expect(f.nativeElement.querySelector('.chat-preview img')).toBeNull();
    chat.unreadCount.set(150);
    chat.latestMessage.set({
      UserId: 'other',
      Type: 'jpg',
      Message: 'https://example.com/p.jpg',
    });
    f.detectChanges();
    expect(f.nativeElement.querySelector('.chat-unread').textContent).toContain(
      '99+'
    );
    expect(
      f.nativeElement.querySelector('.chat-preview').textContent
    ).toContain('Đã gửi một ảnh');
    chat.unreadCount.set(0);
    f.detectChanges();
    expect(f.nativeElement.querySelector('.chat-preview')).toBeNull();
    f.destroy();
    tick(1000);
    expect(chat.stopConnection).toHaveBeenCalledTimes(1);
  }));
  it('lets viewers read but hides the composer and removes receive handlers on close', fakeAsync(() => {
    const f = TestBed.createComponent(ChatWidgetComponent);
    f.detectChanges();
    (
      f.nativeElement.querySelector('.chat-toggle-btn') as HTMLButtonElement
    ).click();
    f.detectChanges();
    tick(150);
    expect(f.nativeElement.querySelector('.chat-input-area')).toBeNull();
    expect(f.nativeElement.textContent).toContain('Cần quyền gửi');
    expect(chat.received$.observers.length).toBe(1);
    (
      f.nativeElement.querySelector('.chat-close-btn') as HTMLButtonElement
    ).click();
    f.detectChanges();
    tick();
    expect(chat.received$.observers.length).toBe(0);
    (
      f.nativeElement.querySelector('.chat-toggle-btn') as HTMLButtonElement
    ).click();
    f.detectChanges();
    tick(150);
    expect(chat.received$.observers.length).toBe(1);
    chat.canSend = true;
    f.detectChanges();
    expect(
      f.nativeElement.querySelector('[aria-label="Gửi tin nhắn"]')
    ).not.toBeNull();
    f.destroy();
    tick(1000);
  }));
  it('hides the launcher when view permission is absent', fakeAsync(() => {
    chat.canView = false;
    const f = TestBed.createComponent(ChatWidgetComponent);
    f.detectChanges();
    expect(f.nativeElement.querySelector('.chat-toggle-btn')).toBeNull();
    f.destroy();
    tick(1000);
  }));
  it('blocks uploads for viewers and sends uploaded images using the HTTPS URL', fakeAsync(() => {
    chat.uploadImage.and.returnValue(
      of({
        Success: true,
        Data: { Url: 'https://example.com/image.jpg' },
      })
    );
    const f = TestBed.createComponent(ChatWidgetComponent);
    f.detectChanges();
    f.componentInstance.open = true;
    f.detectChanges();
    tick(150);
    const box = f.debugElement.query(By.directive(ChatBoxComponent))
      .componentInstance as ChatBoxComponent;
    const file = new File(['sample'], 'image.jpg', { type: 'image/jpeg' });
    box.handleUploadFile(file);
    expect(chat.uploadImage).not.toHaveBeenCalled();
    chat.canSend = true;
    box.handleUploadFile(file);
    expect(box.newMessage).toBe('https://example.com/image.jpg');
    void box.sendMessage();
    tick();
    expect(chat.sendMessage).toHaveBeenCalledOnceWith(
      'account:me',
      'https://example.com/image.jpg',
      'jpg'
    );
    f.destroy();
    tick(1000);
  }));
  it('rejects files at or above 2 MB and unsupported files before uploading, preserving the draft', fakeAsync(() => {
    chat.canSend = true;
    const f = TestBed.createComponent(ChatWidgetComponent);
    f.detectChanges();
    f.componentInstance.open = true;
    f.detectChanges();
    tick(150);
    const box = f.debugElement.query(By.directive(ChatBoxComponent))
      .componentInstance as ChatBoxComponent;
    box.newMessage = 'Draft';
    for (const size of [2 * 1024 * 1024, 2 * 1024 * 1024 + 1]) {
      box.handleUploadFile(
        new File([new Uint8Array(size)], 'large.png', { type: 'image/png' })
      );
      expect(box.sendError).toContain('nhỏ hơn 2 MB');
    }
    box.handleUploadFile(
      new File(['text'], 'file.txt', { type: 'text/plain' })
    );
    expect(box.sendError).toContain('JPG, PNG, GIF hoặc WebP');
    expect(chat.uploadImage).not.toHaveBeenCalled();
    expect(box.newMessage).toBe('Draft');
    expect(box.isUploading).toBeFalse();
    f.destroy();
    tick(1000);
  }));
  it('renders the database sender name and avatar for history and realtime without exposing email', fakeAsync(() => {
    const message: IChat = {
      MessageId: 'db',
      Sequence: 1,
      UserId: 'private@example.com',
      SenderName: 'Thang Phan',
      SenderAvatar: 'https://example.com/avatar.jpg',
      Message: 'Hi',
      Type: 'string',
      CreatedDTime: new Date(),
    };
    chat.getMessage = () =>
      of({ objResult: { DataList: [message], ItemCount: 1 } });
    const f = TestBed.createComponent(ChatWidgetComponent);
    f.detectChanges();
    f.componentInstance.open = true;
    f.detectChanges();
    tick(150);
    f.detectChanges();
    expect(f.nativeElement.querySelector('.message-author').textContent).toBe(
      'Thang Phan'
    );
    expect(
      f.nativeElement.querySelector('.message-avatar img').getAttribute('src')
    ).toBe(message.SenderAvatar);
    expect(f.nativeElement.textContent).not.toContain(message.UserId);
    chat.received$.next({ ...message, MessageId: 'live', Sequence: 2 });
    tick(60);
    f.detectChanges();
    expect(f.nativeElement.querySelectorAll('.message-author').length).toBe(2);
    f.destroy();
    tick(1000);
  }));
  it('acknowledges only when visible and reading the newest displayed message', fakeAsync(() => {
    const f = TestBed.createComponent(ChatWidgetComponent);
    f.detectChanges();
    f.componentInstance.open = true;
    f.detectChanges();
    tick(150);
    const box = f.debugElement.query(By.directive(ChatBoxComponent))
      .componentInstance as ChatBoxComponent;
    box.messages = [
      {
        MessageId: 'm1',
        Sequence: 4,
        UserId: 'other',
        Message: 'Hello',
        Type: 'string',
        CreatedDTime: new Date(),
      },
    ];
    const el = box.chatContainer.nativeElement;
    Object.defineProperty(el, 'scrollHeight', {
      value: 500,
      configurable: true,
    });
    Object.defineProperty(el, 'clientHeight', {
      value: 100,
      configurable: true,
    });
    const visibility = spyOnProperty(
      document,
      'visibilityState',
      'get'
    ).and.returnValue('hidden');
    void box.acknowledge();
    tick();
    expect(chat.markRead).not.toHaveBeenCalled();
    visibility.and.returnValue('visible');
    el.scrollTop = 0;
    void box.acknowledge();
    tick();
    expect(chat.markRead).not.toHaveBeenCalled();
    // Use an actual scrollable element for the viewport-independent geometry test.
    Object.defineProperty(el, 'scrollTop', {
      value: 400,
      writable: true,
      configurable: true,
    });
    void box.acknowledge();
    tick();
    expect(chat.markRead).toHaveBeenCalledOnceWith(4);
    f.destroy();
    tick(1000);
  }));
});
