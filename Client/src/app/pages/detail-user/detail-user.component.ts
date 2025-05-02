import { Component, inject, OnInit } from '@angular/core';
import { AuthService, ShowErrorService } from '../../services';
import { IUser } from '../../interfaces';
import {
  AntdModule,
  REUSE_COMPONENT_MODULES,
  REUSE_PIPE_MODULE,
} from '../../modules';

@Component({
  selector: 'app-detail-user',
  standalone: true,
  imports: [AntdModule, ...REUSE_COMPONENT_MODULES, ...REUSE_PIPE_MODULE],
  templateUrl: './detail-user.component.html',
  styleUrl: './detail-user.component.scss',
})
export class DetailUserComponent implements OnInit {
  authService = inject(AuthService);
  showErrorService = inject(ShowErrorService);

  userInfo: IUser | null = null;

  ngOnInit() {
    this.authService.getUserDetail().subscribe({
      next: res => {
        this.userInfo = res.Data;
      },
      error: err => {
        this.showErrorService.setShowError({
          icon: 'warning',
          message: JSON.stringify(err, null, 2),
          title: err.message,
        });
        throw new Error(err);
      },
    });
  }

  editUser() {}
  resetAccessFailCount() {}
}
