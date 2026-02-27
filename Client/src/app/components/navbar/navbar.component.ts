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
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../services';
import { SwitchLangComponent } from '../switch-lang/switch-lang.component';

interface RouteItem {
  path?: string;
  title: string;
  icon: string;
  isActive?: boolean;
  children?: RouteItem[];
  _open?: boolean; // desktop hover dropdown
  _mobileOpen?: boolean; // mobile accordion
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    NzMenuModule,
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
  isMobileMenuOpen = false;

  listRoute: RouteItem[] = [
    { path: '/', title: 'Home', icon: 'home' },
    {
      title: 'Tools',
      icon: 'tool',
      children: [
        {
          path: '/tools/calculating-hotel-fee',
          title: 'CalculatingHotelFee',
          icon: 'calculator',
        },
        {
          path: '/tools/shift-report',
          title: 'ShiftReport',
          icon: 'file-text',
        },
        {
          path: '/tools/revenue-report',
          title: 'RevenueShiftReport',
          icon: 'dollar',
        },
      ],
    },
    { path: '/about', title: 'AboutMe', icon: 'user' },
  ];

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // mark active based on current url (optional enhancement)
    const currentPath = '/' + this.activatedRoute.snapshot.url.join('/');
    this.listRoute = this.listRoute.map(route => ({
      ...route,
      isActive: route.path === currentPath,
    }));
  }

  // ── Mobile menu ──────────────────────────────────────
  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  toggleMobileSubmenu(route: RouteItem): void {
    route._mobileOpen = !route._mobileOpen;
  }

  // ── Desktop dropdown (hover) ─────────────────────────
  openDropdown(route: RouteItem): void {
    route._open = true;
  }

  closeDropdown(route: RouteItem): void {
    route._open = false;
  }

  // Check if any child route is active (for parent highlight)
  isRouteActive(route: RouteItem): boolean {
    if (!route.children) return false;
    return route.children.some(child =>
      child.path ? this.router.isActive(child.path, false) : false
    );
  }

  // ── Auth ─────────────────────────────────────────────
  handleNavigateLogin(): void {
    this.router.navigate(['/login']);
  }

  handleLogout(): void {
    this.authService.logout();
  }
}
