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
import { ApiService, AuthService, LangService } from '../../services';
import { ISysMenuTree } from '../../interfaces';
import { SwitchLangComponent } from '../switch-lang/switch-lang.component';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';
import { Subscription } from 'rxjs';

interface RouteItem {
  path?: string;
  // Tham số query tách riêng khỏi path: routerLink coi cả chuỗi là một đoạn
  // đường dẫn nên "?" và "=" bị mã hoá thành %3F/%3D, link thành vô nghĩa.
  queryParams?: Record<string, string>;
  // Link ra ngoài site (http://, https://, mailto:, tel:...). routerLink chỉ
  // điều hướng trong ứng dụng nên những link này phải render bằng <a href>
  // thường - xem splitPath().
  externalUrl?: string;
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

  // Menu dự phòng, dùng khi API menu lỗi hoặc chưa có dữ liệu (bảng SysMenu chưa
  // được migrator tạo/seed). Không có nó thì một lỗi API là trang chủ mất sạch
  // menu - hỏng nặng hơn hẳn so với việc hiện menu hơi cũ.
  //
  // Tiêu đề ở đây là khóa i18n (template cũ render 'T_' + title), khác với menu
  // lấy từ API vốn đã là chữ hiển thị sẵn - xem titleOf().
  private readonly fallbackRoute: RouteItem[] = [
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
    {
      title: 'Game',
      icon: 'trophy',
      children: [
        { path: '/game/chess', title: 'Chess', icon: 'appstore' },
      ],
    },
    // Tạm ẩn cùng route /about (xem app.routes.ts)
    // { path: '/about', title: 'AboutMe', icon: 'user' },
  ];

  // Menu đang hiển thị. Khởi tạo bằng bản dự phòng để lần vẽ đầu tiên đã có nội
  // dung, rồi thay bằng dữ liệu API khi tải xong.
  listRoute: RouteItem[] = this.fallbackRoute;

  // Menu lấy từ API là chữ hiển thị sẵn (TitleVi/TitleEn) chứ không phải khóa
  // i18n, nên template phải biết đang dùng nguồn nào để render cho đúng.
  isMenuFromApi = false;

  private menuTree: ISysMenuTree[] = [];
  private api = inject(ApiService);
  private langService = inject(LangService);
  private langSub?: Subscription;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.fetchMenu();

    // Menu từ API lưu sẵn chữ Việt và chữ Anh, không qua i18n - nên đổi ngôn ngữ
    // phải tự dựng lại danh sách, khác với menu dự phòng (translate pipe tự lo).
    this.langSub = this.langService.$langSubjectObservable.subscribe(() => {
      if (this.isMenuFromApi) {
        this.listRoute = this.toRouteItems(this.menuTree);
      }
    });

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
    this.langSub?.unsubscribe();
  }

  /**
   * Nhãn hiển thị của một mục menu.
   *
   * Hai nguồn menu có dạng tiêu đề khác nhau: bản dự phòng dùng khóa i18n (Home
   * -> T_HOME), còn bản từ API đã là chữ hiển thị sẵn. Gom về một chỗ để template
   * khỏi phải rẽ nhánh ở cả bốn nơi render (desktop/mobile, cha/con).
   */
  titleOf(route: RouteItem): string {
    return route.title;
  }

  private fetchMenu(): void {
    this.api.SysMenuGetActive().subscribe({
      next: response => {
        const tree = response?.DataList || [];

        // Rỗng thì giữ menu dự phòng: bảng SysMenu có thể chưa được migrator tạo
        // hoặc chưa seed, lúc đó thà hiện menu cũ còn hơn trang chủ trống trơn.
        if (!response?.Success || tree.length === 0) {
          return;
        }

        this.menuTree = tree;
        this.listRoute = this.toRouteItems(tree);
        this.isMenuFromApi = true;
      },
      // Nuốt lỗi có chủ đích: API menu hỏng thì vẫn còn menu dự phòng.
      error: () => undefined,
    });
  }

  private toRouteItems(tree: ISysMenuTree[]): RouteItem[] {
    const isVi = this.langService.getLang() !== 'en';

    const toItem = (m: ISysMenuTree): RouteItem => {
      const { path, queryParams, externalUrl } = this.splitPath(m.Path);

      return {
        // Menu cha chỉ làm nhóm xổ xuống thì Path rỗng -> để undefined cho
        // routerLink khỏi điều hướng về '/'.
        path,
        queryParams,
        externalUrl,
        title: (isVi ? m.TitleVi : m.TitleEn) || m.TitleVi,
        icon: m.Icon,
        children: m.Children?.length ? m.Children.map(toItem) : undefined,
      };
    };

    return tree.map(toItem);
  }

  /**
   * Tách "/news?categoryId=girl" thành path "/news" và { categoryId: 'girl' }.
   *
   * routerLink coi cả chuỗi là MỘT đoạn đường dẫn, nên để nguyên thì "?" và "="
   * bị mã hoá thành %3F/%3D - ra href="/news%3FcategoryId%3Dgirl", bấm vào không
   * đi đâu cả. Tham số query phải truyền riêng qua [queryParams].
   */
  private splitPath(raw: string): {
    path?: string;
    queryParams?: Record<string, string>;
    externalUrl?: string;
  } {
    if (!raw) {
      return {};
    }

    // Link ra ngoài site thì giữ nguyên cả chuỗi: routerLink chỉ điều hướng
    // trong ứng dụng, đưa "https://..." vào nó sẽ thành đường dẫn nội bộ
    // "/https:%2F%2F..." - bấm vào rơi vào wildcard rồi về trang chủ.
    //
    // Nhận cả mailto:/tel: vì menu có thể trỏ tới email hay số điện thoại.
    // KHÔNG nhận javascript: - đường dẫn này do người quản trị nhập vào DB, để
    // lọt thì một tài khoản quản trị bị chiếm là chạy được mã tuỳ ý trên trang.
    if (/^(https?:\/\/|mailto:|tel:)/i.test(raw)) {
      return { externalUrl: raw };
    }

    const [path, queryString] = raw.split('?');

    if (!queryString) {
      return { path, queryParams: undefined };
    }

    const queryParams: Record<string, string> = {};
    new URLSearchParams(queryString).forEach((value, key) => {
      queryParams[key] = value;
    });

    return { path, queryParams };
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
