import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root',
})
export class LangService {
  private langKey = environment.langKey;
  private loadingSubject = new BehaviorSubject<string>('vi');

  constructor(private translate: TranslateService) {}

  getLang(): string {
    let defaultLang = localStorage.getItem(this.langKey);
    if (!defaultLang) {
      defaultLang = 'vi';
      localStorage.setItem(this.langKey, 'vi');
    }
    return defaultLang;
  }

  setLang(lang: string): void {
    this.translate.use(lang);
    localStorage.setItem(this.langKey, lang);
    this.loadingSubject.next(lang);
  }
}
