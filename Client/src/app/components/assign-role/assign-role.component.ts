import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { IAssignRoleRequest, IRole } from '../../interfaces';
import { IUser } from '../../interfaces';

@Component({
  selector: 'app-assign-role',
  standalone: true,
  imports: [
    CommonModule,
    NzFormModule,
    ReactiveFormsModule,
    NzButtonModule,
    NzInputModule,
    NzSelectModule,
    NzTagModule,
  ],
  templateUrl: './assign-role.component.html',
  styleUrl: './assign-role.component.scss',
})
export class AssignRoleComponent {
  constructor(private fb: NonNullableFormBuilder) {}
  @Input() lstUsers!: IUser[];
  @Input() lstRoles!: IRole[];
  @Output() onAssignRole: EventEmitter<IAssignRoleRequest> =
    new EventEmitter<IAssignRoleRequest>();
  @Output() onUnassignRole: EventEmitter<IAssignRoleRequest> =
    new EventEmitter<IAssignRoleRequest>();

  validateForm: FormGroup<{
    UserId: FormControl<string>;
    RoleId: FormControl<string>;
  }> = this.fb.group({
    UserId: ['', [Validators.required]],
    RoleId: ['', [Validators.required]],
  });

  // Vai trò mà người dùng đang chọn hiện có. Trước đây màn hình không hiển thị
  // thông tin này nên phải đoán: bấm Gán cho người đã có vai trò, hoặc bấm Gỡ
  // cho người chưa có, đều bị backend trả lỗi.
  get selectedUserRoles(): string[] {
    const userId = this.validateForm.value.UserId;
    if (!userId) return [];
    return this.lstUsers?.find(u => u.Id === userId)?.Roles || [];
  }

  // Vai trò đang chọn đã nằm trong danh sách của người dùng chưa - dùng để chỉ
  // bật đúng nút có nghĩa, thay vì luôn bật cả hai.
  get isRoleAlreadyAssigned(): boolean {
    const roleId = this.validateForm.value.RoleId;
    if (!roleId) return false;
    const roleName = this.lstRoles?.find(r => r.Id === roleId)?.Name;
    return !!roleName && this.selectedUserRoles.includes(roleName);
  }

  handleAssign(): void {
    if (this.validateForm.valid) {
      this.onAssignRole.emit({
        UserId: this.validateForm.value.UserId!,
        RoleId: this.validateForm.value.RoleId!,
      });
    } else {
      this.markAllDirty();
    }
  }

  handleUnassign() {
    if (this.validateForm.valid) {
      this.onUnassignRole.emit({
        UserId: this.validateForm.value.UserId!,
        RoleId: this.validateForm.value.RoleId!,
      });
    } else {
      this.markAllDirty();
    }
  }

  private markAllDirty(): void {
    Object.values(this.validateForm.controls).forEach(control => {
      if (control.invalid) {
        control.markAsDirty();
        control.updateValueAndValidity({ onlySelf: true });
      }
    });
  }
}
