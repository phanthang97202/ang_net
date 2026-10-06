import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  HostListener,
  Input,
  OnChanges,
  ViewChild,
  inject,
} from '@angular/core';
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

  @ViewChild('nativeVideo')
  private nativeVideo?: ElementRef<HTMLVideoElement>;
  @ViewChild('embedFrame')
  private embedFrame?: ElementRef<HTMLIFrameElement>;

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
   * Phát ngay khi video mới đã sẵn sàng và luôn ưu tiên giữ âm thanh. Không tự
   * chuyển sang muted vì người xem đã chủ động mở/chuyển nội dung.
   */
  autoplayVideo(event: Event): void {
    const video = event.currentTarget as HTMLVideoElement | null;
    if (!video) return;

    video.muted = false;
    void video.play().catch(() => undefined);
  }

  playWithSound(): void {
    const video = this.nativeVideo?.nativeElement;
    if (video) {
      video.muted = false;
      void video.play().catch(() => undefined);
    }

    this.controlTikTok('unMute');
    this.controlTikTok('play');
  }

  @HostListener('window:message', ['$event'])
  onEmbedMessage(event: MessageEvent): void {
    const frameWindow = this.embedFrame?.nativeElement.contentWindow;
    if (
      this.item?.Provider !== 'TikTok' ||
      event.origin !== 'https://www.tiktok.com' ||
      event.source !== frameWindow ||
      event.data?.['x-tiktok-player'] !== true ||
      event.data?.type !== 'onPlayerReady'
    ) {
      return;
    }

    this.playWithSound();
  }

  private controlTikTok(type: 'play' | 'unMute'): void {
    if (this.item?.Provider !== 'TikTok') return;

    this.embedFrame?.nativeElement.contentWindow?.postMessage(
      { type, 'x-tiktok-player': true },
      'https://www.tiktok.com'
    );
  }
}
