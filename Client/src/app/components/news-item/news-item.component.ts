import { Component, Input, OnInit } from '@angular/core';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { RouterModule } from '@angular/router';
import { SubString, LocalDTime, SizeImgCloudinary } from '../../pipes';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { IDetailNews } from '../../interfaces';
import { HashTagComponent } from '../hash-tag/hash-tag.component';
import { TranslateModule } from '@ngx-translate/core';

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
  ],
  templateUrl: './news-item.component.html',
  styleUrl: './news-item.component.scss',
})
export class NewsItemComponent implements OnInit {
  @Input() item!: IDetailNews;
  constructor() {}

  ngOnInit() {}
}
