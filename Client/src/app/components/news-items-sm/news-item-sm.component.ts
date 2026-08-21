import { Component, Input, OnInit } from '@angular/core';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { RouterModule } from '@angular/router';
import { SubString, LocalDTime, SizeImgCloudinary } from '../../pipes';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { IDetailNews } from '../../interfaces';
import { ScrollRevealDirective } from '../../directives';

@Component({
  selector: 'app-news-item-sm',
  standalone: true,
  imports: [
    NzListModule,
    NzIconModule,
    SubString,
    RouterModule,
    NzAvatarModule,
    LocalDTime,
    SizeImgCloudinary,
    ScrollRevealDirective,
  ],
  templateUrl: './news-item-sm.component.html',
  styleUrl: './news-item-sm.component.scss',
})
export class NewsItemSmComponent implements OnInit {
  @Input() item!: IDetailNews;
  constructor() {}

  ngOnInit() {}
}
