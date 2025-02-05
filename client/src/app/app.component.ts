import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterLink,
  RouterOutlet,
  RouterStateSnapshot,
} from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { FooterComponent } from './components/footer/footer.component';
import {
  NzContentComponent,
  NzFooterComponent,
  NzHeaderComponent,
  NzLayoutComponent,
  NzSiderComponent,
} from 'ng-zorro-antd/layout';
import {
  NzBreadCrumbComponent,
  NzBreadCrumbItemComponent,
} from 'ng-zorro-antd/breadcrumb';
import { NzSpinComponent } from 'ng-zorro-antd/spin';
import { NzAlertComponent } from 'ng-zorro-antd/alert';
import { LoadingService } from './services/loading-service.service';
import { filter, map, Observable, Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ErrorPopupComponent } from './components/error-popup/error-popup.component';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { IErrorInfo } from './interfaces/error-info';
import { ShowErrorService } from './services/show-error.service';
import { LayoutType } from './types';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterLink,
    CommonModule,
    NzSpinComponent,
    NzAlertComponent,
    NzLayoutComponent,
    NzHeaderComponent,
    NzContentComponent,
    NzBreadCrumbComponent,
    NzBreadCrumbItemComponent,
    NzFooterComponent,
    RouterOutlet,
    NavbarComponent,
    FooterComponent,
    ErrorPopupComponent,
    NzButtonComponent,
    NzSiderComponent,
    NzMenuModule,
  ],
  providers: [],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'client';

  isLoading$: Observable<boolean>;
  errorInfo: IErrorInfo = {
    title: '',
    icon: '',
    message: '',
  };
  layoutType: LayoutType = 'user';

  loadingService = inject(LoadingService);
  authService = inject(AuthService);
  errorInfoService = inject(ShowErrorService);
  router = inject(Router);

  constructor() {
    // Subscribe to the loading state from the LoadingService
    this.isLoading$ = this.loadingService.getLoading();
    this.errorInfoService.getErrorInfo().subscribe({
      next: (value) => {
        this.errorInfo = value;
      },
    });
  }
  ngOnInit() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const url = event.urlAfterRedirects;

        if (url.startsWith('/dashboard')) {
          this.layoutType = 'admin';
        } else if (url.startsWith('/login')) {
          this.layoutType = 'none';
        } else {
          this.layoutType = 'user';
        }
      });
  }

  // dùng cách này không thể lấy được router chính xác
  // router = inject(Router);
  // ngOnInit() {
  //   const url = this.router.url; 
  // }

  handleLogout() {
    // có thời gian thì làm thêm popup lựa chọn: Đăng xuất hay Đăng xuất khỏi tất cả thiết bị
    // this.authService.logout();
    
    const { nameid: userid } = this.authService.getAccountInfo();

    this.loadingService.setLoading(true);
    this.authService
      .logoutFromAllDevice(userid)
      .subscribe({
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
          this.loadingService.setLoading(false)
          this.errorInfoService.setShowError({
            icon: 'warning',
            message: JSON.stringify(err, null, 2),
            title: err.message || 'Error',
          });
        },
        complete: () => this.loadingService.setLoading(false),
      });

    
  }
}
