import { Component, inject, OnInit } from '@angular/core';
import { NzTableModule } from 'ng-zorro-antd/table';
import { AuthService } from '../../../services/auth.service';
import { IUserInfo } from '../../../interfaces/user';
import { ShowErrorService } from '../../../services/show-error.service';
import { LoadingService } from '../../../services/loading-service.service';
import { delay, pipe } from 'rxjs';
import {
  NzBreadCrumbComponent,
  NzBreadCrumbModule,
} from 'ng-zorro-antd/breadcrumb';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [NzTableModule, NzBreadCrumbModule],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss',
})
export class UserListComponent implements OnInit {
  authService = inject(AuthService);
  showErrorService = inject(ShowErrorService);
  loadingService = inject(LoadingService);
  lstUsers: IUserInfo[] = [
    {
      fullName: '',
      id: '',
      userName: '',
      normalizedUserName: '',
      email: '',
      normalizedEmail: '',
      emailConfirmed: false,
      passwordHash: '',
      securityStamp: '',
      concurrencyStamp: '',
      phoneNumber: '',
      phoneNumberConfirmed: false,
      twoFactorEnabled: false,
      lockoutEnd: '',
      roles: [''],
      lockoutEnabled: false,
      accessFailedCount: 0,
    },
  ];

  ngOnInit() {
    this.loadingService.setLoading(true);
    this.authService
      .getAllUsers()
      .pipe(delay(2000))
      .subscribe({
        next: (value) => {
          this.lstUsers = value;
          this.loadingService.setLoading(false);
        },
        error: (err) => {
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
