import { NzCardModule } from 'ng-zorro-antd/card';
import {
  ButtonCommonComponent,
  IconCommonComponent,
  UploadCommonComponent,
} from '../component-ui-common';
import {
  AssignRoleComponent,
  BreadcrumbComponent,
  ChatBoxComponent,
  CreateRoleComponent,
  HashTagComponent,
  ImportExcelPopupComponent,
  NewsItemComponent,
  NewsItemSmComponent,
  PaginationComponent,
  SidebarSearchComponent,
  TextEditorComponent,
  NavbarComponent,
  ErrorPopupComponent,
  SwitchLangComponent,
  TagStatusComponent,
  NewsContentComponent,
  NewsTocListComponent,
} from '../components';
import { SaveProvincePopupComponent, AsideNewsComponent } from '../pages';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { RouterLink } from '@angular/router';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';

export const REUSE_COMPONENT_MODULES = [
  TextEditorComponent,
  ChatBoxComponent,
  UploadCommonComponent,
  IconCommonComponent,
  ImportExcelPopupComponent,
  SaveProvincePopupComponent,
  BreadcrumbComponent,
  ButtonCommonComponent,
  SidebarSearchComponent,
  CreateRoleComponent,
  AssignRoleComponent,
  PaginationComponent,
  NewsItemComponent,
  AsideNewsComponent,
  NewsItemSmComponent,
  HashTagComponent,
  NzSkeletonModule,
  NavbarComponent,
  ErrorPopupComponent,
  SwitchLangComponent,
  TagStatusComponent,
  NewsContentComponent,
  NewsTocListComponent,
  // Một số module đặc biệt của antd
  NzSpinModule,
  NzCardModule,
  NzCardModule,
  NzDescriptionsModule,
  NzPopconfirmModule,
  NzMenuModule,
  NzDropDownModule,
  NzAvatarModule,
  //
  RouterLink,
];
