import { Component, inject, Input, OnInit } from '@angular/core';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { RouterModule } from '@angular/router';
import { SubString } from '../../pipes/subString.pipe';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { IDetailNews, INews } from '../../interfaces/news';
import { LocalDTime } from '../../pipes/localeDTime.pipe';
import { HashTagComponennt } from '../hash-tag/hash-tag.component';

@Component({
  selector: 'news-item',
  standalone: true,
  imports: [
    NzListModule,
    NzIconModule,
    SubString,
    RouterModule,
    NzAvatarModule,
    LocalDTime,
    HashTagComponennt,
  ],
  templateUrl: './news-item.component.html',
  styleUrl: './news-item.component.scss',
})
export class NewsItemComponennt implements OnInit {
  @Input() item!: IDetailNews;
  constructor() {}

  ngOnInit() {}
}
