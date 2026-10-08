import { CommonModule } from '@angular/common';
import { Component, DestroyRef, EventEmitter, inject, Input, OnChanges, Output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { EMPTY, finalize, switchMap } from 'rxjs';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AuthService } from '../../../services';
import { IUser } from '../../../interfaces/user';

@Component({
  selector: 'app-account-credentials-popup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NzModalModule, NzFormModule, NzInputModule],
  templateUrl: './account-credentials-popup.component.html',
  styleUrl: './account-credentials-popup.component.scss',
})
export class AccountCredentialsPopupComponent implements OnChanges {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly api = inject(AuthService);
  private readonly messages = inject(NzMessageService);
  private readonly destroyRef = inject(DestroyRef);
  @Input() visible = false;
  @Input() user: IUser | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<void>();
  target: IUser | null = null;
  mode: 'create' | 'credentials' | 'reset' = 'create';
  saving = false;
  notice = '';
  error = '';
  form = this.fb.group({
    Email: ['', [Validators.email, Validators.maxLength(256)]],
    FullName: ['', [Validators.required, Validators.maxLength(100)]],
    UserName: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9][a-zA-Z0-9._-]{2,31}$/)]],
    Password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]],
    ConfirmPassword: ['', Validators.required],
  }, { validators: group => group.get('Password')?.value === group.get('ConfirmPassword')?.value
    ? null : { passwordMismatch: true } });

  get title(): string {
    return this.mode === 'create' ? 'Tạo tài khoản' : this.mode === 'credentials'
      ? 'Thêm đăng nhập bằng mật khẩu' : 'Đặt lại mật khẩu';
  }
  get action(): string {
    return this.mode === 'create' ? 'Tạo tài khoản' : this.mode === 'credentials'
      ? 'Thêm đăng nhập' : 'Đặt lại mật khẩu';
  }

  ngOnChanges(): void {
    this.form.reset();
    this.notice = this.error = '';
    this.target = this.user;
    this.mode = this.user ? this.user.HasPassword ? 'reset' : 'credentials' : 'create';
    this.configure();
  }

  private configure(): void {
    const fields = this.form.controls;
    for (const field of [fields.Email, fields.FullName]) {
      if (this.mode === 'create') field.enable(); else field.disable();
    }
    if (this.mode === 'reset') fields.UserName.disable(); else fields.UserName.enable();
    if (this.target) {
      fields.Email.setValue(this.target.Email || '');
      fields.FullName.setValue(this.target.FullName || '');
      if (!fields.UserName.value && !this.target.UserName?.includes('@')) {
        fields.UserName.setValue(this.target.UserName || '');
      }
    }
  }

  cancel(): void {
    if (this.saving) return;
    this.form.reset();
    this.visibleChange.emit(false);
  }

  save(): void {
    if (this.saving) return;
    this.form.controls.Email.setValue(this.form.controls.Email.value.trim());
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const data = this.form.getRawValue();
    data.Email = data.Email.trim();
    data.FullName = data.FullName.trim();
    this.error = '';
    this.saving = true;
    const request = this.mode === 'create'
      ? !data.Email
        ? this.api.createAdminUser({ ...data, Email: null })
        : this.api.findAdminUserByEmail(data.Email).pipe(switchMap(response => {
          if (!response.Success) {
            this.error = response.ErrorMessage || 'Không thể kiểm tra email.';
            return EMPTY;
          }
          if (response.Data) {
            if (response.Data.HasPassword) {
              this.error = 'Email đã có tài khoản và mật khẩu. Hãy chọn Đặt lại mật khẩu trong danh sách nếu cần.';
              this.form.controls.Password.reset();
              this.form.controls.ConfirmPassword.reset();
            } else {
              this.target = response.Data;
              this.mode = 'credentials';
              this.notice = 'Email đã có tài khoản. Kiểm tra thông tin bên dưới rồi nhấn Thêm đăng nhập để xác nhận. Dữ liệu và quyền hiện có sẽ được giữ nguyên.';
              this.configure();
            }
            return EMPTY; // Require explicit confirmation; never mutate on email lookup.
          }
          return this.api.createAdminUser(data);
        }))
      : this.mode === 'credentials'
        ? this.api.addAccountCredentials(this.target!.Id, data)
        : this.api.resetAccountPassword(this.target!.Id, data.Password);
    request.pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.saving = false)).subscribe({
      next: response => {
        if (!response.Success) {
          this.error = response.ErrorMessage || 'Không thể lưu tài khoản.';
          return;
        }
        this.messages.success(this.mode === 'reset' ? 'Đã đặt lại mật khẩu.' : 'Đã lưu thông tin đăng nhập.');
        this.form.reset();
        this.visibleChange.emit(false);
        this.saved.emit();
      },
      error: err => {
        this.error = err?.error?.ErrorMessage || 'Không thể cập nhật tài khoản. Vui lòng thử lại.';
      },
    });
  }
}
