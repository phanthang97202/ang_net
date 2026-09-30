import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { IDetailNews } from '../../interfaces';
import { ScrollRevealDirective } from '../../directives';
import { LangService } from '../../services';

@Component({
  selector: 'app-news-card',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TranslateModule,
    NzIconModule,
    ScrollRevealDirective,
  ],
  templateUrl: './news-card.component.html',
  styleUrl: './news-card.component.scss',
})
export class NewsCardComponent {
  @Input({ required: true }) post!: IDetailNews;
  @Input() refreshing = false;
  @Input() revealDelay = 0;
  @Input() placeholderColor = '#5b4fe9';

  private langService = inject(LangService);

  get categoryName(): string {
    return this.useEnglish && this.post.CategoryNewsNameEn
      ? this.post.CategoryNewsNameEn
      : this.post.CategoryNewsName;
  }

  get title(): string {
    return this.useEnglish ? this.post.ShortTitleEn : this.post.ShortTitle;
  }

  get description(): string {
    return this.useEnglish
      ? this.post.ShortDescriptionEn
      : this.post.ShortDescription;
  }

  get readingTime(): number {
    return this.useEnglish
      ? this.post.EstimatedReadingTimeEn
      : this.post.EstimatedReadingTime;
  }

  get hashtags(): IDetailNews['LstHashTagNews'] {
    return this.useEnglish
      ? (this.post.LstHashTagNewsEn ?? [])
      : (this.post.LstHashTagNews ?? []);
  }

  formatCount(value: number): string {
    if (!value) return '0';
    if (value < 1000) return `${value}`;
    const thousands = value / 1000;
    const rounded =
      thousands < 10
        ? thousands.toFixed(1).replace(/\.0$/, '')
        : Math.round(thousands);
    return `${rounded}k`;
  }

  private get useEnglish(): boolean {
    return (
      this.langService.getLang() === 'en' && this.post.HasEnglishTranslation
    );
  }
}
