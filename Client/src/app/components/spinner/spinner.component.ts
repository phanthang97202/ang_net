import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

export type SpinnerSize = 'small' | 'default' | 'large';

// Thay cho nz-spin mặc định của NG-ZORRO. Vẽ bằng 12 vạch xoay quanh tâm, màu
// lấy từ biến theme nên tự đổi theo sáng/tối thay vì cứng một màu xanh.
@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './spinner.component.html',
  styleUrl: './spinner.component.scss',
})
export class SpinnerComponent {
  @Input() size: SpinnerSize = 'default';

  // Chỉ để *ngFor dựng đủ 12 thẻ; góc quay và độ mờ của từng vạch nằm ở SCSS.
  readonly bars = Array.from({ length: 12 });
}
