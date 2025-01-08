import { Component, inject, Input, OnInit } from '@angular/core';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { RouterModule } from '@angular/router';
import { SubString } from '../../pipes/subString.pipe';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { IDetailNews, INews } from '../../interfaces/news';
import { LocalDTime } from '../../pipes/localeDTime.pipe';

@Component({
  selector: 'news-item-sm',
  standalone: true,
  imports: [
    NzListModule,
    NzIconModule,
    SubString,
    RouterModule,
    NzAvatarModule,
    LocalDTime,
  ],
  templateUrl: './news-item-sm.component.html',
  styleUrl: './news-item-sm.component.scss',
})
export class NewsItemSmComponennt implements OnInit {
  @Input() item!: IDetailNews;
  constructor() {}

  ngOnInit() {}
}
