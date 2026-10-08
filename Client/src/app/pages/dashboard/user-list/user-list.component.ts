import { Component, inject, OnInit } from '@angular/core';
import {
  AuthService,
  ShowErrorService,
  LoadingService,
} from '../../../services';
import { AntdModule } from '../../../modules/antd.module';
import { BreadcrumbComponent } from '../../../components/breadcrumb/breadcrumb.component';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { IUser } from '../../../interfaces';
import { AccountCredentialsPopupComponent } from './account-credentials-popup.component';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import {
  AccountSecurityAction,
  AccountSecurityPopupComponent,
} from './account-security-popup.component';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    AntdModule,
    BreadcrumbComponent,
    NzAvatarModule,
    NzMenuModule,
    AccountCredentialsPopupComponent,
    NzDropDownModule,
    NzToolTipModule,
    AccountSecurityPopupComponent,
  ],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss',
})
export class UserListComponent implements OnInit {
  authService = inject(AuthService);
  showErrorService = inject(ShowErrorService);
  loadingService = inject(LoadingService);
  me = '';
  lstUsers: IUser[] = [];
  credentialsVisible = false;
  selectedUser: IUser | null = null;
  securityVisible = false;
  securityUser: IUser | null = null;
  securityAction: AccountSecurityAction = 'revoke';

  openSecurity(user: IUser, action: AccountSecurityAction): void {
    if (
      !this.authService.isLoggedIn() ||
      !this.authService.isAdminPermission() ||
      (action === 'lock' && user.Id === this.me)
    )
      return;
    this.securityUser = user;
    this.securityAction = action;
    this.securityVisible = true;
  }

  ngOnInit() {
    this.loadUsers();
  }

  editCredentials(user: IUser | null): void {
    if (!this.authService.isAdminPermission()) return;
    this.selectedUser = user;
    this.credentialsVisible = true;
  }

  loadUsers(): void {
    this.loadingService.setLoading(true);
    this.me = this.authService.getAccountInfo().nameid;
    this.authService
      .getAllUsers()
      // .pipe(delay(2000))
      .subscribe({
        next: data => {
          this.lstUsers = data.DataList || [];
          this.loadingService.setLoading(false);
        },
        error: err => {
          this.loadingService.setLoading(false);
          this.showErrorService.setShowError({
            icon: 'warning',
            message: JSON.stringify(err, null, 2),
            title: err.message,
          });
        },
        complete() {},
      });
  }
}
