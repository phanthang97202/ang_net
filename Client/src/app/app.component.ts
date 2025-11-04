import { Component, inject, OnInit } from '@angular/core';
import { Event, NavigationEnd, Router } from '@angular/router';
import {
  LoadingService,
  ShowErrorService,
  AuthService,
  LangService,
} from './services';
import { filter, Observable } from 'rxjs';
import { IErrorInfo } from './interfaces';
import { LayoutType } from './types';
import posthog from 'posthog-js';
import { TranslateService } from '@ngx-translate/core';
import {
  AntdModule,
  REUSE_COMPONENT_MODULES,
  REUSE_PIPE_MODULE,
} from './modules';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [AntdModule, ...REUSE_COMPONENT_MODULES, ...REUSE_PIPE_MODULE],
  providers: [],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'client';
  navigationEnd: Observable<NavigationEnd>;

  isChatOpen = false;
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

  lstRouteLayoutNone = ['/login', '/forgot-password'];

  constructor(
    public router: Router,
    private translate: TranslateService
  ) {
    const curLang = this.langService.getLang();
    this.translate.setDefaultLang(curLang);
    this.translate.use(curLang);

    this.isLoading$ = this.loadingService.getLoading();
    // Subscribe đơn giản
    this.errorInfoService.getErrorInfo().subscribe({
      next: value => {
        this.errorInfo = value;
      },
    });

    this.navigationEnd = this.router.events.pipe(
      filter((event: Event) => event instanceof NavigationEnd)
    ) as Observable<NavigationEnd>;

    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        window.scrollTo({
          top: 0,
          behavior: 'smooth',
        });
      }
    });
  }

  ngOnInit() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const url = event.urlAfterRedirects;
        const isLayoutNone = this.lstRouteLayoutNone.includes(url);

        if (url.startsWith('/dashboard')) {
          this.layoutType = 'admin';
        } else if (isLayoutNone) {
          this.layoutType = 'none';
        } else {
          this.layoutType = 'user';
        }
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
        if (response?.Success) {
          this.authService.logout();
        } else {
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
      },
      complete: () => this.loadingService.setLoading(false),
    });
  }

  toggleChat() {
    this.isChatOpen = !this.isChatOpen;
  }
}
