import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NZ_ICONS } from 'ng-zorro-antd/icon';
import {
  PlusOutline,
  EyeOutline,
  HeartOutline,
  MessageOutline,
  PlayCircleOutline,
  PictureOutline,
} from '@ant-design/icons-angular/icons';
import { Subject } from 'rxjs';
import { ApiService } from '../../../services/api.service';
import { MyReelsComponent } from './my-reels.component';

describe('My reels', () => {
  let api: any;
  let page: Subject<any>;
  const reel = (id: string) => ({
    ReelId: id,
    Caption: 'My moment',
    MediaType: 'Image',
    CoverUrl: '',
    Media: [{ MediaUrl: 'https://example.com/photo.jpg' }],
    ViewCount: 10,
    LikeCount: 2,
    CommentCount: 1,
    CreatedDTime: '2026-10-09T01:00:00Z',
  });
  beforeEach(() => {
    page = new Subject();
    api = { MyReels: jasmine.createSpy().and.returnValue(page) };
    TestBed.configureTestingModule({
      imports: [MyReelsComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        { provide: ApiService, useValue: api },
        {
          provide: NZ_ICONS,
          useValue: [
            PlusOutline,
            EyeOutline,
            HeartOutline,
            MessageOutline,
            PlayCircleOutline,
            PictureOutline,
          ],
        },
      ],
    });
  });

  it('uses the private paged endpoint, renders a reel link and deduplicates later pages', () => {
    const f = TestBed.createComponent(MyReelsComponent);
    f.detectChanges();
    expect(api.MyReels).toHaveBeenCalledOnceWith(12, null);
    f.componentInstance.loadMore();
    expect(api.MyReels).toHaveBeenCalledTimes(1);
    page.next({
      Success: true,
      objResult: {
        DataList: [reel('mine')],
        NextCursor: 'next',
        HasMore: true,
      },
    });
    page.complete();
    f.detectChanges();
    const link = f.nativeElement.querySelector(
      '.reel-card'
    ) as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/reels?reelId=mine');
    expect(f.nativeElement.querySelector('.reel-cover img').src).toBe(
      'https://example.com/photo.jpg'
    );
    expect(f.nativeElement.querySelector('video')).toBeNull();
    page = new Subject();
    api.MyReels.and.returnValue(page);
    f.nativeElement.querySelector('.reels-more').click();
    expect(api.MyReels.calls.mostRecent().args).toEqual([12, 'next']);
    page.next({
      Success: true,
      objResult: {
        DataList: [reel('mine'), reel('older')],
        NextCursor: null,
        HasMore: false,
      },
    });
    page.complete();
    f.detectChanges();
    expect(f.nativeElement.querySelectorAll('.reel-card').length).toBe(2);
    expect(f.nativeElement.querySelector('.reels-more')).toBeNull();
    f.destroy();
  });

  it('distinguishes failed loads from an empty account and retries without a stale cursor', () => {
    const f = TestBed.createComponent(MyReelsComponent);
    f.detectChanges();
    page.error(new Error('Offline'));
    f.detectChanges();
    expect(f.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
    expect(f.nativeElement.querySelector('.my-posts__empty')).toBeNull();
    page = new Subject();
    api.MyReels.and.returnValue(page);
    f.nativeElement.querySelector('.reels-more').click();
    expect(api.MyReels.calls.mostRecent().args).toEqual([12, null]);
    page.next({
      Success: true,
      objResult: { DataList: [], NextCursor: null, HasMore: false },
    });
    page.complete();
    f.detectChanges();
    expect(f.nativeElement.querySelector('.my-posts__empty')).not.toBeNull();
    expect(f.nativeElement.querySelector('[role="alert"]')).toBeNull();
    f.destroy();
  });
});
