import {
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  Input,
  Output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { NzMessageService } from 'ng-zorro-antd/message';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService, AuthService } from '../../services';

@Component({
  selector: 'app-news-rating',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './news-rating.component.html',
  styleUrl: './news-rating.component.scss',
})
export class NewsRatingComponent {
  @Input({ required: true }) newsId = '';

  // Thang 10 của backend. UI hiện 5 sao nên mọi chỗ hiển thị đều chia đôi.
  @Input() avgPoint = 0;
  @Input() totalPoint = 0;

  // Điểm người đang đăng nhập đã chấm, 0 = chưa chấm.
  @Input() set myPoint(value: number) {
    this.myStars = this.toStars(value);
  }

  // Báo lên trang cha để nó cập nhật lại điểm trung bình đang hiển thị chỗ khác.
  @Output() rated = new EventEmitter<{ avgPoint: number; totalPoint: number }>();

  private api = inject(ApiService);
  private auth = inject(AuthService);
  private message = inject(NzMessageService);
  private destroyRef = inject(DestroyRef);

  readonly stars = [1, 2, 3, 4, 5];

  myStars = 0;
  hoverStars = 0;
  isSubmitting = false;

  get isLoggedIn(): boolean {
    return this.auth.isLoggedIn();
  }

  // Sao được tô: ưu tiên vị trí chuột đang rê, chưa rê thì theo điểm đã chấm.
  get activeStars(): number {
    return this.hoverStars || this.myStars;
  }

  get avgStars(): number {
    return this.toStars(this.avgPoint);
  }

  // Nhãn dưới hàng sao đổi theo số sao đang trỏ tới, giống các trang TMĐT.
  get hintKey(): string {
    const value = this.activeStars;
    if (value === 0) return 'T_RATING_HINT';
    return `T_RATING_LEVEL_${value}`;
  }

  onEnter(star: number): void {
    if (!this.isSubmitting) {
      this.hoverStars = star;
    }
  }

  onLeave(): void {
    this.hoverStars = 0;
  }

  rate(star: number): void {
    if (!this.isLoggedIn) {
      this.message.info('Bạn cần đăng nhập để đánh giá bài viết.');
      return;
    }
    if (this.isSubmitting) return;

    const previousStars = this.myStars;
    // Tô sao ngay để phản hồi tức thì, hỏng thì trả lại giá trị cũ bên dưới.
    this.myStars = star;
    this.hoverStars = 0;
    this.isSubmitting = true;

    this.api
      .NewsPoint(this.newsId, star * 2)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => {
          this.isSubmitting = false;
          if (!res?.Success) {
            this.myStars = previousStars;
            // Kèm mã lỗi của server: Success=false về kèm HTTP 200 nên nếu chỉ
            // báo chung chung thì không lần ra được hỏng ở đâu.
            this.message.error(
              res?.ErrorMessage
                ? `Không gửi được đánh giá (${res.ErrorMessage}).`
                : 'Không gửi được đánh giá, vui lòng thử lại.'
            );
            return;
          }
          this.applyLocalAverage(previousStars, star);
          this.message.success(
            previousStars > 0 ? 'Đã cập nhật đánh giá.' : 'Cảm ơn đánh giá!'
          );
        },
        error: () => {
          this.isSubmitting = false;
          this.myStars = previousStars;
          this.message.error('Không gửi được đánh giá, vui lòng thử lại.');
        },
      });
  }

  // Tính lại trung bình ngay tại client thay vì gọi lại Detail: chấm điểm đã
  // xoá cache phía server nhưng một request nữa chỉ để lấy đúng 2 con số thì
  // không đáng, và người dùng thấy số nhảy ngay lúc bấm.
  private applyLocalAverage(previousStars: number, star: number): void {
    const isFirstTime = previousStars === 0;
    const total = isFirstTime ? this.totalPoint + 1 : this.totalPoint;
    const sum =
      this.avgPoint * this.totalPoint - (isFirstTime ? 0 : previousStars * 2);

    this.totalPoint = total;
    this.avgPoint = total > 0 ? (sum + star * 2) / total : 0;
    this.rated.emit({ avgPoint: this.avgPoint, totalPoint: this.totalPoint });
  }

  private toStars(point: number): number {
    if (!point || point <= 0) return 0;
    return Math.round(point / 2);
  }
}
