import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { BrowserTitleService } from './browser-title.service';

describe('Browser chat title', () => {
  let title: Title;
  let service: BrowserTitleService;
  let originalTitle: string;

  beforeEach(() => {
    originalTitle = document.title;
    TestBed.configureTestingModule({
      providers: [{ provide: Title, useExisting: BrowserTitleService }],
    });
    title = TestBed.inject(Title);
    service = TestBed.inject(BrowserTitleService);
    title.setTitle('Báo cáo ca trực');
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    document.title = originalTitle;
  });

  it('alternates every 3 seconds even while the tab is hidden', fakeAsync(() => {
    spyOnProperty(document, 'visibilityState', 'get').and.returnValue('hidden');
    service.setUnreadCount(2);
    tick(2999);
    expect(title.getTitle()).toBe('Báo cáo ca trực');
    tick(1);
    expect(title.getTitle()).toBe('(2 tin nhắn mới)');
    service.setUnreadCount(5);
    expect(title.getTitle()).toBe('(5 tin nhắn mới)');
    tick(3000);
    expect(title.getTitle()).toBe('Báo cáo ca trực');
    tick(3000);
    expect(title.getTitle()).toBe('(5 tin nhắn mới)');
    service.setUnreadCount(0);
  }));

  it('restores the latest route or article title instead of an old page title', fakeAsync(() => {
    service.setUnreadCount(1);
    tick(3000);
    title.setTitle('Bài viết đang đọc');
    expect(title.getTitle()).toBe('(1 tin nhắn mới)');
    tick(3000);
    expect(title.getTitle()).toBe('Bài viết đang đọc');
    title.setTitle('Current article');
    tick(3000);
    expect(title.getTitle()).toBe('(1 tin nhắn mới)');
    service.setUnreadCount(0);
    expect(title.getTitle()).toBe('Current article');
  }));

  it('stops on zero unread and starts a fresh cycle for the next message', fakeAsync(() => {
    service.setUnreadCount(1);
    tick(3000);
    service.setUnreadCount(0);
    expect(title.getTitle()).toBe('Báo cáo ca trực');
    tick(6000);
    expect(title.getTitle()).toBe('Báo cáo ca trực');
    service.setUnreadCount(3);
    tick(3000);
    expect(title.getTitle()).toBe('(3 tin nhắn mới)');
    TestBed.resetTestingModule();
    expect(document.title).toBe('Báo cáo ca trực');
    tick(6000);
    expect(document.title).toBe('Báo cáo ca trực');
  }));
});
