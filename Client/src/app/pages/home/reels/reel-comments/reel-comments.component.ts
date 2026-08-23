import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { Subscription } from 'rxjs';
import { ApiService, AuthService, ShowErrorService } from '../../../../services';
import { IReelCommentDto, IReelDto } from '../../../../interfaces';
import { TimeAgo } from '../../../../pipes';

@Component({
  selector: 'app-reel-comments',
  standalone: true,
  imports: [FormsModule, NzIconModule, TimeAgo],
  templateUrl: './reel-comments.component.html',
  styleUrl: './reel-comments.component.scss',
})
export class ReelCommentsComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input({ required: true }) reel!: IReelDto;
  @Input() currentUserAvatar: string | null = null;
  @Input() currentUserInitial = '';

  @Output() closed = new EventEmitter<void>();
  /** Báo lên cha để cập nhật CommentCount hiển thị ở rail */
  @Output() commentAdded = new EventEmitter<void>();

  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private showErrorService = inject(ShowErrorService);
  private router = inject(Router);

  comments: IReelCommentDto[] = [];
  isLoading = false;
  hasMore = true;
  isSending = false;
  draft = '';
  replyTo: IReelCommentDto | null = null;
  /** CommentId của các comment đang mở phần trả lời */
  expandedReplies = new Set<string>();
  loadingRepliesFor: string | null = null;

  private nextCursor: string | null = null;
  private readonly pageSize = 20;
  private readonly replyPageSize = 20;

  @ViewChild('scrollBody') scrollBody?: ElementRef<HTMLElement>;
  @ViewChild('sentinel') sentinel?: ElementRef<HTMLElement>;
  @ViewChild('commentInput') commentInput?: ElementRef<HTMLInputElement>;

  private observer?: IntersectionObserver;
  private subs: Subscription[] = [];
  private focusTimer?: ReturnType<typeof setTimeout>;

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['reel'] && this.reel) {
      this.resetAndLoad();
    }
  }

  ngAfterViewInit(): void {
    this.setupObserver();
    // Mở panel là gõ được ngay, không phải bấm thêm vào ô nhập
    this.focusInput();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.subs.forEach(s => s.unsubscribe());
    clearTimeout(this.focusTimer);
  }

  close(): void {
    this.closed.emit();
  }

  trackByCommentId(_index: number, item: IReelCommentDto): string {
    return item.CommentId;
  }

  authorInitial(comment: IReelCommentDto): string {
    return (comment.UserFullName || '?').charAt(0).toUpperCase();
  }

  startReply(comment: IReelCommentDto): void {
    if (!this.isLoggedIn) {
      this.goLogin();
      return;
    }
    // Backend chỉ cho reply 1 cấp: trả lời một reply thì vẫn gắn vào comment gốc của nó
    this.replyTo = comment.ParentCommentId
      ? (this.comments.find(c => c.CommentId === comment.ParentCommentId) ?? comment)
      : comment;

    this.focusInput();
  }

  /**
   * Hoãn một nhịp để Angular vẽ xong ô nhập rồi mới focus: lúc panel vừa mở
   * hoặc khi bấm Trả lời (thanh "đang trả lời" chèn thêm vào DOM), phần tử
   * chưa chắc đã sẵn sàng ngay tại thời điểm gọi.
   */
  private focusInput(): void {
    clearTimeout(this.focusTimer);
    this.focusTimer = setTimeout(() => {
      this.commentInput?.nativeElement.focus();
    });
  }

  cancelReply(): void {
    this.replyTo = null;
  }

  toggleReplies(comment: IReelCommentDto): void {
    if (this.expandedReplies.has(comment.CommentId)) {
      this.expandedReplies.delete(comment.CommentId);
      return;
    }

    this.expandedReplies.add(comment.CommentId);

    // Đã có sẵn đủ reply (preview trả về từ server) thì khỏi gọi lại
    if (comment.Replies.length >= comment.ReplyCount) {
      return;
    }

    this.loadingRepliesFor = comment.CommentId;
    this.subs.push(
      this.apiService
        .ReelReplies(comment.CommentId, this.replyPageSize, null)
        .subscribe({
          next: res => {
            this.loadingRepliesFor = null;
            if (res?.Success && res.objResult) {
              comment.Replies = res.objResult.DataList ?? [];
            }
          },
          error: () => {
            this.loadingRepliesFor = null;
          },
        })
    );
  }

  goLogin(): void {
    this.router.navigate(['/login']);
  }

  send(): void {
    const content = this.draft.trim();
    if (!content || this.isSending) {
      return;
    }

    if (!this.isLoggedIn) {
      this.goLogin();
      return;
    }

    const parent = this.replyTo;
    this.isSending = true;

    this.subs.push(
      this.apiService
        .ReelAddComment({
          ReelId: this.reel.ReelId,
          ParentCommentId: parent?.CommentId ?? null,
          Content: content,
        })
        .subscribe({
          next: res => {
            this.isSending = false;

            if (!res?.Success || !res.Data) {
              this.showErrorService.setShowError({
                icon: 'warning',
                title: 'Bình luận',
                message: res?.ErrorMessage || 'Gửi bình luận thất bại.',
              });
              return;
            }

            // Server chưa trả tên/avatar người gửi trong Data nên bù tại chỗ để hiện ngay
            const created: IReelCommentDto = {
              ...res.Data,
              UserFullName: res.Data.UserFullName || this.currentUserName,
              UserAvatar: res.Data.UserAvatar || (this.currentUserAvatar ?? ''),
              Replies: res.Data.Replies ?? [],
            };

            if (parent) {
              parent.Replies = [...parent.Replies, created];
              parent.ReplyCount += 1;
              this.expandedReplies.add(parent.CommentId);
            } else {
              this.comments = [...this.comments, created];
            }

            this.draft = '';
            this.replyTo = null;
            this.commentAdded.emit();
          },
          error: () => {
            this.isSending = false;
            this.showErrorService.setShowError({
              icon: 'warning',
              title: 'Bình luận',
              message: 'Gửi bình luận thất bại. Vui lòng thử lại.',
            });
          },
        })
    );
  }

  private get currentUserName(): string {
    try {
      return this.authService.getAccountInfo()?.name ?? '';
    } catch {
      return '';
    }
  }

  private resetAndLoad(): void {
    this.comments = [];
    this.nextCursor = null;
    this.hasMore = true;
    this.isLoading = false;
    this.replyTo = null;
    this.draft = '';
    this.expandedReplies.clear();
    this.loadNextPage();
  }

  private setupObserver(): void {
    if (!this.scrollBody || !this.sentinel) {
      return;
    }
    // root là khung cuộn của panel, không phải cửa sổ trình duyệt
    this.observer = new IntersectionObserver(
      entries => {
        if (entries.some(e => e.isIntersecting)) {
          this.loadNextPage();
        }
      },
      { root: this.scrollBody.nativeElement, threshold: 0 }
    );
    this.observer.observe(this.sentinel.nativeElement);
  }

  private loadNextPage(): void {
    if (this.isLoading || !this.hasMore || !this.reel) {
      return;
    }

    this.isLoading = true;
    this.subs.push(
      this.apiService
        .ReelComments(this.reel.ReelId, this.pageSize, this.nextCursor)
        .subscribe({
          next: res => {
            this.isLoading = false;

            if (!res?.Success || !res.objResult) {
              this.hasMore = false;
              return;
            }

            const { DataList, NextCursor, HasMore } = res.objResult;
            this.comments = [...this.comments, ...(DataList ?? [])];
            this.nextCursor = NextCursor;
            this.hasMore = HasMore;
          },
          error: () => {
            this.isLoading = false;
            // Dừng hẳn để không lặp vô hạn khi sentinel vẫn nằm trong khung nhìn
            this.hasMore = false;
          },
        })
    );
  }
}
