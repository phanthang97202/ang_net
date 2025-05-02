import { Component, inject, OnInit } from '@angular/core';
import {
  IAssignRoleRequest,
  ICreateRoleRequest,
  IRole,
  IUser,
} from '../../../interfaces';
import {
  AuthService,
  LoadingService,
  ShowErrorService,
} from '../../../services';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AntdModule, REUSE_COMPONENT_MODULES } from '../../../modules';
@Component({
  selector: 'app-role-list',
  standalone: true,
  imports: [AntdModule, ...REUSE_COMPONENT_MODULES],
  templateUrl: './role-list.component.html',
  styleUrl: './role-list.component.scss',
})
export class RoleListComponent implements OnInit {
  authService = inject(AuthService);
  loadingService = inject(LoadingService);
  showErrorService = inject(ShowErrorService);

  lstRoles: IRole[] = [];
  lstUsers: IUser[] = [];
  constructor(
    private message: NzMessageService,
    private router: Router
  ) {}

  // fetchRolesData() {
  //   this.authService.getAllRoles().subscribe({
  //     next: data => {
  //       this.loadingService.setLoading(false);
  //       this.lstRoles = data.Data;
  //     },
  //     complete: () => {
  //       this.loadingService.setLoading(false);
  //     },
  //     error: err => {
  //       this.loadingService.setLoading(false);
  //       this.showErrorService.setShowError({
  //         title: err.message,
  //         message: JSON.stringify(err, null, 2),
  //       });
  //     },
  //   });
  // }

  // fetchUsersData() {
  //   this.authService.getAllUsers().subscribe({
  //     next: data => {
  //       this.loadingService.setLoading(false);
  //       this.lstUsers = data.DataList;
  //     },
  //     complete: () => {
  //       this.loadingService.setLoading(false);
  //     },
  //     error: err => {
  //       this.loadingService.setLoading(false);
  //       this.showErrorService.setShowError({
  //         title: err.message,
  //         message: JSON.stringify(err, null, 2),
  //       });
  //     },
  //   });
  // }

  fetchAllData() {
    this.loadingService.setLoading(true);
    forkJoin([
      this.authService.getAllRoles(),
      this.authService.getAllUsers(),
    ]).subscribe({
      next: data => {
        const [objRole, objUser] = data;

        this.lstRoles = objRole.Data;
        this.lstUsers = objUser.DataList;

        this.loadingService.setLoading(false);
      },
      complete: () => {
        this.loadingService.setLoading(false);
      },
      error: err => {
        this.loadingService.setLoading(false);
        this.showErrorService.setShowError({
          title: err.message,
          message: JSON.stringify(err, null, 2),
        });
      },
    });
  }

  ngOnInit() {
    // this.fetchRolesData();
    // this.fetchUsersData();
    this.fetchAllData();
  }

  handleCreateRole(data: ICreateRoleRequest) {
    this.authService.createRole(data).subscribe({
      next: value => {
        this.loadingService.setLoading(false);
        this.message.create('success', 'Create role successfully');
        this.fetchAllData();
      },
      complete: () => {
        this.loadingService.setLoading(false);
      },
      error: err => {
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
      next: value => {
        this.loadingService.setLoading(false);
        this.message.create('success', 'Delete role successfully');
        this.fetchAllData();
      },
      complete: () => {
        this.loadingService.setLoading(false);
      },
      error: err => {
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
      next: value => {
        this.loadingService.setLoading(false);
        this.message.create('success', 'Assign role successfully');
        this.fetchAllData();
      },
      complete: () => {
        this.loadingService.setLoading(false);
      },
      error: err => {
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
      next: value => {
        this.loadingService.setLoading(false);
        this.message.create('success', 'Unassign role successfully');
        this.fetchAllData();
      },
      complete: () => {
        this.loadingService.setLoading(false);
      },
      error: err => {
        this.loadingService.setLoading(false);
        this.showErrorService.setShowError({
          title: err.message,
          message: JSON.stringify(err, null, 2),
        });
      },
    });
  }
}
