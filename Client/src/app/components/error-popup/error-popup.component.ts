import {
  Component,
  inject,
  Input,
  OnChanges,
  SimpleChanges,
  OnDestroy,
} from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule, NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { ShowErrorService, IErrorInfoWithId } from '../../services';

@Component({
  standalone: true,
  selector: 'app-error-popup',
  imports: [NzButtonModule, NzModalModule],
  template: ``,
})
export class ErrorPopupComponent implements OnChanges, OnDestroy {
  @Input() errorInfo: IErrorInfoWithId = {
    title: '',
    icon: '',
    message: '',
  };

  errorInfoService = inject(ShowErrorService);
  private currentModal: NzModalRef | null = null;
  private lastErrorId: number | undefined = undefined; // Track ID thay vì message

  constructor(private modal: NzModalService) {}

  showConfirm() {
    // Đóng modal cũ nếu có
    if (this.currentModal) {
      this.currentModal.destroy();
      this.currentModal = null;
    }

    // Lưu ID hiện tại
    this.lastErrorId = this.errorInfo.id;

    // Tạo modal mới
    this.currentModal = this.modal.error({
      nzIconType: this.errorInfo.icon || 'error',
      nzTitle: this.errorInfo.title || 'Lỗi',
      nzContent: `<pre style="white-space: pre-wrap; word-wrap: break-word; max-height: 400px; overflow-y: auto;">${this.errorInfo.message}</pre>`,
      nzCentered: true,
      nzOnOk: () => this.closeModal(),
      nzOnCancel: () => this.closeModal(),
    });

    this.currentModal.afterClose.subscribe(() => {
      this.closeModal();
    });
  }

  private closeModal() {
    this.currentModal = null;
    this.errorInfoService.clearError();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['errorInfo']) {
      const current = changes['errorInfo'].currentValue;

      // Hiển thị khi:
      // 1. Có message
      // 2. ID khác với ID trước đó (hoặc lần đầu)
      if (
        current?.message &&
        current.message !== '' &&
        current.id !== this.lastErrorId
      ) {
        this.showConfirm();
      }
    }
  }

  ngOnDestroy() {
    if (this.currentModal) {
      this.currentModal.destroy();
      this.currentModal = null;
    }
  }
}

// Đây là **`ErrorPopupComponent`**, một **standalone Angular component** dùng cùng với `ShowErrorService` mà bạn gửi ở trên.
// Nó có nhiệm vụ **nghe (hoặc nhận Input)** từ service và **hiển thị popup lỗi (modal)** bằng thư viện **ng-zorro-antd**.

// Dưới đây là giải thích chi tiết từng phần 👇

// ---

// ## 🧩 Mục đích tổng thể

// `ErrorPopupComponent` là một **UI component chuyên hiển thị lỗi** dưới dạng **popup modal**.
// Nó:

// * Nhận dữ liệu lỗi (`errorInfo`) từ `ShowErrorService` hoặc cha truyền vào.
// * Tự động **so sánh `id` lỗi mới với lỗi cũ** để tránh popup lặp lại.
// * Dùng **ng-zorro-antd Modal** để hiển thị popup lỗi đẹp và có scroll.

// ---

// ## ⚙️ Cấu trúc tổng quát

// | Phần                 | Mô tả                                                    |
// | -------------------- | -------------------------------------------------------- |
// | `@Input() errorInfo` | Nhận thông tin lỗi gồm `title`, `message`, `icon`, `id`. |
// | `ShowErrorService`   | Dùng để xóa queue khi modal đóng (`clearError()`).       |
// | `NzModalService`     | Dịch vụ của ng-zorro để hiển thị modal.                  |
// | `lastErrorId`        | Lưu ID lỗi cuối cùng để tránh hiển thị trùng.            |
// | `currentModal`       | Biến tham chiếu modal đang mở để có thể đóng đúng cách.  |

// ---

// ## 🔁 Luồng hoạt động chi tiết

// ### 1️⃣ Khi `errorInfo` thay đổi (`ngOnChanges`)

// ```ts
// ngOnChanges(changes: SimpleChanges) {
//   if (changes['errorInfo']) {
//     const current = changes['errorInfo'].currentValue;

//     if (current?.message && current.message !== '' && current.id !== this.lastErrorId) {
//       this.showConfirm();
//     }
//   }
// }
// ```

// ➡️ Mỗi khi `errorInfo` (từ cha hoặc service) thay đổi:

// * Nếu có `message`
// * Và `id` khác `lastErrorId` (nghĩa là lỗi mới)
//   → thì gọi `showConfirm()` để hiển thị popup mới.

// ✅ Cách này rất hay vì **ngăn việc mở lại popup cũ** khi giá trị Input chưa đổi thực sự (Angular change detection issue).

// ---

// ### 2️⃣ Hiển thị popup lỗi (`showConfirm()`)

// ```ts
// this.currentModal = this.modal.error({
//   nzIconType: this.errorInfo.icon || 'error',
//   nzTitle: this.errorInfo.title || 'Lỗi',
//   nzContent: `<pre style="white-space: pre-wrap; word-wrap: break-word; max-height: 400px; overflow-y: auto;">${this.errorInfo.message}</pre>`,
//   nzCentered: true,
//   nzOnOk: () => this.closeModal(),
//   nzOnCancel: () => this.closeModal(),
// });
// ```

// 🔹 Dùng `this.modal.error()` (từ ng-zorro) để tạo popup kiểu "error".
// 🔹 `nzContent` là HTML `<pre>` giúp hiển thị message dài, có scroll.
// 🔹 `nzCentered: true` giúp popup hiển thị giữa màn hình.
// 🔹 `nzOnOk` & `nzOnCancel` gọi `closeModal()` để đóng và dọn lỗi.

// 📌 Trước khi mở modal mới, component **đóng modal cũ** (nếu đang mở) để tránh popup chồng nhau.

// ---

// ### 3️⃣ Đóng modal (`closeModal()`)

// ```ts
// private closeModal() {
//   this.currentModal = null;
//   this.errorInfoService.clearError();
// }
// ```

// * Gán `currentModal = null`
// * Gọi `ShowErrorService.clearError()` để xóa queue lỗi đang giữ, tránh lỗi lặp.

// ---

// ### 4️⃣ Khi component bị destroy (`ngOnDestroy`)

// Đảm bảo modal đang mở được destroy để tránh memory leak:

// ```ts
// ngOnDestroy() {
//   if (this.currentModal) {
//     this.currentModal.destroy();
//     this.currentModal = null;
//   }
// }
// ```

// ---

// ## 🧠 Tóm tắt hoạt động tổng thể

// | Bước | Hành động                                                            |
// | ---- | -------------------------------------------------------------------- |
// | 1️⃣  | `ShowErrorService` gom lỗi và emit `IErrorInfoWithId` mới            |
// | 2️⃣  | Component cha nhận `errorInfo` và truyền xuống `ErrorPopupComponent` |
// | 3️⃣  | `ErrorPopupComponent` phát hiện ID lỗi mới → hiển thị popup          |
// | 4️⃣  | Người dùng bấm OK / Cancel → modal đóng và lỗi được clear            |
