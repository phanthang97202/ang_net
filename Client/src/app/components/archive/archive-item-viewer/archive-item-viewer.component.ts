import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { IArchiveItem } from '../../../interfaces';
import { resolveLinkEmbed } from '../../../helpers/utils/embed-url';

/** Hiển thị một mục lưu trữ cỡ lớn: ảnh, video, khung nhúng hoặc thẻ link. */
@Component({
  selector: 'app-archive-item-viewer',
  standalone: true,
  imports: [CommonModule, NzIconModule],
  templateUrl: './archive-item-viewer.component.html',
  styleUrl: './archive-item-viewer.component.scss',
})
export class ArchiveItemViewerComponent implements OnChanges {
  @Input({ required: true }) item!: IArchiveItem;
  /** false khi tiêu đề đã nằm ở header của modal bọc ngoài */
  @Input() showTitle = true;

  private sanitizer = inject(DomSanitizer);

  embedSrc: SafeResourceUrl | null = null;
  aspectRatio: string | null = null;
  hostname = '';

  ngOnChanges(): void {
    this.embedSrc = null;
    this.aspectRatio = null;
    this.hostname = '';

    if (this.item?.Kind !== 'Link') return;

    try {
      this.hostname = new URL(this.item.SourceUrl).hostname.replace(/^www\./, '');
    } catch {
      this.hostname = this.item.SourceUrl;
    }

    const embed = resolveLinkEmbed(this.item.SourceUrl, true);
    // Chỉ những src do resolveLinkEmbed tự dựng (đúng domain nhúng của từng
    // mạng) mới được tin; link "Web" bất kỳ không bao giờ vào iframe.
    if (embed.embedSrc) {
      this.embedSrc = this.sanitizer.bypassSecurityTrustResourceUrl(embed.embedSrc);
      this.aspectRatio = embed.aspectRatio;
    }
  }

  /**
   * Phát ngay khi video mới đã sẵn sàng. Trình duyệt thường cho phép phát có
   * tiếng vì người xem vừa bấm mở/prev/next; nếu chính sách autoplay vẫn chặn,
   * chuyển sang muted để video không bị đứng ở nút Play.
   */
  autoplayVideo(event: Event): void {
    const video = event.currentTarget as HTMLVideoElement | null;
    if (!video) return;

    video.muted = false;
    void video.play().catch(() => {
      video.muted = true;
      void video.play().catch(() => undefined);
    });
  }
}
