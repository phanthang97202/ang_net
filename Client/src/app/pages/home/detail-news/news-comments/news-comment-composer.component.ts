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

@Component({
  selector: 'app-news-comment-composer',
  standalone: true,
  imports: [FormsModule, NzIconModule],
  templateUrl: './news-comment-composer.component.html',
  styleUrl: './news-comment-composer.component.scss',
})
export class NewsCommentComposerComponent implements OnChanges, OnDestroy {
  @Input() avatarUrl: string | null = null;
  @Input() initial = '';
  @Input() placeholder = 'Viết bình luận của bạn...';
  @Input() isSending = false;
  /** Nội dung điền sẵn (vd "@Tên ") kèm mốc thời gian để mỗi lần bấm Trả lời đều kích hoạt lại */
  @Input() prefill = '';
  @Input() prefillToken = 0;

  @Output() submitted = new EventEmitter<string>();
  @Output() cancelled = new EventEmitter<void>();

  @ViewChild('input') input?: ElementRef<HTMLTextAreaElement>;

  draft = '';

  private focusTimer?: ReturnType<typeof setTimeout>;

  get canSend(): boolean {
    return this.draft.trim().length > 0 && !this.isSending;
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
    this.submitted.emit(this.draft.trim());
    this.draft = '';
  }

  cancel(): void {
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
