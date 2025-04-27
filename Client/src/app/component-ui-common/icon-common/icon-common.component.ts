import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzUploadModule } from 'ng-zorro-antd/upload';

@Component({
  standalone: true,
  selector: 'app-icon-common',
  imports: [
    NzModalModule,
    NzUploadModule,
    NzButtonModule,
    NzIconModule,
    CommonModule,
    NzPageHeaderModule,
    NzSpaceModule,
  ],
  templateUrl: './icon-common.component.html',
  styleUrls: ['./icon-common.component.scss'],
})
export class IconCommonComponent {
  // @Input() props: IIconCommon = { iconType: 'plus' };

  @Input() class = '';
  @Input() iconType = '';
  @Input() iconTheme: 'fill' | 'outline' | 'twotone' = 'outline';
  @Input() iconSpin = false;
  @Input() iconTwotoneColor = '';
  @Input() iconIconfont = '';
  @Input() iconRotate = 0;
}
