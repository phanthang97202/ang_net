import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { IErrorInfo } from '../interfaces';

export interface IErrorInfoWithId extends IErrorInfo {
  id?: number; // Thêm ID để force trigger
}

@Injectable({
  providedIn: 'root',
})
export class ShowErrorService {
  private readonly errorInfo = new Subject<IErrorInfoWithId>();
  private errorQueue: string[] = [];
  private errorTitles: string[] = [];
  private debounceTimer: any;
  private readonly DEBOUNCE_TIME = 500;
  private errorId = 0; // Counter để tạo ID unique

  setShowError(obj: IErrorInfo): void {
    if (obj.message && !this.errorQueue.includes(obj.message)) {
      this.errorQueue.push(obj.message);
    }

    if (obj.title && !this.errorTitles.includes(obj.title)) {
      this.errorTitles.push(obj.title);
    }

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.flushErrors(obj.icon ?? '');
    }, this.DEBOUNCE_TIME);
  }

  private flushErrors(icon: string): void {
    if (this.errorQueue.length === 0) return;

    const title =
      this.errorTitles.length > 1
        ? 'Có lỗi xảy ra'
        : this.errorTitles[0] || 'Lỗi';

    const combinedMessage = this.errorQueue
      .map((msg, index) => `${index + 1}. ${msg}`)
      .join('\n\n');

    // Tăng ID mỗi lần emit
    this.errorId++;

    this.errorInfo.next({
      id: this.errorId, // ID unique
      title,
      icon: icon || 'error',
      message: combinedMessage,
    });

    this.errorQueue = [];
    this.errorTitles = [];
  }

  getErrorInfo(): Observable<IErrorInfoWithId> {
    return this.errorInfo.asObservable();
  }

  clearError(): void {
    this.errorQueue = [];
    this.errorTitles = [];

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }
}

// Đây là một **Angular service** (`ShowErrorService`) được viết rất gọn và thông minh, dùng để **gom nhóm (debounce) và phát (emit) các lỗi hiển thị ra UI**.
// Mình sẽ giải thích chi tiết từng phần:

// ---

// ### 🧩 1. Mục đích tổng thể

// `ShowErrorService` là một **service trung gian** giúp quản lý việc hiển thị lỗi (error message) trong ứng dụng Angular, thường dùng cùng với một component hiển thị toast, snackbar, hay alert.

// Thay vì mỗi khi có lỗi thì hiển thị ngay lập tức (gây spam thông báo), service này:

// * **Gom lại nhiều lỗi liên tiếp trong một khoảng ngắn (500ms)**
// * **Gộp thành 1 thông báo duy nhất**, hiển thị gọn gàng
// * **Đảm bảo mỗi lần có lỗi khác nhau vẫn trigger UI update** nhờ `id` unique

// ---

// ### ⚙️ 2. Các thành phần chính

// | Thành phần                             | Vai trò                                                |
// | -------------------------------------- | ------------------------------------------------------ |
// | `errorInfo: Subject<IErrorInfoWithId>` | Observable stream để component khác subscribe nhận lỗi |
// | `errorQueue: string[]`                 | Danh sách message lỗi chưa gửi                         |
// | `errorTitles: string[]`                | Danh sách title lỗi chưa gửi                           |
// | `debounceTimer`                        | Dùng để trì hoãn việc phát lỗi (debounce)              |
// | `DEBOUNCE_TIME = 500`                  | Thời gian debounce 500ms                               |
// | `errorId`                              | Bộ đếm để tạo ID unique mỗi lần emit lỗi               |

// ---

// ### 🔁 3. Quy trình hoạt động

// #### ➤ Khi gọi `setShowError(obj: IErrorInfo)`

// 1. Nếu message chưa có trong queue → thêm vào `errorQueue`
// 2. Nếu title chưa có trong queue → thêm vào `errorTitles`
// 3. Reset timer debounce (nếu có)
// 4. Đặt lại `setTimeout` để sau **500ms**, gọi `flushErrors()`

// → Điều này giúp gom các lỗi liên tiếp trong 0.5 giây thành một nhóm.

// ---

// #### ➤ Khi `flushErrors()` chạy

// * Nếu không có lỗi thì return luôn.
// * Xác định `title`:

//   * Nếu có nhiều title khác nhau → đặt thành `"Có lỗi xảy ra"`
//   * Nếu chỉ có 1 → dùng title đó.
// * Gộp các message lại thành chuỗi:

//   ```
//   1. Lỗi A

//   2. Lỗi B
//   ```
// * Tăng `errorId` → đảm bảo mỗi lần emit có ID khác nhau.
// * Gọi `this.errorInfo.next({ ... })` để **phát lỗi ra cho component UI** (thường là snackbar hoặc alert component).
// * Xóa sạch queue sau khi gửi.

// ---

// #### ➤ Khi `getErrorInfo()` được gọi

// Trả về `Observable` để component subscribe:

// ```ts
// this.showErrorService.getErrorInfo().subscribe(error => {
//   this.showToast(error.title, error.message, error.icon);
// });
// ```

// ---

// #### ➤ Khi `clearError()`

// * Dọn toàn bộ queue và timer.
// * Dùng khi cần reset hoặc destroy component.

// ---

// ### 💡 4. Ưu điểm thiết kế

// ✅ Gộp lỗi lại giúp tránh spam thông báo.
// ✅ Dùng `debounce` đảm bảo hiển thị gọn gàng.
// ✅ Dùng `Subject` → dễ dàng subscribe và phản ứng trong UI.
// ✅ Dùng `errorId` → tránh tình trạng Angular không cập nhật nếu object giống nhau.
// ✅ Code rõ ràng, dễ bảo trì, dùng tốt trong các hệ thống lớn.

// ---

// Nếu bạn muốn, mình có thể giúp **viết thêm component hiển thị toast/snackbar** tương thích với service này (ví dụ dùng Angular Material `MatSnackBar` hoặc custom modal).
// Bạn muốn mình làm tiếp phần đó không?
