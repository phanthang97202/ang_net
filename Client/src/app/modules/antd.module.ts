import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// NG-ZORRO Modules
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { ReactiveFormsModule } from '@angular/forms';
import { NzMentionModule } from 'ng-zorro-antd/mention';
import { NzCascaderModule } from 'ng-zorro-antd/cascader';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import { RouterModule, RouterOutlet } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import {
  // NzContentComponent,
  // NzFooterComponent,
  // NzHeaderComponent,
  NzLayoutModule,
  // NzSiderComponent,
} from 'ng-zorro-antd/layout';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
// import { FooterComponent } from '../components/footer/footer.component';
// ... import tất cả module bạn cần

const ZORRO_MODULES = [
  NzFormModule,
  NzButtonModule,
  NzUploadModule,
  NzIconModule,
  NzDatePickerModule,
  NzModalModule,
  CommonModule,
  ReactiveFormsModule,
  NzInputModule,
  NzMentionModule,
  NzCascaderModule,
  NzSelectModule,
  NzTreeSelectModule,
  NzTableModule,
  NzTagModule,
  NzBreadCrumbModule,
  NzPageHeaderModule,
  NzSpaceModule,
  NzLayoutModule,
  NzSwitchModule,
  NzGridModule,
  NzPopconfirmModule,
  NzTypographyModule,
  NzListModule,
  NzCheckboxModule,
  NzAlertModule,
  // NzHeaderComponent,
  //   NzContentComponent,
  NzBreadCrumbModule,
  // NzFooterComponent,
  // FooterComponent,
  // NzSiderComponent,
];

const ROUTE_MODULES = [RouterOutlet, RouterModule];

const PIPE_MODULES = [TranslateModule];

// const GROUP = []
@NgModule({
  declarations: [],
  imports: [...ZORRO_MODULES, ...ROUTE_MODULES, ...PIPE_MODULES],
  exports: [...ZORRO_MODULES, ...ROUTE_MODULES, ...PIPE_MODULES],
})
export class AntdModule {}
