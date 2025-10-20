import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import {
  ActivatedRoute,
  Router,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { AuthService } from '../../services';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { SwitchLangComponent } from '../switch-lang/switch-lang.component';
import { TranslateModule } from '@ngx-translate/core';
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    NzMenuModule, // ✅ chỉ cần cái này
    NzIconModule,
    NzButtonComponent,
    NzPopoverModule,
    NzAvatarModule,
    SwitchLangComponent,
    TranslateModule,
  ],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit {
  authService = inject(AuthService);
  activeRoute = false;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {}

  listRoute = [
    { path: '/', title: 'Home', icon: 'home', isActive: false },
    {
      // path: '/tools',
      title: 'Tools',
      icon: 'tool',
      children: [
        {
          path: '/tools/calculating-hotel-fee',
          title: 'CalculatingHotelFee',
          icon: 'calculator',
          isActive: false,
        },
        {
          path: '/tools/shift-report',
          title: 'ShiftReport',
          icon: 'file-text',
          isActive: false,
        },
      ],
    },
    { path: '/about', title: 'AboutMe', icon: 'user', isActive: false },
  ];

  ngOnInit() {
    this.listRoute.map(item => {
      return {
        ...item,
        isActive: item.path === this.activatedRoute.snapshot.url.join('/'),
      };
    });
  }

  handleNavigateLogin() {
    this.router.navigate(['/login']);
  }

  handleLogout() {
    this.authService.logout();
  }
}
