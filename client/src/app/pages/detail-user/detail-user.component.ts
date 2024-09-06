import { Component, inject, OnInit } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { AuthService } from '../../services/auth.service';
import { IUser } from '../../interfaces/user';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { CommonModule } from '@angular/common';
import { delay } from 'rxjs';
import { ShowNullishValue } from '../../pipes/showNullishValue.pipe';
import { ShowErrorService } from '../../services/show-error.service';

@Component({
  selector: 'app-detail-user',
  standalone: true,
  imports: [
    NzSkeletonModule,
    NzButtonComponent,
    NzCardModule,
    NzDescriptionsModule,
    CommonModule,
    ShowNullishValue,
  ],
  templateUrl: './detail-user.component.html',
  styleUrl: './detail-user.component.scss',
})
export class DetailUserComponent implements OnInit {
  authService = inject(AuthService);
  showErrorService = inject(ShowErrorService);

  userInfo: IUser | null = null;

  ngOnInit() {
    this.authService
      .getUserDetail()
      .pipe(delay(2000))
      .subscribe({
        next: (res) => {
          this.userInfo = res;
        },
        error: (err) => {
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
