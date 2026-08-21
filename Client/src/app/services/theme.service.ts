import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

export type AppTheme = 'light' | 'dark';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private themeKey = environment.themeKey;
  private _themeSubject = new BehaviorSubject<AppTheme>(this.readStoredTheme());
  public theme$ = this._themeSubject.asObservable();

  private readStoredTheme(): AppTheme {
    return localStorage.getItem(this.themeKey) === 'dark' ? 'dark' : 'light';
  }

  getTheme(): AppTheme {
    return this._themeSubject.getValue();
  }

  // Áp lại data-theme lên <html> lúc app khởi động, vì index.html chỉ set
  // trước khi Angular bootstrap để tránh flash sai theme, còn state của
  // service (BehaviorSubject) vẫn cần đồng bộ với localStorage.
  init(): void {
    document.documentElement.setAttribute('data-theme', this.getTheme());
  }

  setTheme(theme: AppTheme): void {
    localStorage.setItem(this.themeKey, theme);
    document.documentElement.setAttribute('data-theme', theme);
    this._themeSubject.next(theme);
  }

  toggleTheme(): void {
    this.setTheme(this.getTheme() === 'dark' ? 'light' : 'dark');
  }

  // Dark mode chỉ áp cho các trang user-facing (trang chủ, bài viết, công
  // cụ...). Ngoài phạm vi đó (login, dashboard/admin) luôn ép về 'light'
  // trên DOM dù localStorage vẫn lưu đúng lựa chọn 'dark' của người dùng -
  // tránh input/table của NG-ZORRO ở các trang đó bị dính nền tối dù
  // chúng không có nút toggle hay style tương ứng.
  applyForLayout(isUserFacing: boolean): void {
    const theme = isUserFacing ? this.getTheme() : 'light';
    document.documentElement.setAttribute('data-theme', theme);
  }
}
