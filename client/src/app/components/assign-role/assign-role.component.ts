import { Component, EventEmitter, Input, Output } from '@angular/core';
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
import { IAssignRoleRequest, IRole } from '../../interfaces/role';
import { IUser } from '../../interfaces/user';

@Component({
  selector: 'app-assign-role',
  standalone: true,
  imports: [
    NzFormModule,
    ReactiveFormsModule,
    NzButtonModule,
    NzInputModule,
    NzSelectModule,
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

  validateForm: FormGroup<{
    UserId: FormControl<string>;
    RoleId: FormControl<string>;
  }> = this.fb.group({
    UserId: ['', [Validators.required]],
    RoleId: ['', [Validators.required]],
  });

  genderChange(data: any) {}

  submitForm(): void {
    if (this.validateForm.valid) {
      this.onAssignRole.emit({
        UserId: this.validateForm.value.UserId!,
        RoleId: this.validateForm.value.RoleId!,
      });
    } else {
      Object.values(this.validateForm.controls).forEach((control) => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }
}
