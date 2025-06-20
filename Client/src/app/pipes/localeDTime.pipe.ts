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

  transform(value: any): string {
    if (!value) return '';

    const date = new Date(value);
    const localeTypeDTime = this.currentLang === 'vi' ? 'vi-VN' : 'en-US';

    return date.toLocaleDateString(localeTypeDTime, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
}
