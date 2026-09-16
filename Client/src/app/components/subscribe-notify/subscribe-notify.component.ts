import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { ScrollRevealDirective } from '../../directives';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../services';

interface SubscribeForm {
  email: string;
}

@Component({
  selector: 'app-subscribe-notify',
  standalone: true,
  imports: [CommonModule, FormsModule, ScrollRevealDirective, TranslateModule],
  templateUrl: './subscribe-notify.component.html',
  styleUrls: ['./subscribe-notify.component.scss'],
})
export class SubscribeNotifyComponent {
  private api = inject(ApiService);
  private destroyRef = inject(DestroyRef);

  form: SubscribeForm = { email: '' };
  isLoading = false;
  isSuccess = false;
  errorMsg = '';

  handleSubmit(): void {
    this.errorMsg = '';

    // ── Validate client-side ────────────────────────────
    if (!this.isValidEmail(this.form.email)) {
      this.errorMsg = 'Vui lòng nhập email hợp lệ.';
      return;
    }

    this.isLoading = true;

    this.api
      .Subscribe(this.form.email)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: res => {
          if (res?.Success) {
            // Email đã đăng ký từ trước cũng hiện màn thành công: nói thẳng
            // "email này đã đăng ký rồi" là để người lạ dò được ai đang theo dõi
            // blog. Server cũng không gửi lại mail chào trong trường hợp đó.
            this.isSuccess = true;
            return;
          }
          this.errorMsg =
            res?.ErrorMessage || 'Đăng ký thất bại, vui lòng thử lại.';
        },
        error: () => {
          this.errorMsg = 'Có lỗi xảy ra, vui lòng thử lại sau.';
        },
      });
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}
