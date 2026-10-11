import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { IHashTagNews } from '../../interfaces';

@Component({
  selector: 'app-hot-keywords',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule, NzIconModule],
  templateUrl: './hot-keywords.component.html',
  styleUrl: './hot-keywords.component.scss',
})
export class HotKeywordsComponent {
  @Input() tags: IHashTagNews[] = [];
  @Input() loading = false;
}
