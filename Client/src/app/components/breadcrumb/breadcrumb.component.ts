import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { IButtonBreadcrumb } from '../../interfaces/common';
import { ButtonCommonComponent } from '../../component-ui-common/button-common/button-common.component';

@Component({
  standalone: true,
  selector: 'app-breadcrumb',
  imports: [
    NzModalModule,
    NzUploadModule,
    NzButtonModule,
    NzIconModule,
    CommonModule,
    NzPageHeaderModule,
    NzSpaceModule,
    ButtonCommonComponent,
  ],
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.scss'],
})
export class BreadcrumbComponent {
  @Input() buttons: IButtonBreadcrumb[] = [];
}
