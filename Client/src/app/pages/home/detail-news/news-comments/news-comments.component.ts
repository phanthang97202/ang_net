import {
  Component,
  ChangeDetectorRef,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import {
  ApiService,
  AuthService,
  ShowErrorService,
} from '../../../../services';
import {
  ENewsCommentSort,
  INewsCommentDto,
  INewsCommentReportRequest,
} from '../../../../interfaces';
import { GoogleSigninButtonComponent } from '../../../../components/google-signin-button/google-signin-button.component';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { NewsCommentComposerComponent } from './news-comment-composer.component';
import { NewsCommentItemComponent } from './news-comment-item.component';
import { NewsCommentReportModalComponent } from './news-comment-report-modal.component';

@Component({
  selector: 'app-news-comments',
  standalone: true,
  imports: [
    NzIconModule,
    GoogleSigninButtonComponent,
    NewsCommentComposerComponent,
    NewsCommentItemComponent,
    NewsCommentReportModalComponent,
    TranslateModule,
  ],
  templateUrl: './news-comments.component.html',
  styleUrl: './news-comments.component.scss',
})
export class NewsCommentsComponent implements OnInit, OnChanges, OnDestroy {
  private route = inject(ActivatedRoute);
  private cd = inject(ChangeDetectorRef);
  private translate = inject(TranslateService);
  private destroyed = new Subject<void>();
  private reloadCancelled = new Subject<void>();
  private contextRequest = 0;
  private replyToCommentId: string | null = null;
  highlightedCommentId: string | null = null;
  @Input({ required: true }) newsId!: string;

  // Thanh công cụ bên trái bài viết hiện số bình luận. Dùng cặp getter/setter
  // thay vì phát sự kiện ở từng chỗ gán: totalCount được gán ở nhiều nhánh
  // (tải trang, tải thêm, vừa gửi trả lời), đi qua setter thì không sót chỗ nào.
  @Output() totalCountChange = new EventEmitter<number>();

  private api = inject(ApiService);
  private authService = inject(AuthService);
  private showErrorService = inject(ShowErrorService);
  private message = inject(NzMessageService);

  comments: INewsCommentDto[] = [];
  private _totalCount = 0;

  get totalCount(): number {
    return this._totalCount;
  }

  set totalCount(value: number) {
    this._totalCount = value;
    this.totalCountChange.emit(value);
  }
  sort: ENewsCommentSort = 'Popular';
  isLoading = false;
  isSending = false;
  hasMore = false;

  replyTarget: INewsCommentDto | null = null;
  replyPrefill = '';
  replyToken = 0;

  expandedReplies = new Set<string>();
  loadingRepliesFor: string | null = null;

  reportTargetId: string | null = null;
  isReportOpen = false;
  isReporting = false;

  accountName: string | null = null;
  accountInitial = '';
  accountAvatar: string | null = null;

  private pageIndex = 0;
  private readonly pageSize = 5;
  private readonly replyPageSize = 5;
  /** Mốc thời gian chụp ở lần tải đầu, giữ offset ổn định khi có bình luận mới */
  private snapshot: string | null = null;

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  ngOnInit(): void {
    this.readAccount();
    this.reload();
    this.route.queryParamMap
      .pipe(takeUntil(this.destroyed))
      .subscribe(params => {
        this.highlightedCommentId = params.get('commentId');
        this.loadContext();
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['newsId'] && !changes['newsId'].firstChange) this.reload();
  }

  ngOnDestroy(): void {
    this.destroyed.next();
    this.destroyed.complete();
    this.reloadCancelled.next();
    this.reloadCancelled.complete();
    this.contextRequest++;
  }

  private loadContext(): void {
    const request = ++this.contextRequest;
    const targetId = this.highlightedCommentId;
    if (!targetId || !this.newsId) return;
    this.api
      .NewsCommentContext(this.newsId, targetId)
      .pipe(takeUntil(this.reloadCancelled))
      .subscribe({
        next: response => {
          if (request !== this.contextRequest) return;
          const root = response.Data;
          if (!root) {
            this.message.info(
              this.translate.instant('T_NOTIFICATION_UNAVAILABLE')
            );
            return;
          }
          const existing = this.comments.find(
            c => c.CommentId === root.CommentId
          );
          if (existing) {
            const seen = new Set(existing.Replies.map(r => r.CommentId));
            existing.Replies = [
              ...existing.Replies,
              ...root.Replies.filter(r => !seen.has(r.CommentId)),
            ];
          } else this.comments = [root, ...this.comments];
          if (root.CommentId !== targetId)
            this.expandedReplies.add(root.CommentId);
          this.cd.detectChanges();
          const target = document.getElementById(`news-comment-${targetId}`);
          target?.scrollIntoView({
            block: 'center',
            behavior: 'instant',
          });
          target?.focus({ preventScroll: true });
        },
        error: () => {
          if (request === this.contextRequest)
            this.message.info(
              this.translate.instant('T_NOTIFICATION_UNAVAILABLE')
            );
        },
      });
  }

  setSort(sort: ENewsCommentSort): void {
    if (this.sort === sort) {
      return;
    }
    this.sort = sort;
    this.reload();
  }

  reload(): void {
    this.reloadCancelled.next();
    this.contextRequest++;
    this.comments = [];
    this.pageIndex = 0;
    this.hasMore = false;
    this.expandedReplies.clear();
    this.cancelReply();
    // Chụp mốc mới mỗi lần tải lại từ đầu để thấy được bình luận vừa đăng
    this.snapshot = new Date().toISOString();
    this.loadPage();
    this.loadContext();
  }

  loadMore(): void {
    if (this.isLoading || !this.hasMore) {
      return;
    }
    this.pageIndex += 1;
    this.loadPage();
  }

  trackByCommentId(_index: number, item: INewsCommentDto): string {
    return item.CommentId;
  }

  // ── Trả lời ───────────────────────────────────────────────────────────
  startReply(comment: INewsCommentDto): void {
    if (!this.isLoggedIn) {
      this.message.info(this.translate.instant('T_COMMENT_LOGIN_REQUIRED'));
      return;
    }

    // Cây 2 cấp: trả lời một reply vẫn gắn vào bình luận gốc, chỉ chèn @tên
    const isReply = !!comment.ParentCommentId;
    const root = isReply
      ? (this.comments.find(c => c.CommentId === comment.ParentCommentId) ??
        comment)
      : comment;

    this.replyTarget = root;
    this.replyToCommentId = comment.CommentId;
    this.replyPrefill = isReply ? `@${comment.UserFullName} ` : '';
    this.replyToken += 1;

    if (root.CommentId) {
      this.expandedReplies.add(root.CommentId);
    }
  }

  cancelReply(): void {
    this.replyTarget = null;
    this.replyToCommentId = null;
    this.replyPrefill = '';
  }

  submitComment(content: string): void {
    if (!this.isLoggedIn) {
      this.message.info(this.translate.instant('T_COMMENT_LOGIN_REQUIRED'));
      return;
    }

    const parent = this.replyTarget;
    this.isSending = true;

    this.api
      .NewsAddComment({
        NewsId: this.newsId,
        ParentCommentId: parent?.CommentId ?? null,
        ReplyToCommentId: this.replyToCommentId,
        Content: content,
      })
      .subscribe({
        next: res => {
          this.isSending = false;

          if (!res?.Success) {
            this.showErrorService.setShowError({
              icon: 'warning',
              title: this.translate.instant('T_COMMENTS'),
              message:
                res?.ErrorMessage ||
                this.translate.instant('T_COMMENT_SEND_ERROR'),
            });
            return;
          }

          this.message.success(this.translate.instant('T_COMMENT_SENT'));
          this.cancelReply();

          if (parent) {
            // Chỉ tải lại nhánh trả lời, giữ nguyên vị trí đang đọc
            parent.ReplyCount += 1;
            this.expandedReplies.add(parent.CommentId);
            this.loadReplies(parent);
            this.totalCount += 1;
          } else {
            // Bình luận gốc mới: tải lại từ đầu để nó xuất hiện đúng thứ tự
            this.reload();
          }
        },
        error: () => {
          this.isSending = false;
          this.showErrorService.setShowError({
            icon: 'warning',
            title: this.translate.instant('T_COMMENTS'),
            message: this.translate.instant('T_COMMENT_SEND_RETRY'),
          });
        },
      });
  }

  toggleReplies(comment: INewsCommentDto): void {
    if (this.expandedReplies.has(comment.CommentId)) {
      this.expandedReplies.delete(comment.CommentId);
      return;
    }
    this.expandedReplies.add(comment.CommentId);

    // Preview từ server đã đủ số trả lời thì khỏi gọi lại
    if (comment.Replies.length >= comment.ReplyCount) {
      return;
    }
    this.loadReplies(comment);
  }

  // ── Thả tim ───────────────────────────────────────────────────────────
  toggleLike(comment: INewsCommentDto): void {
    if (!this.isLoggedIn) {
      this.message.info(
        this.translate.instant('T_COMMENT_LIKE_LOGIN_REQUIRED')
      );
      return;
    }

    const previousLiked = comment.IsLikedByMe;
    const previousCount = comment.LikeCount;
    comment.IsLikedByMe = !previousLiked;
    comment.LikeCount = previousCount + (previousLiked ? -1 : 1);

    this.api.NewsCommentLike(comment.CommentId).subscribe({
      next: res => {
        if (res?.Success && res.objResult) {
          comment.IsLikedByMe = res.objResult.Liked;
          comment.LikeCount = res.objResult.LikeCount;
        } else {
          comment.IsLikedByMe = previousLiked;
          comment.LikeCount = previousCount;
        }
      },
      error: () => {
        comment.IsLikedByMe = previousLiked;
        comment.LikeCount = previousCount;
      },
    });
  }

  // ── Báo cáo ───────────────────────────────────────────────────────────
  openReport(comment: INewsCommentDto): void {
    if (!this.isLoggedIn) {
      this.message.info(
        this.translate.instant('T_COMMENT_REPORT_LOGIN_REQUIRED')
      );
      return;
    }
    this.reportTargetId = comment.CommentId;
    this.isReportOpen = true;
  }

  closeReport(): void {
    this.isReportOpen = false;
    this.reportTargetId = null;
  }

  submitReport(request: INewsCommentReportRequest): void {
    this.isReporting = true;

    this.api.NewsCommentReport(request).subscribe({
      next: res => {
        this.isReporting = false;

        if (!res?.Success) {
          this.showErrorService.setShowError({
            icon: 'warning',
            title: this.translate.instant('T_COMMENT_REPORT_TITLE'),
            message:
              res?.ErrorMessage ||
              this.translate.instant('T_COMMENT_REPORT_ERROR'),
          });
          return;
        }

        this.closeReport();

        if (res.objResult?.AutoHidden) {
          this.message.success(this.translate.instant('T_COMMENT_AUTO_HIDDEN'));
          this.reload();
          return;
        }

        this.message.success(
          res.objResult?.Created
            ? this.translate.instant('T_COMMENT_REPORT_RECORDED')
            : this.translate.instant('T_COMMENT_REPORT_DUPLICATE')
        );
      },
      error: () => {
        this.isReporting = false;
        this.showErrorService.setShowError({
          icon: 'warning',
          title: this.translate.instant('T_COMMENT_REPORT_TITLE'),
          message: this.translate.instant('T_COMMENT_REPORT_RETRY'),
        });
      },
    });
  }

  deleteComment(comment: INewsCommentDto): void {
    this.api.NewsCommentDelete(comment.CommentId).subscribe({
      next: res => {
        if (res?.Success) {
          this.message.success(this.translate.instant('T_COMMENT_DELETED'));
          this.reload();
        } else {
          this.showErrorService.setShowError({
            icon: 'warning',
            title: this.translate.instant('T_COMMENT_DELETE_TITLE'),
            message:
              res?.ErrorMessage ||
              this.translate.instant('T_COMMENT_DELETE_ERROR'),
          });
        }
      },
      error: () => {
        this.showErrorService.setShowError({
          icon: 'warning',
          title: this.translate.instant('T_COMMENT_DELETE_TITLE'),
          message: this.translate.instant('T_COMMENT_DELETE_RETRY'),
        });
      },
    });
  }

  // ── Đăng nhập Google ngay tại chỗ ─────────────────────────────────────
  onGoogleCredential(idToken: string): void {
    this.authService.signInWithGoogle(idToken).subscribe({
      next: res => {
        if (res?.Success) {
          this.message.success(this.translate.instant('T_LOGIN_SUCCESS'));
          this.readAccount();
          // Tải lại để lấy đúng trạng thái đã thích / quyền xóa của tài khoản vừa đăng nhập
          this.reload();
        } else {
          this.showErrorService.setShowError({
            icon: 'warning',
            title: this.translate.instant('T_LOGIN'),
            message:
              res?.ErrorMessage || this.translate.instant('T_LOGIN_ERROR'),
          });
        }
      },
      error: () => {
        this.showErrorService.setShowError({
          icon: 'warning',
          title: this.translate.instant('T_LOGIN'),
          message: this.translate.instant('T_LOGIN_RETRY'),
        });
      },
    });
  }

  private loadPage(): void {
    this.isLoading = true;

    this.api
      .NewsComments(
        this.newsId,
        this.pageIndex,
        this.pageSize,
        this.sort,
        this.snapshot
      )
      .pipe(takeUntil(this.reloadCancelled))
      .subscribe({
        next: res => {
          this.isLoading = false;

          if (!res?.Success || !res.objResult) {
            this.hasMore = false;
            return;
          }

          const { DataList, ItemCount, PageIndex, PageSize } = res.objResult;
          const incoming = DataList ?? [];

          // Chặn trùng dòng: cùng lúc có snapshot ở server, phía client vẫn lọc lại
          // cho chắc vì offset có thể xê dịch khi bình luận bị ẩn/xóa giữa chừng.
          const seen = new Set(this.comments.map(c => c.CommentId));
          this.comments = [
            ...this.comments,
            ...incoming.filter(c => !seen.has(c.CommentId)),
          ];

          this.hasMore = (PageIndex + 1) * PageSize < ItemCount;
          // Data mang tổng mọi cấp, khác ItemCount vốn chỉ đếm bình luận gốc
          this.totalCount = res.Data?.ReplyCount ?? ItemCount;
        },
        error: () => {
          this.isLoading = false;
          this.hasMore = false;
        },
      });
  }

  private loadReplies(comment: INewsCommentDto): void {
    this.loadingRepliesFor = comment.CommentId;

    this.api
      .NewsCommentReplies(comment.CommentId, 0, this.replyPageSize)
      .pipe(takeUntil(this.reloadCancelled))
      .subscribe({
        next: res => {
          this.loadingRepliesFor = null;
          if (res?.Success && res.objResult) {
            const replies = res.objResult.DataList ?? [];
            const destination = comment.Replies.find(
              r => r.CommentId === this.highlightedCommentId
            );
            comment.Replies =
              destination &&
              !replies.some(r => r.CommentId === destination.CommentId)
                ? [...replies, destination]
                : replies;
            comment.ReplyCount = res.objResult.ItemCount;
          }
        },
        error: () => {
          this.loadingRepliesFor = null;
        },
      });
  }

  private readAccount(): void {
    if (!this.authService.isLoggedIn()) {
      this.accountName = null;
      this.accountAvatar = null;
      this.accountInitial = '';
      return;
    }

    // getAccountInfo() đọc thẳng decodedToken.name nên bọc try/catch phòng token thiếu field
    try {
      const info = this.authService.getAccountInfo();
      this.accountName = info?.name ?? null;
      this.accountInitial = info?.shortname ?? '';
      this.accountAvatar = info?.avatar || null;
    } catch {
      this.accountName = null;
    }
  }
}
