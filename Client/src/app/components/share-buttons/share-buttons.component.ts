import { Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { TranslateModule } from '@ngx-translate/core';

// Thời gian giữ trạng thái "đã chép" trước khi nút trở lại bình thường - cùng
// con số với nút chép link trên app-article-rail.
const COPIED_FEEDBACK_MS = 2000;

@Component({
  selector: 'app-share-buttons',
  standalone: true,
  imports: [CommonModule, NzIconModule, TranslateModule],
  templateUrl: './share-buttons.component.html',
  styleUrl: './share-buttons.component.scss',
})
export class ShareButtonsComponent {
  @Input() title = '';

  private message = inject(NzMessageService);

  isCopied = false;
  private copiedTimer?: ReturnType<typeof setTimeout>;

  // Lấy URL tại thời điểm bấm chứ không cache: chuyển sang bài khác cùng route
  // thì component không dựng lại, giữ URL cũ là chia sẻ nhầm bài.
  private get shareUrl(): string {
    return window.location.href;
  }

  shareFacebook(): void {
    this.openPopup(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(this.shareUrl)}`
    );
  }

  shareX(): void {
    this.openPopup(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(
        this.shareUrl
      )}&text=${encodeURIComponent(this.title)}`
    );
  }

  shareZalo(): void {
    this.openPopup(
      `https://zalo.me/share?u=${encodeURIComponent(this.shareUrl)}`
    );
  }

  // navigator.clipboard chỉ tồn tại trên HTTPS (hoặc localhost) - trên HTTP thì
  // thuộc tính này là undefined chứ không phải gọi vào rồi lỗi, nên phải kiểm
  // tra trước thay vì bọc try/catch. Cùng cách app-article-rail đang làm.
  copyLink(): void {
    if (!navigator.clipboard) {
      this.message.info('Trình duyệt không cho chép tự động, bạn copy tay nhé.');
      return;
    }

    navigator.clipboard.writeText(this.shareUrl).then(() => {
      this.isCopied = true;
      clearTimeout(this.copiedTimer);
      this.copiedTimer = setTimeout(() => {
        this.isCopied = false;
      }, COPIED_FEEDBACK_MS);
    });
  }

  // noopener: trang được mở có thể điều khiển ngược tab gốc qua window.opener
  // nếu không chặn.
  private openPopup(url: string): void {
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=520');
  }
}
