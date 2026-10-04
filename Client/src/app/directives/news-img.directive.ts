import { Directive, ElementRef, Input, OnChanges, inject } from '@angular/core';

/** Ảnh thay thế khi bài viết không có ảnh hoặc ảnh không tải được. */
export const DEFAULT_NEWS_IMAGE = 'assets/images/default_img_news.jpg';

/**
 * Gắn ảnh bài viết kèm ảnh dự phòng: `<img [appNewsImg]="post.Thumbnail">`.
 *
 * Thay cho `[src]`: directive tự đặt src, nên cùng một chỗ lo được cả hai ca
 * - bài không có ảnh (chuỗi rỗng/null) → ảnh mặc định ngay;
 * - ảnh có link nhưng tải lỗi (link ngoài bị xoá, trang gốc chặn hotlink, file
 *   Cloudinary bị xoá...) → bắt sự kiện error rồi đổi sang ảnh mặc định.
 *
 * Không dùng cờ "đã đổi rồi": cùng một thẻ <img> có thể được gán ảnh khác về
 * sau (slide ảnh, danh sách render lại), cờ còn sót sẽ chặn mất lần dự phòng
 * kế tiếp. Thay vào đó so src hiện tại với ảnh mặc định - nếu chính ảnh mặc
 * định cũng lỗi thì dừng, không lặp vô hạn.
 */
@Directive({
  selector: 'img[appNewsImg]',
  standalone: true,
  host: { '(error)': 'onError()' },
})
export class NewsImgDirective implements OnChanges {
  private el = inject<ElementRef<HTMLImageElement>>(ElementRef);

  @Input('appNewsImg') source: string | null | undefined;

  ngOnChanges(): void {
    this.el.nativeElement.src = this.source?.trim() || DEFAULT_NEWS_IMAGE;
  }

  onError(): void {
    const img = this.el.nativeElement;
    if (img.src.endsWith(DEFAULT_NEWS_IMAGE)) {
      return;
    }
    img.src = DEFAULT_NEWS_IMAGE;
  }
}

/**
 * Cùng mục đích cho chỗ vẽ ảnh bằng background-image (không có sự kiện error):
 * xếp ảnh mặc định làm lớp nền thứ hai bên dưới. Ảnh thật tải được thì che kín
 * lớp dưới; tải lỗi thì lớp dưới lộ ra.
 */
export function newsBackgroundImage(url: string | null | undefined): string {
  const fallback = `url('${DEFAULT_NEWS_IMAGE}')`;
  // Mã hoá dấu nháy đơn: link ngoài chứa ' sẽ cắt ngang chuỗi url('...').
  const real = url?.trim().replace(/'/g, '%27');
  return real ? `url('${real}'), ${fallback}` : fallback;
}
