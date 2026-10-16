import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { NZ_ICONS } from 'ng-zorro-antd/icon';
import {
  LikeOutline,
  MessageOutline,
  FlagOutline,
  DeleteOutline,
  EyeInvisibleOutline,
  UpOutline,
  DownOutline,
} from '@ant-design/icons-angular/icons';
import { NzMessageService } from 'ng-zorro-antd/message';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { NewsCommentsComponent } from './news-comments.component';
import { NewsCommentItemComponent } from './news-comment-item.component';
import { ApiService } from '../../../../services/api.service';
import { AuthService } from '../../../../services/auth.service';
import { ShowErrorService } from '../../../../services/show-error.service';
import {
  INewsCommentDto,
  INewsCommentCreateResponse,
  INewsCommentsResponse,
} from '../../../../interfaces/news-comment';

describe('Notification comment destination', () => {
  let api: jasmine.SpyObj<ApiService>;
  let query: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let context: Subject<INewsCommentCreateResponse>;
  const comment = (
    id: string,
    parent: string | null = null
  ): INewsCommentDto => ({
    CommentId: id,
    NewsId: 'post',
    UserId: 'reader',
    UserFullName: 'Reader',
    UserAvatar: '',
    ParentCommentId: parent,
    Content: 'Content ' + id,
    LikeCount: 0,
    ReplyCount: 0,
    IsLikedByMe: false,
    IsOwnedByMe: false,
    IsHidden: false,
    CreatedDTime: new Date().toISOString(),
    Replies: [],
  });
  beforeEach(() => {
    query = new BehaviorSubject(
      convertToParamMap({ commentId: 'off-page-reply' })
    );
    context = new Subject();
    api = jasmine.createSpyObj<ApiService>('ApiService', [
      'NewsComments',
      'NewsCommentContext',
      'NewsAddComment',
      'NewsCommentReplies',
    ]);
    api.NewsComments.and.returnValue(
      of({
        Success: true,
        Data: { ReplyCount: 25 },
        objResult: {
          DataList: [comment('first-root')],
          ItemCount: 10,
          PageIndex: 0,
          PageSize: 5,
        },
      } as INewsCommentsResponse)
    );
    api.NewsCommentContext.and.returnValue(context);
    TestBed.configureTestingModule({
      imports: [
        NewsCommentsComponent,
        TranslateModule.forRoot(),
        NoopAnimationsModule,
      ],
      providers: [
        { provide: ActivatedRoute, useValue: { queryParamMap: query } },
        { provide: ApiService, useValue: api },
        {
          provide: AuthService,
          useValue: {
            isLoggedIn: () => true,
            getAccountInfo: () => ({ name: 'Me' }),
          },
        },
        { provide: ShowErrorService, useValue: {} },
        {
          provide: NzMessageService,
          useValue: { info: jasmine.createSpy(), success: jasmine.createSpy() },
        },
        {
          provide: NZ_ICONS,
          useValue: [
            LikeOutline,
            MessageOutline,
            FlagOutline,
            DeleteOutline,
            EyeInvisibleOutline,
            UpOutline,
            DownOutline,
          ],
        },
      ],
    });
    TestBed.overrideComponent(NewsCommentsComponent, {
      set: {
        imports: [NewsCommentItemComponent],
        template: `@for (root of comments; track root.CommentId) {
        <app-news-comment-item [comment]="root" [highlighted]="highlightedCommentId === root.CommentId" />
        @if (expandedReplies.has(root.CommentId)) {
          @for (reply of root.Replies; track reply.CommentId) {
            <app-news-comment-item [comment]="reply" [isReply]="true" [highlighted]="highlightedCommentId === reply.CommentId" />
          }
        }
      }`,
      },
    });
  });

  it('loads the selected reply directly, expands its off-page thread, highlights and focuses it', () => {
    const fixture = TestBed.createComponent(NewsCommentsComponent);
    fixture.componentRef.setInput('newsId', 'post');
    fixture.detectChanges();
    expect(api.NewsCommentContext).toHaveBeenCalledWith(
      'post',
      'off-page-reply'
    );
    const root = {
      ...comment('off-page-root'),
      Replies: [comment('off-page-reply', 'off-page-root')],
      ReplyCount: 20,
    };
    context.next({ Success: true, Data: root } as INewsCommentCreateResponse);
    fixture.detectChanges();
    const target = fixture.nativeElement.querySelector(
      '#news-comment-off-page-reply'
    ) as HTMLElement;
    expect(target).not.toBeNull();
    expect(target.classList.contains('cmt--highlighted')).toBeTrue();
    expect(document.activeElement).toBe(target);
    expect(fixture.componentInstance.comments.length).toBe(2);
    context.next({ Success: true, Data: root } as INewsCommentCreateResponse);
    expect(fixture.componentInstance.comments.length).toBe(2);
    fixture.destroy();
  });

  it('does not insert an old destination response after a query change or article navigation', () => {
    const fixture = TestBed.createComponent(NewsCommentsComponent);
    fixture.componentRef.setInput('newsId', 'post');
    fixture.detectChanges();
    const next = new Subject<INewsCommentCreateResponse>();
    api.NewsCommentContext.and.returnValue(next);
    query.next(convertToParamMap({ commentId: 'new-destination' }));
    context.next({
      Success: true,
      Data: comment('stale-root'),
    } as INewsCommentCreateResponse);
    expect(
      fixture.componentInstance.comments.some(c => c.CommentId === 'stale-root')
    ).toBeFalse();
    fixture.componentRef.setInput('newsId', 'new-post');
    fixture.detectChanges();
    fixture.destroy();
    next.next({
      Success: true,
      Data: comment('after-destroy'),
    } as INewsCommentCreateResponse);
    expect(
      fixture.componentInstance.comments.some(
        c => c.CommentId === 'after-destroy'
      )
    ).toBeFalse();
  });

  it('sends the actual reply recipient while keeping the two-level comment structure', () => {
    const fixture = TestBed.createComponent(NewsCommentsComponent);
    fixture.componentRef.setInput('newsId', 'post');
    fixture.detectChanges();
    const root = comment('root');
    const reply = comment('reply', 'root');
    fixture.componentInstance.comments = [root];
    fixture.componentInstance.startReply(reply);
    api.NewsAddComment.and.returnValue(
      new Subject<INewsCommentCreateResponse>()
    );
    fixture.componentInstance.submitComment('Hello reader');
    expect(api.NewsAddComment).toHaveBeenCalledWith({
      NewsId: 'post',
      ParentCommentId: 'root',
      ReplyToCommentId: 'reply',
      Content: 'Hello reader',
    });
    fixture.destroy();
  });
});
