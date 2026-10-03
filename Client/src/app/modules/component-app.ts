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
  NavbarComponent,
  ErrorPopupComponent,
  SwitchLangComponent,
  TagStatusComponent,
  NewsContentComponent,
  NewsTocListComponent,
  ArticleRailComponent,
  FooterComponent,
  DiscoveryBannerComponent,
  TopicNavComponent,
  CategoryShowcaseComponent,
  HotTopicPostsComponent,
  FeaturedNewsComponent,
  NewNewsComponent,
  SubscribeNotifyComponent,
  HomeSidebarComponent,
  SpinnerComponent,
} from '../components';
import { AsideNewsComponent } from '../pages/home/aside-news/aside-news.component';
import { SaveProvincePopupComponent } from '../pages/dashboard/mst-province/save-province-popup/save-province-popup.component';
import { ScrollRevealDirective } from '../directives';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { RouterLink } from '@angular/router';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import {
  NzContentComponent,
  NzFooterComponent,
  NzHeaderComponent,
  NzSiderComponent,
} from 'ng-zorro-antd/layout';

export const REUSE_COMPONENT_MODULES = [
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
  FeaturedNewsComponent,
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
  ArticleRailComponent,
  DiscoveryBannerComponent,
  TopicNavComponent,
  CategoryShowcaseComponent,
  HotTopicPostsComponent,
  NewNewsComponent,
  SubscribeNotifyComponent,
  HomeSidebarComponent,
  SpinnerComponent,
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

  //
  NzHeaderComponent,
  NzContentComponent,
  NzFooterComponent,
  FooterComponent,
  NzSiderComponent,
  //
  ScrollRevealDirective,
];
