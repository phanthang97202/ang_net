import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { NzModalModule } from 'ng-zorro-antd/modal';
import {
  ENewsCommentReportReason,
  INewsCommentReportRequest,
} from '../../../../interfaces';

interface ReportReasonOption {
  value: ENewsCommentReportReason;
  labelKey: string;
}

@Component({
  selector: 'app-news-comment-report-modal',
  standalone: true,
  imports: [FormsModule, NzModalModule, TranslateModule],
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
    { value: 'Spam', labelKey: 'T_COMMENT_REPORT_SPAM' },
    { value: 'HateSpeech', labelKey: 'T_COMMENT_REPORT_HATE_SPEECH' },
    { value: 'Harassment', labelKey: 'T_COMMENT_REPORT_HARASSMENT' },
    { value: 'Violence', labelKey: 'T_COMMENT_REPORT_VIOLENCE' },
    { value: 'Nudity', labelKey: 'T_COMMENT_REPORT_NUDITY' },
    { value: 'FakeNews', labelKey: 'T_COMMENT_REPORT_FAKE_NEWS' },
    { value: 'Other', labelKey: 'T_COMMENT_REPORT_OTHER' },
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
