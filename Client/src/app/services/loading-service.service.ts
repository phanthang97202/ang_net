import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private activeRequests = 0;

  // Đếm số request đang chạy thay vì ghi đè 1 boolean dùng chung, vì nhiều
  // component độc lập (vd DetailNewsComponent + AsideNewsComponent) có thể
  // cùng gọi setLoading() song song - nếu chỉ dùng boolean, request nào
  // xong trước sẽ tắt loading dù các request khác vẫn đang chạy.
  setLoading(isLoading: boolean) {
    this.activeRequests = Math.max(
      0,
      this.activeRequests + (isLoading ? 1 : -1)
    );
    this.loadingSubject.next(this.activeRequests > 0);
  }

  getLoading(): Observable<boolean> {
    // return this.loadingSubject.getValue();
    return this.loadingSubject.asObservable();
  }
}
