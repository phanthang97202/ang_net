import { Component, inject, OnInit } from '@angular/core';
import {
  AuthService,
  ShowErrorService,
  LoadingService,
} from '../../../services';
import {
  AntdModule,
  REUSE_COMPONENT_MODULES,
  REUSE_PIPE_MODULE,
} from '../../../modules';
import { IUser } from '../../../interfaces';
import { AccountCredentialsPopupComponent } from './account-credentials-popup.component';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [AntdModule, ...REUSE_COMPONENT_MODULES, REUSE_PIPE_MODULE, AccountCredentialsPopupComponent],
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
    this.me = this.authService.getAccountInfo().email;
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
