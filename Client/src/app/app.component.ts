import { Component, HostListener, inject, OnInit } from '@angular/core';
import { Event, NavigationEnd, Router } from '@angular/router';
import {
  LoadingService,
  ShowErrorService,
  AuthService,
  LangService,
  VisitTrackingService,
  ThemeService,
} from './services';
import { asapScheduler, filter, Observable, observeOn } from 'rxjs';
import { IErrorInfo } from './interfaces';
import { LayoutType } from './types';
import posthog from 'posthog-js';
import { TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NavbarComponent } from './components/navbar/navbar.component';
import { FooterComponent } from './components/footer/footer.component';
import { ErrorPopupComponent } from './components/error-popup/error-popup.component';
import { SpinnerComponent } from './components/spinner/spinner.component';
import { SwitchLangComponent } from './components/switch-lang/switch-lang.component';
import { ChatWidgetComponent } from './components/chat-box/chat-widget.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    NzLayoutModule,
    NzMenuModule,
    NzButtonModule,
    NzIconModule,
    NzToolTipModule,
    NavbarComponent,
    FooterComponent,
    ErrorPopupComponent,
    SpinnerComponent,
    SwitchLangComponent,
    ChatWidgetComponent,
  ],
  providers: [],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'client';
  navigationEnd: Observable<NavigationEnd>;

  isLoading$: Observable<boolean>;
  errorInfo: IErrorInfo = {
    title: '',
    icon: '',
    message: '',
  };
  isShowErrorModal = false; // THÊM DÒNG NÀY
  layoutType: LayoutType = 'user';

  loadingService = inject(LoadingService);
  langService = inject(LangService);
  authService = inject(AuthService);
  errorInfoService = inject(ShowErrorService);
  visitTrackingService = inject(VisitTrackingService);
  themeService = inject(ThemeService);

  // Menu khu quản trị. Mỗi mục khai quyền cần có; rebuildDashboardMenu() lọc bỏ mục
  // người dùng không có quyền, để họ không thấy rồi bấm vào và nhận lỗi.
  // Nhóm nào không còn mục nào thì ẩn luôn cả nhóm.
  dashboardMenu: {
    title: string;
    icon: string;
    children: { path: string; title: string; permission: string }[];
  }[] = [
    {
      title: 'Người dùng',
      icon: 'team',
      children: [
        {
          path: '/dashboard/users',
          title: 'Danh sách người dùng',
          permission: 'user.view',
        },
      ],
    },
    {
      title: 'Vai trò',
      icon: 'safety',
      children: [
        {
          path: '/dashboard/role',
          title: 'Vai trò & phân quyền',
          permission: 'role.view',
        },
      ],
    },
    {
      title: 'Danh mục địa giới',
      icon: 'table',
      children: [
        {
          path: '/dashboard/mstprovince',
          title: 'Tỉnh/Thành',
          permission: 'master.view',
        },
        {
          path: '/dashboard/mstdistrict',
          title: 'Quận/Huyện',
          permission: 'master.view',
        },
      ],
    },
    {
      title: 'Nội dung',
      icon: 'read',
      children: [
        {
          path: '/dashboard/blog',
          title: 'Bài viết',
          permission: 'blog.view',
        },
        {
          path: '/dashboard/note',
          title: 'Ghi chú',
          permission: 'blog.view',
        },
        {
          path: '/dashboard/media',
          title: 'Thư viện media',
          permission: 'media.view',
        },
        {
          path: '/dashboard/newscategory',
          title: 'Danh mục tin',
          permission: 'newscategory.view',
        },
        {
          path: '/dashboard/email-report',
          title: 'Báo cáo gửi mail',
          permission: 'sysparameter.view',
        },
        {
          path: '/dashboard/subscriber',
          title: 'Người đăng ký',
          permission: 'subscriber.view',
        },
      ],
    },
    {
      title: 'Hệ thống',
      icon: 'setting',
      children: [
        {
          path: '/dashboard/audittrail',
          title: 'Nhật ký',
          permission: 'audittrail.view',
        },
        {
          path: '/dashboard/sysparameter',
          title: 'Tham số hệ thống',
          permission: 'sysparameter.view',
        },
        {
          path: '/dashboard/menu',
          title: 'Menu trang chủ',
          permission: 'sysparameter.view',
        },
      ],
    },
  ];

  lstRouteLayoutNone = ['/login', '/forgot-password'];
  // /reels chiếm trọn màn hình kiểu TikTok: không navbar/footer, và cũng không qua
  // nz-content (nz-content có margin: 64.8px 0 cho các trang 'none' khác, gây khoảng
  // trắng phía trên) - nên có layout riêng thay vì dùng chung 'none'.
  lstRouteLayoutImmersive = ['/reels'];

  constructor(
    public router: Router,
    private translate: TranslateService
  ) {
    const curLang = this.langService.getLang();
    this.translate.setDefaultLang(curLang);
    this.translate.use(curLang);
    this.themeService.init();

    // Trang con có thể bật loading ngay trong ngOnInit sau khi shell đã được
    // kiểm tra. Đưa cập nhật spinner sang microtask để hoàn tất vòng render đó.
    this.isLoading$ = this.loadingService
      .getLoading()
      .pipe(observeOn(asapScheduler));
    // Subscribe đơn giản
    this.errorInfoService.getErrorInfo().subscribe({
      next: value => {
        this.errorInfo = value;
      },
    });

    this.navigationEnd = this.router.events.pipe(
      filter((event: Event) => event instanceof NavigationEnd)
    ) as Observable<NavigationEnd>;
  }

  // Iframe nhúng của Instagram (.../embed) tự đo nội dung rồi postMessage chiều
  // cao thật về trang cha - đây là cách embed.js chính chủ resize khung. Không
  // nghe thì iframe giữ nguyên chiều cao cố định của blot và Instagram sinh
  // thanh cuộn bên trong. Đặt ở app-root vì iframe xuất hiện cả ở trang đọc bài
  // (render qua innerHTML) lẫn trong editor ở trang quản trị.
  @HostListener('window:message', ['$event'])
  resizeInstagramEmbed(ev: MessageEvent) {
    if (ev.origin !== 'https://www.instagram.com') return;

    let height: unknown;
    try {
      const data = typeof ev.data === 'string' ? JSON.parse(ev.data) : ev.data;
      if (data?.type !== 'MEASURE') return;
      height = data.details?.height;
    } catch {
      // Instagram còn gửi vài message không phải JSON, bỏ qua
      return;
    }
    if (typeof height !== 'number' || height <= 0) return;

    // Chiều cao đi kèm message chứ không kèm id, nên đối chiếu contentWindow để
    // biết message đến từ iframe nào (một bài có thể nhúng nhiều reel).
    document.querySelectorAll('iframe.ql-embed').forEach(frame => {
      if ((frame as HTMLIFrameElement).contentWindow === ev.source) {
        frame.setAttribute('height', String(Math.ceil(height as number)));
      }
    });
  }

  ngOnInit() {
    this.authService.tryRefreshOnInit();
    this.visitTrackingService.init();

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const url = event.urlAfterRedirects;
        const isLayoutNone = this.lstRouteLayoutNone.includes(url);
        const isLayoutImmersive = this.lstRouteLayoutImmersive.includes(url);

        if (url.startsWith('/dashboard')) {
          this.layoutType = 'admin';
          // Dựng lại menu mỗi lần vào khu quản trị: token có thể đã đổi kể từ lần
          // trước (đăng nhập tài khoản khác, hoặc vừa refresh token).
          this.rebuildDashboardMenu();
        } else if (isLayoutImmersive) {
          this.layoutType = 'immersive';
        } else if (isLayoutNone) {
          this.layoutType = 'none';
        } else {
          this.layoutType = 'user';
        }

        // Overlay của NG-ZORRO được render dưới body, nằm ngoài .admin-ui.
        // Marker này giúp overlay nhận đúng theme admin và được gỡ khi rời dashboard.
        document.body.classList.toggle(
          'admin-ui-active',
          this.layoutType === 'admin'
        );

        // 'immersive' (Reels) là trang user-facing như 'user', chỉ khác ở chỗ
        // không bọc qua nz-layout/nz-content - vẫn phải giữ theme người dùng chọn.
        this.themeService.applyForLayout(
          this.layoutType === 'user' || this.layoutType === 'immersive'
        );
      });

    this.navigationEnd.subscribe(() => {
      posthog.capture('$pageview');
    });
  }

  // THÊM METHOD NÀY
  closeErrorModal() {
    this.isShowErrorModal = false;
    this.errorInfoService.clearError();
  }

  handleLogout() {
    const { nameid: userid } = this.authService.getAccountInfo();

    this.loadingService.setLoading(true);
    this.authService.logoutFromAllDevice(userid).subscribe({
      next: response => {
        if (!response?.Success) {
          this.errorInfoService.setShowError({
            icon: 'warning',
            message: JSON.stringify(response, null, 2),
            title: response?.ErrorMessage || 'Error',
          });
        }
      },
      error: err => {
        this.loadingService.setLoading(false);
        this.errorInfoService.setShowError({
          icon: 'warning',
          message: JSON.stringify(err, null, 2),
          title: err.message || 'Error',
        });
        // Vẫn phải xóa phiên đăng nhập ở máy này dù API logout-all-device lỗi,
        // tránh việc localStorage giữ lại token cũ trong khi user tưởng đã logout
        this.authService.logout();
      },
      complete: () => {
        this.loadingService.setLoading(false);
        this.authService.logout();
      },
    });
  }


  // Menu đã lọc theo quyền, TÍNH SẴN một lần chứ không gọi từ template.
  //
  // Trước đây template gọi thẳng getDashboardMenu() trong *ngFor. Hàm đó trả về
  // mảng MỚI mỗi lần gọi, Angular so sánh theo tham chiếu nên thấy khác -> vẽ lại
  // *ngFor -> kích hoạt change detection -> gọi lại hàm... thành vòng lặp vô tận.
  // Mỗi vòng còn jwtDecode cả chục lần (mỗi mục menu một lần), nên trình duyệt
  // đơ hẳn khi vào dashboard.
  dashboardMenuFiltered: typeof this.dashboardMenu = [];

  private rebuildDashboardMenu(): void {
    this.dashboardMenuFiltered = this.dashboardMenu
      .map(group => ({
        ...group,
        children: group.children.filter(c =>
          this.authService.hasPermission(c.permission)
        ),
      }))
      .filter(group => group.children.length > 0);
  }
}
