import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import {
  ENewsCommentReportReason,
  INewsCommentReportRequest,
} from '../../../../interfaces';

interface ReportReasonOption {
  value: ENewsCommentReportReason;
  label: string;
}

@Component({
  selector: 'app-news-comment-report-modal',
  standalone: true,
  imports: [FormsModule, NzModalModule, NzRadioModule, TranslateModule],
  templateUrl: './news-comment-report-modal.component.html',
  styleUrl: './news-comment-report-modal.component.scss',
})
export class NewsCommentReportModalComponent {
  @Input() isOpen = false;
  @Input() isSending = false;
  /** Id bình luận đang báo cáo; null là chưa chọn gì */
  @Input() commentId: string | null = null;

  @Output() closed = new EventEmitter<void>();
  @Output() submitted = new EventEmitter<INewsCommentReportRequest>();

  // Khớp với enum ENewsCommentReportReason phía server
  readonly reasons: ReportReasonOption[] = [
    { value: 'Spam', label: 'Spam / quảng cáo' },
    { value: 'HateSpeech', label: 'Lời lẽ thù ghét, phân biệt đối xử' },
    { value: 'Harassment', label: 'Quấy rối, xúc phạm cá nhân' },
    { value: 'Violence', label: 'Bạo lực' },
    { value: 'Nudity', label: 'Nội dung khiêu dâm' },
    { value: 'FakeNews', label: 'Thông tin sai sự thật' },
    { value: 'Other', label: 'Lý do khác' },
  ];

  reason: ENewsCommentReportReason = 'Spam';
  description = '';

  send(): void {
    if (!this.commentId || this.isSending) {
      return;
    }
    this.submitted.emit({
      CommentId: this.commentId,
      Reason: this.reason,
      Description: this.description.trim(),
    });
  }

  cancel(): void {
    this.reason = 'Spam';
    this.description = '';
    this.closed.emit();
  }
}
