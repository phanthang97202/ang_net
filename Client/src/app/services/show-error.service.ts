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
