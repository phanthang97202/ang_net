import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { INewsCommentDto } from '../../../../interfaces';
import { TimeAgo } from '../../../../pipes';

@Component({
  selector: 'app-news-comment-item',
  standalone: true,
  imports: [NzIconModule, TimeAgo, TranslateModule],
  templateUrl: './news-comment-item.component.html',
  styleUrl: './news-comment-item.component.scss',
})
export class NewsCommentItemComponent {
  @Input({ required: true }) comment!: INewsCommentDto;
  /** Dòng trả lời: thu nhỏ avatar, không hiện nút mở rộng nhánh con */
  @Input() isReply = false;
  @Input() isExpanded = false;
  @Input() isLoadingReplies = false;

  @Output() liked = new EventEmitter<INewsCommentDto>();
  @Output() replied = new EventEmitter<INewsCommentDto>();
  @Output() reported = new EventEmitter<INewsCommentDto>();
  @Output() deleted = new EventEmitter<INewsCommentDto>();
  @Output() toggledReplies = new EventEmitter<INewsCommentDto>();

  get authorInitial(): string {
    return (this.comment.UserFullName || '?').charAt(0).toUpperCase();
  }

  get avatarUrl(): string | null {
    return this.comment.UserAvatar || null;
  }

  /**
   * Tách "@Tên" ở đầu nội dung để tô màu riêng. Server lưu mention như chữ thường
   * nên không cần thêm trường nào, chỉ nhận dạng lúc hiển thị.
   */
  get mention(): string | null {
    const match = /^(@\S+)\s/.exec(this.comment.Content || '');
    return match ? match[1] : null;
  }

  get bodyWithoutMention(): string {
    const mention = this.mention;
    return mention
      ? this.comment.Content.slice(mention.length).trimStart()
      : this.comment.Content;
  }

  formatCount(value: number): string {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1).replace('.0', '')}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1).replace('.0', '')}K`;
    }
    return `${value ?? 0}`;
  }
}
