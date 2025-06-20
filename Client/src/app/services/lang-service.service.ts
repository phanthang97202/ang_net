import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root',
})
export class LangService {
  private langKey = environment.langKey;
  private _loadingSubject = new BehaviorSubject<'vi' | 'en'>('vi'); // đặt public để service khác khi inject có thể gọi đến được property này => Cực nguy hiểm (không dùng)

  //// Khuyến nghị
  // asObservable() biến Subject thành Observable thông thường
  // Bên ngoài chỉ có thể subscribe, không thể gọi .next()
  // Đảm bảo tính đóng gói (encapsulation)
  public $langSubjectObservable = this._loadingSubject.asObservable(); //

  constructor(private translate: TranslateService) {}

  getLang(): string {
    let defaultLang = localStorage.getItem(this.langKey);
    if (!defaultLang) {
      defaultLang = 'vi';
      localStorage.setItem(this.langKey, 'vi');
    }
    return defaultLang;
  }

  setLang(lang: 'vi' | 'en'): void {
    this.translate.use(lang);
    localStorage.setItem(this.langKey, lang);
    this._loadingSubject.next(lang);
  }
}

// Trong RxJS (thư viện reactive programming của Angular), có **4 loại Subject chính** mà bạn cần biết, mỗi loại có đặc điểm và cách sử dụng khác nhau:

// ## 1. **Subject**
// - **Đặc điểm**:
//   - Chỉ phát ra giá trị cho những subscriber đã đăng ký **từ thời điểm subscription trở đi**
//   - Không lưu trữ giá trị trước đó
//   - Khi subscribe, bạn không nhận được giá trị đã phát trước đó
// - **Use case**: Khi chỉ quan tâm đến các sự kiện từ thời điểm subscribe
// ```typescript
// const subject = new Subject<string>();
// subject.next('Hello'); // Subscriber lúc này chưa nhận được

// subject.subscribe(val => console.log(val)); // Đăng ký
// subject.next('World'); // Subscriber nhận được 'World'
// ```

// ---

// ## 2. **BehaviorSubject**
// - **Đặc điểm**:
//   - Luôn **lưu giá trị cuối cùng** và phát ngay cho subscriber mới
//   - Cần khởi tạo với giá trị mặc định
// - **Use case**: Dùng cho trạng thái cần biết giá trị hiện tại ngay lập tức (ví dụ: ngôn ngữ hiện tại, theme)
// ```typescript
// const behaviorSubject = new BehaviorSubject<string>('vi'); // Giá trị mặc định 'vi'

// behaviorSubject.subscribe(lang => console.log(lang)); // Ngay lập tức nhận 'vi'

// behaviorSubject.next('en'); // Tất cả subscriber nhận 'en'
// ```

// ---

// ## 3. **ReplaySubject**
// - **Đặc điểm**:
//   - Lưu trữ và phát lại **một số lượng giá trị cũ** cho subscriber mới (tùy cấu hình)
//   - Không cần giá trị mặc định
// - **Use case**: Khi cần lịch sử các giá trị trước đó (ví dụ: undo/redo, log lỗi)
// ```typescript
// const replaySubject = new ReplaySubject(2); // Lưu 2 giá trị gần nhất

// replaySubject.next('A');
// replaySubject.next('B');
// replaySubject.next('C');

// replaySubject.subscribe(val => console.log(val)); // Nhận ngay ['B', 'C']
// ```

// ---

// ## 4. **AsyncSubject**
// - **Đặc điểm**:
//   - Chỉ phát **giá trị cuối cùng** khi complete()
//   - Subscriber chỉ nhận giá trị nếu subscribe trước khi complete
// - **Use case**: Xử lý kết quả cuối cùng của async operation (ví dụ: HTTP request)
// ```typescript
// const asyncSubject = new AsyncSubject<string>();

// asyncSubject.subscribe(val => console.log(val)); // Đăng ký trước khi complete

// asyncSubject.next('Tạm thời không nhận');
// asyncSubject.next('Vẫn chưa nhận');
// asyncSubject.complete(); // Lúc này subscriber nhận giá trị cuối cùng
// ```

// ---

// ## So sánh nhanh
// | Loại              | Lưu giá trị? | Phát lại giá trị cũ? | Cần giá trị mặc định? |
// |-------------------|-------------|---------------------|----------------------|
// | `Subject`         | ❌          | ❌                  | ❌                   |
// | `BehaviorSubject` | ✅ (1)      | ✅ (chỉ cuối cùng)  | ✅                   |
// | `ReplaySubject`   | ✅ (n)      | ✅ (tùy cấu hình)   | ❌                   |
// | `AsyncSubject`    | ✅ (1)      | ✅ (chỉ khi complete)| ❌                   |

// ---

// ## Khi nào dùng gì?
// 1. **LangService** (ví dụ của bạn):
//    Nên dùng **`BehaviorSubject`** vì:
//    - Cần biết ngôn ngữ hiện tại ngay khi subscribe
//    - Luôn có giá trị mặc định (ví dụ: `'vi'`)

// 2. **Tracking user actions**:
//    Dùng **`ReplaySubject`** để lưu lại 5 hành động gần nhất.

// 3. **One-time events**:
//    Dùng **`Subject`** cho sự kiện như "click nút logout".

// 4. **HTTP request result**:
//    Dùng **`AsyncSubject`** nếu chỉ quan tâm kết quả cuối cùng khi hoàn thành.

// ---

// ## Ví dụ thực tế trong Angular Service
// ```typescript
// @Injectable({ providedIn: 'root' })
// export class ThemeService {
//   // BehaviorSubject vì luôn có theme mặc định
//   private _theme = new BehaviorSubject<'light' | 'dark'>('light');
//   theme$ = this._theme.asObservable(); // Public Observable

//   setTheme(theme: 'light' | 'dark') {
//     this._theme.next(theme);
//   }
// }

// // Component subscribe
// constructor(private themeService: ThemeService) {
//   themeService.theme$.subscribe(theme => {
//     console.log('Theme changed to:', theme); // Nhận ngay giá trị hiện tại khi subscribe
//   });
// }
