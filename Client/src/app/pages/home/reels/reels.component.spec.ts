import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { of, Subject } from 'rxjs';
import { ApiService, AuthService, ShowErrorService } from '../../../services';
import { ReelsComponent } from './reels.component';

describe('Opening a profile reel', () => {
  let api: any;
  const selected = { ReelId: 'selected' };
  beforeEach(() => {
    api = {
      ReelDetail: jasmine
        .createSpy()
        .and.returnValue(of({ Success: true, Data: selected })),
      ReelFeed: jasmine.createSpy().and.returnValue(
        of({
          Success: true,
          objResult: {
            DataList: [{ ReelId: 'newest' }, selected],
            NextCursor: null,
            HasMore: false,
          },
        })
      ),
    };
    TestBed.configureTestingModule({
      imports: [ReelsComponent, TranslateModule.forRoot()],
      providers: [
        { provide: ApiService, useValue: api },
        { provide: AuthService, useValue: { isLoggedIn: () => false } },
        { provide: ShowErrorService, useValue: { setShowError: () => {} } },
        { provide: NzMessageService, useValue: { info: jasmine.createSpy() } },
        { provide: Router, useValue: { navigate: () => {} } },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap({ reelId: 'selected' }),
            },
          },
        },
      ],
    });
    TestBed.overrideComponent(ReelsComponent, { set: { template: '' } });
  });

  it('plays the selected reel first even when it also appears later in the public feed', () => {
    const f = TestBed.createComponent(ReelsComponent);
    f.componentInstance.ngOnInit();
    expect(api.ReelDetail).toHaveBeenCalledOnceWith('selected');
    expect(f.componentInstance.lstReels.map(r => r.ReelId)).toEqual([
      'selected',
      'newest',
    ]);
    expect(f.componentInstance.activeIndex).toBe(0);
    expect(f.componentInstance.hasMore).toBeFalse();
    f.componentInstance.ngOnDestroy();
    f.destroy();
  });

  it('falls back to the public feed when the selected reel was deleted', () => {
    api.ReelDetail.and.returnValue(of({ Success: false }));
    const f = TestBed.createComponent(ReelsComponent);
    f.componentInstance.ngOnInit();
    expect(TestBed.inject(NzMessageService).info).toHaveBeenCalled();
    expect(api.ReelFeed).toHaveBeenCalledOnceWith(5, null);
    expect(f.componentInstance.lstReels.length).toBe(2);
    f.componentInstance.ngOnDestroy();
    f.destroy();
  });

  it('keeps the next reel playable and closes comments after deleting the current reel', () => {
    spyOn(ReelsComponent.prototype, 'ngAfterViewInit').and.stub();
    const f = TestBed.createComponent(ReelsComponent);
    f.detectChanges();
    const page = f.componentInstance;
    page.commentsReel = page.lstReels[0];
    page.onReelDeleted('selected');
    expect(page.lstReels.map(reel => reel.ReelId)).toEqual(['newest']);
    expect(page.activeIndex).toBe(0);
    expect(page.commentsReel).toBeNull();
    page.onReelDeleted('newest');
    expect(page.lstReels).toEqual([]);
    expect(page.activeIndex).toBe(0);
    f.destroy();
  });

  it('skips a stale page containing a just-deleted reel and continues loading the feed', () => {
    spyOn(ReelsComponent.prototype, 'ngAfterViewInit').and.stub();
    const pendingPage = new Subject();
    api.ReelFeed.and.returnValue(pendingPage);
    const f = TestBed.createComponent(ReelsComponent);
    f.detectChanges();
    f.componentInstance.onReelDeleted('selected');
    api.ReelFeed.and.returnValue(
      of({
        Success: true,
        objResult: {
          DataList: [{ ReelId: 'fresh' }],
          NextCursor: null,
          HasMore: false,
        },
      })
    );
    pendingPage.next({
      Success: true,
      objResult: { DataList: [selected], NextCursor: 'next', HasMore: true },
    });
    expect(api.ReelFeed.calls.mostRecent().args).toEqual([5, 'next']);
    expect(f.componentInstance.lstReels.map(reel => reel.ReelId)).toEqual([
      'fresh',
    ]);
    f.destroy();
  });
});
