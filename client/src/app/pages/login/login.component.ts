import { NgTemplateOutlet } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { NzCheckboxComponent } from 'ng-zorro-antd/checkbox';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { AuthService } from '../../services/auth.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { LoadingService } from '../../services/loading-service.service';
import { ShowErrorService } from '../../services/show-error.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    RouterLink,
    NgTemplateOutlet,
    NzIconModule,
    ReactiveFormsModule,
    NzCheckboxComponent,
    NzFormModule,
    NzInputModule,
    NzButtonComponent,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  authService = inject(AuthService);
  loadingService = inject(LoadingService);
  showErrorService = inject(ShowErrorService);

  constructor(
    private fb: NonNullableFormBuilder,
    private message: NzMessageService,
    private router: Router
  ) {}

  passwordVisible = true;

  validateForm: FormGroup<{
    userName: FormControl<string>;
    password: FormControl<string>;
  }> = this.fb.group({
    userName: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  submitForm(event: Event) {
    event.preventDefault();
    const { userName, password } = this.validateForm.value;
    if (userName && password) {
      this.loadingService.setLoading(true);
      const observer = this.authService.login({
        email: userName,
        password: password,
      });

      observer.subscribe({
        next: response => {
          this.loadingService.setLoading(false);

          const isAdmin = this.authService.isAdminPermission();

          if (response?.Success) {
            this.message.create('success', 'Login successfully');
            if (isAdmin) {
              this.router.navigate(['/dashboard']);
            } else {
              this.router.navigate(['/']);
            }
          } else {
            this.showErrorService.setShowError({
              icon: 'warning',
              message: JSON.stringify(response, null, 2),
              title: response?.ErrorMessage || 'Error',
            });
          }
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
          // const { message } = err.error;
          // this.message.create('error', JSON.stringify(err));
        },
      });
    }

    if (!this.validateForm.valid) {
      Object.values(this.validateForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }
}
