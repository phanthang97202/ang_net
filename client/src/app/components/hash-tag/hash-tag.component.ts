import { Component, inject, Input, OnInit } from '@angular/core';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { RouterModule } from '@angular/router';
import { SubString } from '../../pipes/subString.pipe';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { IDetailNews, INews } from '../../interfaces/news';
import { LocalDTime } from '../../pipes/localeDTime.pipe';

@Component({
  selector: 'hash-tag',
  standalone: true,
  imports: [],
  templateUrl: './hash-tag.component.html',
  styleUrl: './hash-tag.component.scss',
})
export class HashTagComponennt implements OnInit {
  @Input() title!: string;
  constructor() {}

  ngOnInit() {}
}
