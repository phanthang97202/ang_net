import { Component, inject, OnInit } from '@angular/core';
import { CreateRoleComponent } from '../../../components/create-role/create-role.component';
import {
  IAssignRoleRequest,
  ICreateRoleRequest,
  IRole,
} from '../../../interfaces/role';
import { AuthService } from '../../../services/auth.service';
import { LoadingService } from '../../../services/loading-service.service';
import { ShowErrorService } from '../../../services/show-error.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Router } from '@angular/router';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { AssignRoleComponent } from '../../../components/assign-role/assign-role.component';
import { IUser } from '../../../interfaces/user';
@Component({
  selector: 'app-role-list',
  standalone: true,
  imports: [
    CreateRoleComponent,
    NzBreadCrumbModule,
    NzGridModule,
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    NzPopconfirmModule,
    NzTypographyModule,
    AssignRoleComponent,
  ],
  templateUrl: './role-list.component.html',
  styleUrl: './role-list.component.scss',
})
export class RoleListComponent implements OnInit {
  authService = inject(AuthService);
  loadingService = inject(LoadingService);
  showErrorService = inject(ShowErrorService);

  lstRoles: IRole[] = [];
  lstUsers: IUser[] = [];
  constructor(private message: NzMessageService, private router: Router) {}

  fetchRolesData() {
    this.authService.getAllRoles().subscribe({
      next: (data) => {
        this.loadingService.setLoading(false);
        this.lstRoles = data.Data; 
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

  fetchUsersData() {
    this.authService.getAllUsers().subscribe({
      next: (data) => {
        this.loadingService.setLoading(false);
        this.lstUsers = data.DataList;
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

  ngOnInit() {
    this.fetchRolesData();
    this.fetchUsersData();
  }

  handleCreateRole(data: ICreateRoleRequest) {
    this.authService.createRole(data).subscribe({
      next: (value) => {
        this.loadingService.setLoading(false);
        this.message.create('success', 'Create role successfully');
        this.fetchRolesData();
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

  handleDelete(key: string) {
    this.authService.deleteRole(key).subscribe({
      next: (value) => {
        this.loadingService.setLoading(false);
        this.message.create('success', 'Delete role successfully');
        this.fetchRolesData();
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

  cancel(): void {}

  confirm(): void {
    this.message.info('click confirm');
  }

  handleAssignRole(data: IAssignRoleRequest) {
    this.authService.assignRole(data).subscribe({
      next: (value) => {
        this.loadingService.setLoading(false);
        this.message.create('success', 'Assign role successfully');
        this.fetchRolesData();
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

  handleUnassignRole(data: IAssignRoleRequest) {
    this.authService.unassignRole(data).subscribe({
      next: (value) => {
        this.loadingService.setLoading(false);
        this.message.create('success', 'Unassign role successfully');
        this.fetchRolesData();
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
