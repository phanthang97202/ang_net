import { Pipe, PipeTransform } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { LangService } from '../services';
import { environment } from '../../environments/environment';

@Pipe({
  name: 'localeDTime',
  standalone: true,
  //// Summary
  // pure: false: Quan trọng nhất:
  // Mặc định pipe là pure: true - chỉ chạy lại khi input thay đổi
  // Đặt false để pipe chạy lại mỗi khi có thay đổi detection cycle (vì chúng ta muốn cập nhật khi ngôn ngữ thay đổi mà không thay đổi input)
  pure: false,
})
export class LocalDTime implements PipeTransform {
  private langKey = environment.langKey;
  private currentLang = 'vi';

  constructor(
    private langService: LangService,
    private cdRef: ChangeDetectorRef // Service giúp thông báo cho Angular kiểm tra lại các thay đổi
  ) {
    // Subcribe để nghe sự thay đổi
    this.langService.$langSubjectObservable.subscribe(lang => {
      this.currentLang = localStorage.getItem(this.langKey) ?? lang;
      this.cdRef.markForCheck(); // Gọi markForCheck() để thông báo Angular kiểm tra lại pipe (vì pipe là impure)
    });
  }

  transform(value: any, format: string = 'dd-mm-yy hh:mm:ss'): string {
    if (!value) return '';

    const date = new Date(value);
    const localeTypeDTime = this.currentLang === 'vi' ? 'vi-VN' : 'en-US';

    const options: Intl.DateTimeFormatOptions = {};

    // Kiểm tra format có chứa thành phần nào thì add vào options
    if (format.includes('dd')) {
      options.day = 'numeric';
    }
    if (format.includes('mm')) {
      options.month = 'short'; // hoặc '2-digit' nếu bạn muốn dạng số
    }
    if (format.includes('yy')) {
      options.year = 'numeric';
    }
    if (format.includes('hh')) {
      options.hour = '2-digit';
    }
    if (format.includes('mm') && format.includes('hh')) {
      options.minute = '2-digit';
    }
    if (format.includes('ss')) {
      options.second = '2-digit';
    }

    return date.toLocaleDateString(localeTypeDTime, options);
  }
}
