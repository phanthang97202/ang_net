import { Component, inject, Input, OnInit } from '@angular/core';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { RouterModule } from '@angular/router';
import { SubString, LocalDTime, SizeImgCloudinary } from '../../pipes';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { IDetailNews } from '../../interfaces';
import { HashTagComponent } from '../hash-tag/hash-tag.component';
import { TranslateModule } from '@ngx-translate/core';
import { ScrollRevealDirective } from '../../directives';
import { LangService } from '../../services';

@Component({
  selector: 'app-news-item',
  standalone: true,
  imports: [
    NzListModule,
    NzIconModule,
    SubString,
    RouterModule,
    NzAvatarModule,
    LocalDTime,
    HashTagComponent,
    SizeImgCloudinary,
    TranslateModule,
    ScrollRevealDirective,
  ],
  templateUrl: './news-item.component.html',
  styleUrl: './news-item.component.scss',
})
export class NewsItemComponent implements OnInit {
  @Input() item!: IDetailNews;
  private langService = inject(LangService);
  constructor() {}

  ngOnInit() {}

  get title(): string {
    return this.useEnglish ? this.item.ShortTitleEn : this.item.ShortTitle;
  }

  get description(): string {
    return this.useEnglish
      ? this.item.ShortDescriptionEn
      : this.item.ShortDescription;
  }

  get readingTime(): number {
    return this.useEnglish
      ? this.item.EstimatedReadingTimeEn
      : this.item.EstimatedReadingTime;
  }

  get hashtags(): IDetailNews['LstHashTagNews'] {
    return this.useEnglish
      ? (this.item.LstHashTagNewsEn ?? [])
      : (this.item.LstHashTagNews ?? []);
  }

  private get useEnglish(): boolean {
    return (
      this.langService.getLang() === 'en' && this.item.HasEnglishTranslation
    );
  }
}
