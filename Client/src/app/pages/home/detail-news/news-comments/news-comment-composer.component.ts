import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { TranslateModule } from '@ngx-translate/core';
import { TurnstileComponent } from '../../../../components/turnstile/turnstile.component';

export interface NewsCommentSubmission {
  content: string;
  turnstileToken: string;
}

@Component({
  selector: 'app-news-comment-composer',
  standalone: true,
  imports: [FormsModule, NzIconModule, TranslateModule, TurnstileComponent],
  templateUrl: './news-comment-composer.component.html',
  styleUrl: './news-comment-composer.component.scss',
})
export class NewsCommentComposerComponent implements OnChanges, OnDestroy {
  @Input() avatarUrl: string | null = null;
  @Input() initial = '';
  @Input() placeholder = '';
  @Input() isSending = false;
  /** Nội dung điền sẵn (vd "@Tên ") kèm mốc thời gian để mỗi lần bấm Trả lời đều kích hoạt lại */
  @Input() prefill = '';
  @Input() prefillToken = 0;

  @Output() submitted = new EventEmitter<NewsCommentSubmission>();
  @Output() cancelled = new EventEmitter<void>();

  @ViewChild('input') input?: ElementRef<HTMLTextAreaElement>;
  @ViewChild(TurnstileComponent) captcha?: TurnstileComponent;

  draft = '';
  turnstileToken = '';

  private focusTimer?: ReturnType<typeof setTimeout>;

  get canSend(): boolean {
    return (
      this.draft.trim().length > 0 && !!this.turnstileToken && !this.isSending
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Dùng prefillToken chứ không phải prefill: trả lời 2 lần cùng một người thì
    // chuỗi prefill không đổi nên ngOnChanges sẽ không bắn nếu chỉ theo dõi prefill.
    if (changes['prefillToken'] && this.prefillToken > 0) {
      this.draft = this.prefill;
      this.focusInput();
    }
  }

  ngOnDestroy(): void {
    clearTimeout(this.focusTimer);
  }

  send(): void {
    if (!this.canSend) {
      return;
    }
    const submission = {
      content: this.draft.trim(),
      turnstileToken: this.turnstileToken,
    };
    this.turnstileToken = '';
    this.submitted.emit(submission);
  }

  completeSubmission(success: boolean): void {
    if (success) this.draft = '';
    this.turnstileToken = '';
    this.captcha?.reset();
  }

  cancel(): void {
    if (this.isSending) return;
    this.draft = '';
    this.cancelled.emit();
  }

  /** Ctrl/Cmd + Enter để gửi nhanh, Enter thường vẫn xuống dòng */
  onKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      this.send();
    }
  }

  private focusInput(): void {
    clearTimeout(this.focusTimer);
    // Hoãn một nhịp để Angular vẽ xong ô nhập rồi mới focus
    this.focusTimer = setTimeout(() => {
      const el = this.input?.nativeElement;
      if (el) {
        el.focus();
        // Đặt con trỏ ở cuối để gõ tiếp ngay sau "@Tên "
        el.setSelectionRange(el.value.length, el.value.length);
      }
    });
  }
}
