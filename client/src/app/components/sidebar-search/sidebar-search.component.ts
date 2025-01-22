import { Component } from '@angular/core';
import { NzSiderComponent } from 'ng-zorro-antd/layout';
import { IconCommonComponent } from '../../component-ui-common/icon-common/icon-common.component';
import { ButtonCommonComponent } from '../../component-ui-common/button-common/button-common.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar-search',
  standalone: true,
  imports: [
    IconCommonComponent,
    ButtonCommonComponent,
    CommonModule,
    NzSiderComponent,
  ],
  templateUrl: './sidebar-search.component.html',
  styleUrl: './sidebar-search.component.scss',
})
export class SidebarSearchComponent {}
