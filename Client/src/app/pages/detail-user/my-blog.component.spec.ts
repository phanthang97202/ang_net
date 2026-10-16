import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
  Router,
} from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NZ_ICONS } from 'ng-zorro-antd/icon';
import {
  EyeOutline,
  HeartOutline,
  HistoryOutline,
  LikeOutline,
  LoadingOutline,
  MessageOutline,
  StarOutline,
  UserOutline,
  SafetyOutline,
  ReadOutline,
  PlayCircleOutline,
} from '@ant-design/icons-angular/icons';
import { NzMessageService } from 'ng-zorro-antd/message';
import { of, Subject } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { AuthService, LangService, ShowErrorService } from '../../services';
import { MyActivityComponent } from './my-activity/my-activity.component';
import { MyFavoritesComponent } from './my-favorites/my-favorites.component';
import { MyPostsComponent } from './my-posts/my-posts.component';
import { DetailUserComponent } from './detail-user.component';
import {
  IMyActivityResponse,
  IMyFavoritesResponse,
  IBlogActivity,
} from '../../interfaces/my-blog';
import { IDetailNews } from '../../interfaces';

class FeedObserver {
  static instances: FeedObserver[] = [];
  targets = new Set<Element>();
  constructor(private callback: IntersectionObserverCallback) {
    FeedObserver.instances.push(this);
  }
  observe(target: Element): void {
    this.targets.add(target);
  }
  unobserve(target: Element): void {
    this.targets.delete(target);
  }
  disconnect(): void {
    this.targets.clear();
  }
  intersect(): void {
    const target = [...this.targets][0];
    this.callback(
      [{ isIntersecting: true, target } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver
    );
  }
}

describe('Personal blog feeds', () => {
  const originalObserver = window.IntersectionObserver;
  let api: jasmine.SpyObj<ApiService>;
  let activityPage: Subject<IMyActivityResponse>;
  let favoritePage: Subject<IMyFavoritesResponse>;
  const post = (id: string) =>
    ({
      NewsId: id,
      CategoryNewsId: 'category',
      ShortTitle: `Post ${id}`,
      ShortDescription: 'Summary',
      FullName: 'Author',
      CreatedDTime: '2026-10-16T07:00:00Z',
      EstimatedReadingTime: 1,
      HasEnglishTranslation: false,
      ViewCount: 1,
    }) as IDetailNews;
  const activity = (id: string, kind: IBlogActivity['Kind'] = 'PostLiked') => ({
    ActivityId: id,
    Kind: kind,
    OccurredAt: '2026-10-16T07:00:00Z',
    NewsId: 'post',
    CategoryNewsId: 'category',
    Title: 'A post',
    TitleEn: 'English title',
    HasEnglishTranslation: true,
    CommentId: kind === 'Commented' ? 'comment' : null,
    CommentContent: kind === 'Commented' ? '<script>text only</script>' : null,
    Point: kind === 'Rated' ? 8 : null,
  });
  const activeSentinel = () =>
    FeedObserver.instances.find(observer =>
      [...observer.targets].some(
        target =>
          target.getAttribute('aria-hidden') === 'true' &&
          target.tagName === 'DIV'
      )
    )!;

  beforeEach(() => {
    FeedObserver.instances = [];
    window.IntersectionObserver =
      FeedObserver as unknown as typeof IntersectionObserver;
    activityPage = new Subject();
    favoritePage = new Subject();
    api = jasmine.createSpyObj<ApiService>('ApiService', [
      'MyActivity',
      'MyFavorites',
      'SearchNews',
    ]);
    api.MyActivity.and.returnValue(activityPage);
    api.MyFavorites.and.returnValue(favoritePage);
    TestBed.configureTestingModule({
      imports: [
        MyActivityComponent,
        MyFavoritesComponent,
        MyPostsComponent,
        DetailUserComponent,
        TranslateModule.forRoot(),
      ],
      providers: [
        provideRouter([]),
        { provide: ApiService, useValue: api },
        { provide: LangService, useValue: { getLang: () => 'vi' } },
        {
          provide: AuthService,
          useValue: {
            getAccountInfo: () => ({ nameid: 'me' }),
            hasPermission: () => false,
            getUserDetail: () => new Subject(),
          },
        },
        {
          provide: ShowErrorService,
          useValue: { setShowError: jasmine.createSpy() },
        },
        { provide: NzMessageService, useValue: { info: jasmine.createSpy() } },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap({ visibility: 'Favorites' }),
              queryParams: { tab: 'posts', visibility: 'Favorites' },
            },
            queryParams: of({ tab: 'activity' }),
          },
        },
        {
          provide: NZ_ICONS,
          useValue: [
            EyeOutline,
            HeartOutline,
            HistoryOutline,
            LikeOutline,
            LoadingOutline,
            MessageOutline,
            StarOutline,
            UserOutline,
            SafetyOutline,
            ReadOutline,
            PlayCircleOutline,
          ],
        },
      ],
    });
  });
  afterEach(() => {
    window.IntersectionObserver = originalObserver;
  });

  it('loads a mixed activity list automatically and stops after the final cursor', () => {
    const fixture = TestBed.createComponent(MyActivityComponent);
    fixture.detectChanges();
    expect(api.MyActivity).toHaveBeenCalledOnceWith(20, null);
    fixture.componentInstance.loadMore();
    expect(api.MyActivity).toHaveBeenCalledTimes(1);
    activityPage.next({
      Success: true,
      objResult: {
        DataList: [
          activity('3'),
          activity('2', 'Commented'),
          activity('1', 'Rated'),
        ],
        NextCursor: 'next',
        HasMore: true,
      },
    } as IMyActivityResponse);
    activityPage.complete();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="tablist"]')).toBeNull();
    expect(
      fixture.nativeElement.querySelectorAll('.activity-list__item').length
    ).toBe(3);
    expect(fixture.nativeElement.querySelector('blockquote script')).toBeNull();
    expect(
      fixture.nativeElement.querySelector('blockquote').textContent
    ).toContain('<script>');
    expect(fixture.nativeElement.querySelector('a').getAttribute('href')).toBe(
      '/news/category/post'
    );
    expect(
      fixture.nativeElement.querySelector('time').getAttribute('datetime')
    ).toBe('2026-10-16T07:00:00Z');
    activityPage = new Subject();
    api.MyActivity.and.returnValue(activityPage);
    activeSentinel().intersect();
    fixture.detectChanges();
    expect(api.MyActivity.calls.mostRecent().args).toEqual([20, 'next']);
    activityPage.next({
      Success: true,
      objResult: {
        DataList: [activity('1', 'Rated'), activity('0', 'PostUnliked')],
        NextCursor: null,
        HasMore: false,
      },
    } as IMyActivityResponse);
    activityPage.complete();
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelectorAll('.activity-list__item').length
    ).toBe(4);
    expect(activeSentinel()).toBeUndefined();
    fixture.componentInstance.loadMore();
    expect(api.MyActivity).toHaveBeenCalledTimes(2);
    fixture.destroy();
  });

  it('preserves earlier items on errors, retries the same cursor, and cancels on leaving', () => {
    const fixture = TestBed.createComponent(MyActivityComponent);
    fixture.detectChanges();
    activityPage.next({
      Success: true,
      objResult: {
        DataList: [activity('1')],
        NextCursor: 'older',
        HasMore: true,
      },
    } as IMyActivityResponse);
    activityPage.complete();
    fixture.detectChanges();
    activityPage = new Subject();
    api.MyActivity.and.returnValue(activityPage);
    activeSentinel().intersect();
    activityPage.error(new Error('Offline'));
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('[role="alert"]')
    ).not.toBeNull();
    expect(
      fixture.nativeElement.querySelectorAll('.activity-list__item').length
    ).toBe(1);
    expect(activeSentinel()).toBeUndefined();
    activityPage = new Subject();
    api.MyActivity.and.returnValue(activityPage);
    fixture.nativeElement.querySelector('[role="alert"] button').click();
    expect(api.MyActivity.calls.mostRecent().args).toEqual([20, 'older']);
    expect(activityPage.observed).toBeTrue();
    fixture.destroy();
    expect(activityPage.observed).toBeFalse();
    expect(
      FeedObserver.instances.every(observer => observer.targets.size === 0)
    ).toBeTrue();
  });

  it('renders favorite post cards, uses the cursor, and deduplicates appended pages', fakeAsync(() => {
    const fixture = TestBed.createComponent(MyFavoritesComponent);
    fixture.detectChanges();
    const count = jasmine.createSpy();
    fixture.componentInstance.countChanged.subscribe(count);
    favoritePage.next({
      Success: true,
      objResult: {
        DataList: [post('one')],
        ItemCount: 2,
        NextCursor: 'older',
        HasMore: true,
      },
    } as IMyFavoritesResponse);
    favoritePage.complete();
    fixture.detectChanges();
    tick();
    expect(count).toHaveBeenCalledWith(2);
    expect(
      fixture.nativeElement
        .querySelector('.post-card__title')
        .getAttribute('href')
    ).toBe('/news/category/one');
    favoritePage = new Subject();
    api.MyFavorites.and.returnValue(favoritePage);
    activeSentinel().intersect();
    expect(api.MyFavorites.calls.mostRecent().args).toEqual([12, 'older']);
    favoritePage.next({
      Success: true,
      objResult: {
        DataList: [post('one'), post('two')],
        ItemCount: 2,
        NextCursor: null,
        HasMore: false,
      },
    } as IMyFavoritesResponse);
    favoritePage.complete();
    fixture.detectChanges();
    tick();
    expect(fixture.nativeElement.querySelectorAll('app-news-card').length).toBe(
      2
    );
    fixture.destroy();
  }));

  it('opens the Favorites bookmark as a third posts tab without querying authored posts', () => {
    const fixture = TestBed.createComponent(MyPostsComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('[role="tab"]').length).toBe(
      3
    );
    expect(fixture.componentInstance.activeTab).toBe('Favorites');
    expect(api.SearchNews).not.toHaveBeenCalled();
    expect(api.MyFavorites).toHaveBeenCalledOnceWith(12, null);
    fixture.destroy();
  });

  it('adds My activity to the sidebar and navigates through the profile query parameter', () => {
    const fixture = TestBed.createComponent(DetailUserComponent);
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(
      true
    );
    const entry = fixture.componentInstance.profileNav
      .flatMap(section => section.items)
      .find(item => item.id === 'activity')!;
    expect(entry.labelKey).toBe('T_MYACTIVITY');
    fixture.componentInstance.selectTab(entry);
    expect(navigate).toHaveBeenCalledWith(
      [],
      jasmine.objectContaining({
        queryParams: { tab: 'activity', collection: null },
        queryParamsHandling: 'merge',
      })
    );
    fixture.destroy();
  });
});
