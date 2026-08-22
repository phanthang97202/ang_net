import { ChangeDetectorRef, Pipe, PipeTransform } from '@angular/core';
import { formatDistanceToNow } from 'date-fns';
import { enUS, vi } from 'date-fns/locale';
import { LangService } from '../services';
import { environment } from '../../environments/environment';

@Pipe({
  name: 'timeAgo',
  standalone: true,
  // pure: false vì 2 lý do: đồng hồ luôn chạy nên cùng một input phải cho ra
  // kết quả khác theo thời gian, và cần cập nhật lại khi đổi ngôn ngữ.
  pure: false,
})
export class TimeAgo implements PipeTransform {
  private langKey = environment.langKey;
  private currentLang = 'vi';

  constructor(
    private langService: LangService,
    private cdRef: ChangeDetectorRef
  ) {
    this.langService.$langSubjectObservable.subscribe(lang => {
      this.currentLang = localStorage.getItem(this.langKey) ?? lang;
      this.cdRef.markForCheck();
    });
  }

  transform(value: string | Date | null | undefined): string {
    if (!value) return '';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    return formatDistanceToNow(date, {
      addSuffix: true,
      locale: this.currentLang === 'vi' ? vi : enUS,
    });
  }
}
