import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { IErrorInfo } from '../interfaces/error-info';

@Injectable({
  providedIn: 'root',
})
export class ShowErrorService {
  private errorInfo = new BehaviorSubject<IErrorInfo>({
    title: '',
    icon: '',
    message: '',
  });

  // Thực hiện bắn dữ liệu
  setShowError(obj: IErrorInfo) {
    this.errorInfo.next({
      title: obj.title,
      icon: obj.icon,
      message: obj.message,
    });
  }

  // Export subject để đọc
  getErrorInfo(): Observable<IErrorInfo> {
    return this.errorInfo.asObservable();
  }
}
