import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NZ_ICONS } from 'ng-zorro-antd/icon';
import * as icons from '@ant-design/icons-angular/icons';
import { signal } from '@angular/core';
import { of, Subject, throwError } from 'rxjs';
import { ChatWidgetComponent } from './chat-widget.component';
import { ChatService } from '../../services/ws-chat.service';
import { AuthService, ShowErrorService } from '../../services';
import { IChat } from '../../interfaces';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { By } from '@angular/platform-browser';
import { ChatBoxComponent } from './chat-box.component';

describe('Chat notification widget', () => {
  let chat: any;
  let imagePermission: boolean;
  beforeEach(() => {
    imagePermission = true;
    chat = {
      canView: true,
      canSend: false,
      canDelete: false,
      isMessageDeleted: () => false,
      deleted$: new Subject(),
      deleteMessage: jasmine.createSpy().and.resolveTo(),
      get canSendImage() {
        return this.canSend && imagePermission;
      },
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
      sendImage: jasmine.createSpy(),
      getImage: jasmine.createSpy(),
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
    ).toContain('[Hình ảnh]');
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
  it('lets text senders use the composer but hides and blocks image selection without image permission', fakeAsync(() => {
    chat.canSend = true;
    imagePermission = false;
    const f = TestBed.createComponent(ChatWidgetComponent);
    f.detectChanges();
    f.componentInstance.open = true;
    f.detectChanges();
    tick(150);
    expect(f.nativeElement.querySelector('.chat-input-area')).not.toBeNull();
    expect(f.nativeElement.querySelector('.upload-btn')).toBeNull();
    expect(f.nativeElement.querySelector('input[type="file"]')).toBeNull();
    const box = f.debugElement.query(By.directive(ChatBoxComponent))
      .componentInstance as ChatBoxComponent;
    box.handleUploadFile(
      new File(['sample'], 'image.png', { type: 'image/png' })
    );
    expect(box.selectedImage).toBeNull();
    expect(chat.sendImage).not.toHaveBeenCalled();
    box.newMessage = 'Text still works';
    void box.sendMessage();
    tick();
    expect(chat.sendMessage).toHaveBeenCalledOnceWith(
      'account:me',
      'Text still works',
      'string'
    );
    imagePermission = true;
    box.handleUploadFile(
      new File(['sample'], 'image.png', { type: 'image/png' })
    );
    imagePermission = false;
    f.detectChanges();
    expect(
      (
        f.nativeElement.querySelector(
          '[aria-label="Gửi tin nhắn"]'
        ) as HTMLButtonElement
      ).disabled
    ).toBeTrue();
    void box.sendMessage();
    tick();
    expect(box.sendError).toContain('không có quyền gửi ảnh');
    expect(chat.sendImage).not.toHaveBeenCalled();
    f.destroy();
    tick(1000);
  }));
  it('keeps the image local until Send is clicked, then saves the image and message in one request', fakeAsync(() => {
    const upload = new Subject<any>();
    chat.sendImage.and.returnValue(upload);
    const f = TestBed.createComponent(ChatWidgetComponent);
    f.detectChanges();
    f.componentInstance.open = true;
    f.detectChanges();
    tick(150);
    const box = f.debugElement.query(By.directive(ChatBoxComponent))
      .componentInstance as ChatBoxComponent;
    const file = new File(['sample'], 'image.jpg', { type: 'image/jpeg' });
    box.handleUploadFile(file);
    expect(chat.sendImage).not.toHaveBeenCalled();
    chat.canSend = true;
    box.handleUploadFile(file);
    expect(box.selectedImage).toBe(file);
    expect(box.selectedImagePreview).toMatch(/^blob:/);
    expect(chat.sendImage).not.toHaveBeenCalled();
    f.detectChanges();
    const send = f.nativeElement.querySelector(
      '[aria-label="Gửi tin nhắn"]'
    ) as HTMLButtonElement;
    expect(send.disabled).toBeFalse();
    send.click();
    expect(chat.sendImage).toHaveBeenCalledOnceWith(file);
    expect(chat.sendMessage).not.toHaveBeenCalled();
    // A second click while uploading cannot start another upload.
    void box.sendMessage();
    expect(chat.sendImage).toHaveBeenCalledTimes(1);
    upload.next({
      Success: true,
      Data: {
        MessageId: 'image-1',
        Sequence: 1,
        Type: 'image',
        Message: '[Hình ảnh]',
        UserId: 'account:me',
        CreatedDTime: new Date(),
      },
    });
    tick();
    expect(chat.sendMessage).not.toHaveBeenCalled();
    expect(box.messages.length).toBe(1);
    chat.received$.next(box.messages[0]);
    expect(box.messages.length).toBe(1);
    expect(box.selectedImage).toBeNull();
    expect(box.selectedImagePreview).toBe('');
    f.destroy();
    tick(1000);
  }));
  it('does not upload on replacement, removal or closing the panel and releases local previews', fakeAsync(() => {
    chat.canSend = true;
    const revoke = spyOn(URL, 'revokeObjectURL').and.callThrough();
    const f = TestBed.createComponent(ChatWidgetComponent);
    f.detectChanges();
    f.componentInstance.open = true;
    f.detectChanges();
    tick(150);
    const box = f.debugElement.query(By.directive(ChatBoxComponent))
      .componentInstance as ChatBoxComponent;
    const file = new File(['sample'], 'image.png', { type: 'image/png' });
    box.newMessage = 'Draft';
    box.handleUploadFile(file);
    const first = box.selectedImagePreview;
    box.handleUploadFile(file);
    expect(revoke).toHaveBeenCalledWith(first);
    const second = box.selectedImagePreview;
    box.clearImage();
    expect(revoke).toHaveBeenCalledWith(second);
    expect(box.newMessage).toBe('Draft');
    box.handleUploadFile(file);
    const third = box.selectedImagePreview;
    f.componentInstance.open = false;
    f.detectChanges();
    expect(revoke).toHaveBeenCalledWith(third);
    expect(chat.sendImage).not.toHaveBeenCalled();
    expect(chat.sendMessage).not.toHaveBeenCalled();
    f.destroy();
    tick(1000);
  }));
  it('keeps the selected image on failed saving and clears it after a successful retry', fakeAsync(() => {
    chat.canSend = true;
    const f = TestBed.createComponent(ChatWidgetComponent);
    f.detectChanges();
    f.componentInstance.open = true;
    f.detectChanges();
    tick(150);
    const box = f.debugElement.query(By.directive(ChatBoxComponent))
      .componentInstance as ChatBoxComponent;
    const file = new File(['sample'], 'image.png', { type: 'image/png' });
    box.handleUploadFile(file);
    chat.sendImage.and.returnValue(
      throwError(() => new Error('Saving failed'))
    );
    void box.sendMessage();
    tick();
    expect(box.selectedImage).toBe(file);
    expect(box.sendError).toContain('Không gửi được ảnh');
    expect(chat.sendMessage).not.toHaveBeenCalled();
    chat.sendImage.and.returnValue(
      of({
        Success: true,
        Data: {
          MessageId: 'image-1',
          Sequence: 1,
          Type: 'image',
          Message: '[Hình ảnh]',
          UserId: 'account:me',
          CreatedDTime: new Date(),
        },
      })
    );
    void box.sendMessage();
    tick();
    expect(chat.sendImage).toHaveBeenCalledTimes(2);
    expect(chat.sendMessage).not.toHaveBeenCalled();
    expect(box.selectedImage).toBeNull();
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
    expect(chat.sendImage).not.toHaveBeenCalled();
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
  it('groups local calendar days across history, realtime and deletion, including old years', fakeAsync(() => {
    const today = new Date();
    today.setHours(0, 5, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    yesterday.setHours(23, 55);
    const recent = new Date(today);
    recent.setDate(today.getDate() - 3);
    const old = new Date(today.getFullYear() - 1, 0, 1, 12);
    const message = (id: string, date: Date, sequence: number): IChat => ({
      MessageId: id,
      Sequence: sequence,
      UserId: 'other',
      Message: id,
      Type: 'string',
      // Match JSON timestamps from the API, rather than only Date instances.
      CreatedDTime: date.toISOString() as unknown as Date,
    });
    TestBed.inject(TranslateService).currentLang = 'vi';
    chat.getMessage = () =>
      of({
        objResult: {
          DataList: [
            message('y1', yesterday, 3),
            message('y2', yesterday, 4),
            message('t1', today, 5),
          ],
          ItemCount: 5,
        },
      });
    const f = TestBed.createComponent(ChatWidgetComponent);
    f.detectChanges();
    f.componentInstance.open = true;
    f.detectChanges();
    tick(150);
    f.detectChanges();
    const labels = () =>
      Array.from(
        f.nativeElement.querySelectorAll('.message-day-separator')
      ).map((el: any) => el.textContent.trim());
    expect(labels()).toEqual(['Hôm qua', 'Hôm nay']);
    expect(
      f.nativeElement.querySelector('.message-time').textContent.trim()
    ).toBe('23:55');
    expect(
      f.nativeElement.querySelector('.message-time').getAttribute('aria-label')
    ).toContain(yesterday.getFullYear().toString());
    const box = f.debugElement.query(By.directive(ChatBoxComponent))
      .componentInstance as ChatBoxComponent;
    // Prepending older history must not duplicate a day's existing divider.
    box.messages = [
      message('old', old, 1),
      message('recent', recent, 2),
      ...box.messages,
    ];
    chat.received$.next(message('t2', today, 6));
    tick(60);
    f.detectChanges();
    expect(labels().length).toBe(4);
    expect(labels()[0]).toContain(old.getFullYear().toString());
    expect(labels()[1]).toContain(recent.getDate().toString().padStart(2, '0'));
    chat.deleted$.next({ MessageId: 'y1', Sequence: 3 });
    f.detectChanges();
    expect(labels().slice(-2)).toEqual(['Hôm qua', 'Hôm nay']);
    chat.deleted$.next({ MessageId: 'y2', Sequence: 4 });
    f.detectChanges();
    expect(labels().length).toBe(3);
    expect(labels()).not.toContain('Hôm qua');
    TestBed.inject(TranslateService).currentLang = 'en';
    f.detectChanges();
    expect(labels().at(-1)).toBe('Today');
    f.destroy();
    tick(1000);
  }));
  it('renders clickable image links as text and restricts delete controls to permitted users', fakeAsync(() => {
    const message: IChat = {
      MessageId: 'link',
      Sequence: 1,
      UserId: 'other',
      Message: 'https://example.com/a.png',
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
    const link = f.nativeElement.querySelector(
      '.message-link-card'
    ) as HTMLAnchorElement;
    expect(link.href).toBe(message.Message);
    expect(link.target).toBe('_blank');
    expect(link.rel).toContain('noopener');
    expect(f.nativeElement.querySelector('.message-image')).toBeNull();
    expect(f.nativeElement.querySelector('.message-delete')).toBeNull();
    const box = f.debugElement.query(By.directive(ChatBoxComponent))
      .componentInstance as ChatBoxComponent;
    void box.deleteMessage(message);
    tick();
    expect(chat.deleteMessage).not.toHaveBeenCalled();
    chat.canDelete = true;
    f.detectChanges();
    const deleteButton = f.nativeElement.querySelector(
      '.message-delete'
    ) as HTMLButtonElement;
    expect(deleteButton).not.toBeNull();
    expect(
      Number(
        getComputedStyle(f.nativeElement.querySelector('.chat-box-container'))
          .zIndex
      )
    ).toBeLessThan(1000);
    deleteButton.click();
    f.detectChanges();
    tick(150);
    const cancel = document.querySelector(
      '.ant-popover-buttons button'
    ) as HTMLButtonElement;
    expect(cancel).not.toBeNull();
    cancel.click();
    f.detectChanges();
    tick(150);
    expect(chat.deleteMessage).not.toHaveBeenCalled();
    deleteButton.click();
    f.detectChanges();
    tick(150);
    const confirm = document.querySelector(
      '.ant-popover-buttons .ant-btn-primary'
    ) as HTMLButtonElement;
    expect(confirm).not.toBeNull();
    expect(chat.deleteMessage).not.toHaveBeenCalled();
    confirm.click();
    tick(150);
    expect(chat.deleteMessage).toHaveBeenCalledOnceWith('link');
    chat.isMessageDeleted = (id: string) => id === 'link';
    box.messages[0] = { ...message, Type: 'jpg' };
    box.previewImage = message.Message;
    box.previewVisible = true;
    chat.deleted$.next({ MessageId: 'link', Sequence: 1 });
    expect(box.previewVisible).toBeFalse();
    expect(box.previewImage).toBe('');
    f.detectChanges();
    expect(f.nativeElement.querySelector('.message-wrapper')).toBeNull();
    chat.received$.next(message);
    chat.reconnected$.next();
    tick(150);
    f.detectChanges();
    expect(f.nativeElement.querySelector('.message-wrapper')).toBeNull();
    f.destroy();
    tick(1000);
  }));
  it('loads database images only after clicking and releases the blob on closing or deletion', fakeAsync(() => {
    const image = new Subject<Blob>();
    chat.getImage.and.returnValue(image);
    const revoke = spyOn(URL, 'revokeObjectURL').and.callThrough();
    const f = TestBed.createComponent(ChatWidgetComponent);
    f.detectChanges();
    f.componentInstance.open = true;
    f.detectChanges();
    tick(150);
    const box = f.debugElement.query(By.directive(ChatBoxComponent))
      .componentInstance as ChatBoxComponent;
    const message = {
      MessageId: 'blob-1',
      Sequence: 1,
      UserId: 'other',
      Type: 'image',
      Message: '[Hình ảnh]',
      CreatedDTime: new Date(),
    } as IChat;
    box.messages = [message];
    f.detectChanges();
    expect(
      f.nativeElement.querySelector('.message-image-button').textContent
    ).toContain('[Hình ảnh]');
    expect(f.nativeElement.querySelector('.message-bubble img')).toBeNull();
    expect(chat.getImage).not.toHaveBeenCalled();
    f.nativeElement.querySelector('.message-image-button').click();
    expect(chat.getImage).toHaveBeenCalledOnceWith('blob-1');
    expect(box.previewLoading).toBeTrue();
    image.next(new Blob(['image'], { type: 'image/png' }));
    tick();
    expect(box.previewImage).toMatch(/^blob:/);
    const url = box.previewImage!;
    chat.deleted$.next({ MessageId: 'blob-1', Sequence: 1 });
    expect(box.previewVisible).toBeFalse();
    expect(revoke).toHaveBeenCalledWith(url);
    void box.openImage(message);
    expect(image.observers.length).toBe(1);
    box.closePreview();
    tick();
    expect(image.observers.length).toBe(0);
    expect(box.previewImage).toBe('');
    expect(box.previewError).toBe('');
    f.destroy();
    tick(1000);
  }));
  it('accepts pasted screenshots locally, and enforces image permission before sending', fakeAsync(() => {
    chat.canSend = true;
    const f = TestBed.createComponent(ChatWidgetComponent);
    f.detectChanges();
    f.componentInstance.open = true;
    f.detectChanges();
    tick(150);
    const box = f.debugElement.query(By.directive(ChatBoxComponent))
      .componentInstance as ChatBoxComponent;
    const clipboard = new DataTransfer();
    const screenshot = new File(['image'], 'screenshot.png', {
      type: 'image/png',
    });
    clipboard.items.add(screenshot);
    const event = new ClipboardEvent('paste', {
      clipboardData: clipboard,
      bubbles: true,
      cancelable: true,
    });
    f.nativeElement.querySelector('.message-input').dispatchEvent(event);
    expect(event.defaultPrevented).toBeTrue();
    expect(box.selectedImage).toBe(screenshot);
    expect(chat.sendImage).not.toHaveBeenCalled();
    box.clearImage();
    imagePermission = false;
    box.onPaste(event);
    expect(box.selectedImage).toBeNull();
    expect(box.sendError).toContain('không có quyền gửi ảnh');
    f.destroy();
    tick(1000);
  }));
  it('sends pasted image URLs without uploading or requiring image permission', fakeAsync(() => {
    chat.canSend = true;
    imagePermission = false;
    const f = TestBed.createComponent(ChatWidgetComponent);
    f.detectChanges();
    f.componentInstance.open = true;
    f.detectChanges();
    tick(150);
    const box = f.debugElement.query(By.directive(ChatBoxComponent))
      .componentInstance as ChatBoxComponent;
    box.newMessage = 'https://example.com/a.jpg';
    void box.sendMessage();
    tick();
    expect(chat.sendMessage).toHaveBeenCalledOnceWith(
      'account:me',
      'https://example.com/a.jpg',
      'string'
    );
    expect(chat.sendImage).not.toHaveBeenCalled();
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
