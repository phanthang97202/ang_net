import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { environment } from '../../../environments/environment';
import { LangService } from '../../services';

@Component({
  standalone: true,
  selector: 'app-switch-lang',
  imports: [CommonModule, NzTagModule],
  templateUrl: './switch-lang.component.html',
  styleUrl: './switch-lang.component.scss',
})
export class SwitchLangComponent {
  private langKey = environment.langKey;
  currentLang = localStorage.getItem(this.langKey) ?? 'vi';

  constructor(private langService: LangService) {}

  toggleLanguage(): void {
    //debugger;
    const lang = localStorage.getItem(this.langKey) === 'vi' ? 'en' : 'vi';
    this.langService.setLang(lang);
    this.currentLang = lang;

    // this.translate.use(this.currentLang);
    // localStorage.setItem(this.langKey, lang);
  }
}
