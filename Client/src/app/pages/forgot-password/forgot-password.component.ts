import { Component, inject } from '@angular/core';
import {
  AntdModule,
  REUSE_COMPONENT_MODULES,
  REUSE_PIPE_MODULE,
} from '../../modules';
import { AuthService, LoadingService, ShowErrorService } from '../../services';
import {
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  Validators,
} from '@angular/forms';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { IForgotPasswordResponse } from '../../interfaces';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [AntdModule, ...REUSE_COMPONENT_MODULES, ...REUSE_PIPE_MODULE],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
})
export class ForgotPasswordComponent {
  authService = inject(AuthService);
  loadingService = inject(LoadingService);
  showErrorService = inject(ShowErrorService);

  isVisibleVerifyCode = true;

  validateForm: FormGroup<{
    email: FormControl<string>;
  }> = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  validateFormTokenCode: FormGroup<{
    tokenCode: FormControl<string>;
  }> = this.fb.group({
    tokenCode: ['', [Validators.required]],
  });

  constructor(
    private fb: NonNullableFormBuilder,
    private message: NzMessageService,
    private router: Router
  ) {}

  submitSendTokenCode(event: Event) {
    if (!this.validateForm.valid) {
      Object.values(this.validateForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      return;
    }
    const { email } = this.validateForm.value;
    const observable = this.authService.forgotPassword(email as string);
    this.handleGetTokenCode(observable);
  }

  submitVerifyTokenCode(event: Event) {
    Object.values(this.validateFormTokenCode.controls).forEach(control => {
      if (control.invalid) {
        control.markAsDirty();
        control.updateValueAndValidity({ onlySelf: true });
      }
      return;
    });
    console.log('event', event);
  }

  backToGetNewCode() {
    this.isVisibleVerifyCode = false;
  }

  private handleGetTokenCode(observer: Observable<IForgotPasswordResponse>) {
    observer.subscribe({
      next: response => {
        this.loadingService.setLoading(false);

        if (response?.Success) {
          this.isVisibleVerifyCode = true;
        } else {
          this.showErrorService.setShowError({
            icon: 'warning',
            message: JSON.stringify(response, null, 2),
            title: response?.ErrorMessage || 'Error',
          });
        }
      },
      error: err => {
        this.loadingService.setLoading(false);
        this.showErrorService.setShowError({
          title: err.message,
          message: JSON.stringify(err, null, 2),
        });
      },
      complete: () => {
        this.loadingService.setLoading(false);
      },
    });
  }
}
