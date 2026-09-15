import { Component, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzMessageService } from 'ng-zorro-antd/message';
import {
  IPermissionModule,
  IRole,
} from '../../interfaces';
import { ApiService, ShowErrorService } from '../../services';
import { AntdModule } from '../../modules';
// AntdModule chỉ có ReactiveFormsModule, và không export NzEmpty/NzSpin - ba thứ
// này phải khai báo riêng ở đây.
import { FormsModule } from '@angular/forms';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzSpinModule } from 'ng-zorro-antd/spin';

@Component({
  selector: 'app-role-permission',
  standalone: true,
  imports: [CommonModule, AntdModule, FormsModule, NzEmptyModule, NzSpinModule],
  templateUrl: './role-permission.component.html',
  styleUrl: './role-permission.component.scss',
})
export class RolePermissionComponent implements OnChanges {
  private api = inject(ApiService);
  private showErrorService = inject(ShowErrorService);
  private message = inject(NzMessageService);

  @Input() lstRoles: IRole[] = [];

  catalogue: IPermissionModule[] = [];
  selectedRoleId = '';

  // Quyền đang tick trên màn hình.
  selected = new Set<string>();
  // Ảnh chụp lúc tải về, để biết người dùng có sửa gì chưa mà bật/tắt nút Lưu.
  private original = new Set<string>();

  isLoadingCatalogue = false;
  isLoadingRole = false;
  isSaving = false;

  ngOnChanges(changes: SimpleChanges): void {
    // Danh mục quyền chỉ cần tải một lần, nhưng component nhận lstRoles qua
    // @Input nên lần đầu có dữ liệu mới là lúc biết chắc trang đã sẵn sàng.
    if (changes['lstRoles'] && !this.catalogue.length) {
      this.fetchCatalogue();
    }
  }

  private fetchCatalogue(): void {
    this.isLoadingCatalogue = true;
    this.api.PermissionCatalogue().subscribe({
      next: response => {
        if (response?.Success) {
          this.catalogue = response.DataList || [];
        } else {
          this.handleApiFail(response);
        }
      },
      error: err => this.handleApiError(err),
      complete: () => (this.isLoadingCatalogue = false),
    });
  }

  handleSelectRole(roleId: string): void {
    this.selectedRoleId = roleId || '';
    this.selected = new Set<string>();
    this.original = new Set<string>();

    if (!this.selectedRoleId) return;

    this.isLoadingRole = true;
    this.api.PermissionOfRole(this.selectedRoleId).subscribe({
      next: response => {
        if (response?.Success) {
          const codes = response.Data?.Permissions || [];
          this.selected = new Set(codes);
          this.original = new Set(codes);
        } else {
          this.handleApiFail(response);
        }
      },
      error: err => this.handleApiError(err),
      complete: () => (this.isLoadingRole = false),
    });
  }

  togglePermission(code: string, checked: boolean): void {
    if (checked) {
      this.selected.add(code);
    } else {
      this.selected.delete(code);
    }
  }

  isChecked(code: string): boolean {
    return this.selected.has(code);
  }

  // Tick/bỏ tick cả nhóm bằng một lần bấm - nhóm nào cũng 3-4 quyền nên bấm lẻ
  // từng cái khá mệt khi dựng một vai trò mới.
  toggleModule(mod: IPermissionModule, checked: boolean): void {
    mod.Permissions.forEach(p => this.togglePermission(p.PermissionCode, checked));
  }

  isModuleAllChecked(mod: IPermissionModule): boolean {
    return (
      mod.Permissions.length > 0 &&
      mod.Permissions.every(p => this.selected.has(p.PermissionCode))
    );
  }

  isModuleIndeterminate(mod: IPermissionModule): boolean {
    const checkedCount = mod.Permissions.filter(p =>
      this.selected.has(p.PermissionCode)
    ).length;
    return checkedCount > 0 && checkedCount < mod.Permissions.length;
  }

  countCheckedOf(mod: IPermissionModule): number {
    return mod.Permissions.filter(p => this.selected.has(p.PermissionCode))
      .length;
  }

  get hasChanges(): boolean {
    if (this.selected.size !== this.original.size) return true;
    for (const code of this.selected) {
      if (!this.original.has(code)) return true;
    }
    return false;
  }

  // Vai trò Admin đi qua mọi kiểm tra quyền ở backend (PermissionHandler), nên
  // gán quyền cho nó không có tác dụng gì - nói rõ thay vì để người dùng tick
  // xong thắc mắc sao không thấy khác biệt.
  get isAdminRole(): boolean {
    const role = this.lstRoles.find(r => r.Id === this.selectedRoleId);
    return role?.Name === 'Admin';
  }

  handleSave(): void {
    if (!this.selectedRoleId) return;

    this.isSaving = true;
    this.api
      .PermissionUpdateOfRole({
        RoleId: this.selectedRoleId,
        Permissions: Array.from(this.selected),
      })
      .subscribe({
        next: response => {
          if (response?.Success) {
            this.message.success('Cập nhật quyền thành công');
            this.original = new Set(this.selected);
          } else {
            this.handleApiFail(response);
          }
        },
        error: err => this.handleApiError(err),
        complete: () => (this.isSaving = false),
      });
  }

  handleReset(): void {
    this.selected = new Set(this.original);
  }

  private handleApiFail(response: any): void {
    this.showErrorService.setShowError({
      icon: 'warning',
      message: JSON.stringify(response, null, 2),
      title: response?.ErrorMessage || 'Error',
    });
  }

  private handleApiError(err: any): void {
    this.isLoadingCatalogue = false;
    this.isLoadingRole = false;
    this.isSaving = false;
    this.showErrorService.setShowError({
      icon: 'warning',
      message: JSON.stringify(err, null, 2),
      title: err.message || 'Error',
    });
  }
}
