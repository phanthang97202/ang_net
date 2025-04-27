import { Component, inject, OnInit } from '@angular/core';
import { NzTableModule } from 'ng-zorro-antd/table';
import { AuthService } from '../../../services/auth.service';
import { IUser, IUserInfo } from '../../../interfaces/user';
import { ShowErrorService } from '../../../services/show-error.service';
import { LoadingService } from '../../../services/loading-service.service';
import { delay, pipe } from 'rxjs';
import {
  NzBreadCrumbComponent,
  NzBreadCrumbModule,
} from 'ng-zorro-antd/breadcrumb';
import { CommonModule } from '@angular/common';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [NzTableModule, NzBreadCrumbModule, CommonModule, NzAvatarModule],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss',
})
export class UserListComponent implements OnInit {
  authService = inject(AuthService);
  showErrorService = inject(ShowErrorService);
  loadingService = inject(LoadingService);
  me: string = '';
  lstUsers: IUser[] = [];

  ngOnInit() {
    this.loadingService.setLoading(true);
    this.me = this.authService.getAccountInfo().email;
    this.authService
      .getAllUsers()
      .pipe(delay(2000))
      .subscribe({
        next: (data) => {
          this.lstUsers = data.DataList;
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
