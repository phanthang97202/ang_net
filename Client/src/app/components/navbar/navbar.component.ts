import { CommonModule } from '@angular/common';
import { Component, inject, NgZone, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';

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
    FormsModule,
    RouterLink,
    RouterLinkActive,
    NzMenuModule,
    NzIconModule,
    NzButtonComponent,
    NzPopoverModule,
    NzAvatarModule,
    SwitchLangComponent,
    ThemeToggleComponent,
    TranslateModule,
  ],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);
  isMobileMenuOpen = false;
  isSearchOpen = false;
  searchKeyword = '';

  // Ở đầu trang navbar để trong suốt; chỉ khi nội dung bắt đầu chui xuống dưới
  // nó mới cần nền kính để chữ không chồng lên nhau.
  isScrolled = false;

  private zone = inject(NgZone);

  // Chạy ngoài zone của Angular: sự kiện scroll bắn liên tục, để trong zone là
  // mỗi lần cuộn lại kích hoạt một vòng change detection toàn app. Chỉ quay lại
  // zone đúng lúc vượt ngưỡng, tức là rất hiếm.
  private readonly onWindowScroll = () => {
    const scrolled = window.scrollY > 8;
    if (scrolled === this.isScrolled) return;
    this.zone.run(() => (this.isScrolled = scrolled));
  };

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
    { path: '/reels', title: 'Reels', icon: 'play-circle' },
    // Tạm ẩn cùng route /about (xem app.routes.ts)
    // { path: '/about', title: 'AboutMe', icon: 'user' },
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

    this.zone.runOutsideAngular(() =>
      window.addEventListener('scroll', this.onWindowScroll, { passive: true })
    );
    // Tải lại trang khi đang ở giữa bài viết thì scrollY đã khác 0 sẵn.
    this.onWindowScroll();
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.onWindowScroll);
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

  // ── Search popup ─────────────────────────────────────
  toggleSearch(): void {
    this.isSearchOpen = !this.isSearchOpen;
  }

  closeSearch(): void {
    this.isSearchOpen = false;
  }

  handleSearch(): void {
    const keyword = this.searchKeyword.trim();
    if (!keyword) {
      return;
    }
    this.router.navigate(['/news'], { queryParams: { keyword } });
    this.searchKeyword = '';
    this.isSearchOpen = false;
    this.isMobileMenuOpen = false;
  }

  // ── Auth ─────────────────────────────────────────────
  handleNavigateLogin(): void {
    this.router.navigate(['/login']);
  }

  handleLogout(): void {
    this.authService.logout();
  }
}
