import { Component, EventEmitter, Output } from '@angular/core';
import {
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { ICreateRoleRequest } from '../../interfaces';

@Component({
  selector: 'app-create-role',
  standalone: true,
  imports: [
    NzFormModule,
    ReactiveFormsModule,
    NzButtonComponent,
    NzInputModule,
  ],
  templateUrl: './create-role.component.html',
  styleUrl: './create-role.component.scss',
})
export class CreateRoleComponent {
  constructor(private fb: NonNullableFormBuilder) {}
  @Output() onCreateRole: EventEmitter<ICreateRoleRequest> =
    new EventEmitter<ICreateRoleRequest>();

  validateForm: FormGroup<{
    roleName: FormControl<string>;
  }> = this.fb.group({
    roleName: ['', [Validators.required]],
  });

  submitForm(): void {
    if (this.validateForm.valid) {
      this.onCreateRole.emit({
        roleName: this.validateForm.value.roleName!,
      });
    } else {
      Object.values(this.validateForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }
}
