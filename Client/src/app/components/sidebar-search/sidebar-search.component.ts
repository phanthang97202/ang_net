import { Component } from '@angular/core';
import { NzSiderComponent } from 'ng-zorro-antd/layout';
import { IconCommonComponent } from '../../component-ui-common';
import { ButtonCommonComponent } from '../../component-ui-common';
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
