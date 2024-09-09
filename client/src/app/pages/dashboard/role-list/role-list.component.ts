import { Component, inject } from '@angular/core';
import { CreateRoleComponent } from '../../../components/create-role/create-role.component';
import { ICreateRoleRequest } from '../../../interfaces/role';
import { AuthService } from '../../../services/auth.service';
import { LoadingService } from '../../../services/loading-service.service';
import { ShowErrorService } from '../../../services/show-error.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Router } from '@angular/router';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';

@Component({
  selector: 'app-role-list',
  standalone: true,
  imports: [CreateRoleComponent, NzBreadCrumbModule],
  templateUrl: './role-list.component.html',
  styleUrl: './role-list.component.scss',
})
export class RoleListComponent {
  authService = inject(AuthService);
  loadingService = inject(LoadingService);
  showErrorService = inject(ShowErrorService);

  constructor(private message: NzMessageService, private router: Router) {}

  handleCreateRole(data: ICreateRoleRequest) {
    this.authService.createRole(data).subscribe({
      next: (value) => {
        this.loadingService.setLoading(false);
        this.message.create('success', 'Create role successfully');
        // this.router.navigate(['/']);
      },
      complete: () => {
        this.loadingService.setLoading(false);
      },
      error: (err) => {
        this.loadingService.setLoading(false);
        this.showErrorService.setShowError({
          title: err.message,
          message: JSON.stringify(err, null, 2),
        });
      },
    });
  }
}
