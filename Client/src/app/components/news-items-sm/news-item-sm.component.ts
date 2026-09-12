import { Component, Input, OnInit } from '@angular/core';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { RouterModule } from '@angular/router';
import { SubString, LocalDTime, SizeImgCloudinary } from '../../pipes';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { INewsItemSm } from '../../interfaces';
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
  // Khai kiểu hẹp nhất mà template thực sự dùng: IDetailNews vẫn truyền vào
  // được như cũ (thoả đủ các trường), mà khối xem trước theo danh mục - vốn chỉ
  // lấy về 6 trường - cũng dùng lại được component này.
  @Input() item!: INewsItemSm;
  constructor() {}

  ngOnInit() {}
}
