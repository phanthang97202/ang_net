import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface SubscribeForm {
  email: string;
}

// interface SubscribeResponse {
//   success: boolean;
//   message?: string;
// }

@Component({
  selector: 'app-subscribe-notify',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './subscribe-notify.component.html',
  styleUrls: ['./subscribe-notify.component.scss'],
})
export class SubscribeNotifyComponent {
  private http = inject(HttpClient);

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

    // ── Gọi API thật ─────────────────────────────────────
    // this.http.post<SubscribeResponse>('/api/subscribe', this.form)
    //   .pipe(finalize(() => (this.isLoading = false)))
    //   .subscribe({
    //     next: (res) => {
    //       if (res.success) {
    //         this.isSuccess = true;
    //       } else {
    //         this.errorMsg = res.message ?? 'Đăng ký thất bại, vui lòng thử lại.';
    //       }
    //     },
    //     error: () => {
    //       this.errorMsg = 'Có lỗi xảy ra, vui lòng thử lại sau.';
    //     },
    //   });

    // ── Mock (xóa khi dùng API thật) ─────────────────────
    setTimeout(() => {
      this.isLoading = false;
      this.isSuccess = true;
    }, 1200);
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}
