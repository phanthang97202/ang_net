import { AfterViewInit, Component, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, LoadingService, ShowErrorService } from '../../services';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AuthResponse } from '../../interfaces';
import {
  AntdModule,
  REUSE_COMPONENT_MODULES,
  REUSE_PIPE_MODULE,
} from '../../modules';
import { environment } from '../../../environments/environment';
declare const google: any;
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [AntdModule, ...REUSE_COMPONENT_MODULES, ...REUSE_PIPE_MODULE],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements AfterViewInit {
  authService = inject(AuthService);
  loadingService = inject(LoadingService);
  showErrorService = inject(ShowErrorService);
  passwordVisible = true;

  validateForm: FormGroup<{
    userName: FormControl<string>;
    password: FormControl<string>;
  }> = this.fb.group({
    userName: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });
  constructor(
    private fb: NonNullableFormBuilder,
    private message: NzMessageService,
    private router: Router,
    private http: HttpClient
  ) {}

  ngAfterViewInit(): void {
    google.accounts.id.initialize({
      client_id: environment.gg_client_id,
      callback: (response: any) => this.handleCredentialResponse(response),
    });

    google.accounts.id.renderButton(document.getElementById('google-button'), {
      theme: 'outline',
      size: 'large',
    });
  }

  handleCredentialResponse(res: any): void {
    const idToken = res.credential;

    this.loadingService.setLoading(true);
    const observer = this.authService.signInWithGoogle(idToken);
    this.handleLoginResponse(observer);
  }

  submitForm(event: Event) {
    event.preventDefault();
    const { userName, password } = this.validateForm.value;

    if (userName && password) {
      this.loadingService.setLoading(true);
      const observer = this.authService.login({
        email: userName,
        password: password,
      });

      this.handleLoginResponse(observer);
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

  private handleLoginResponse(observer: Observable<AuthResponse>) {
    observer.subscribe({
      next: response => {
        this.loadingService.setLoading(false);

        const isAdmin = this.authService.isAdminPermission();

        if (response?.Success) {
          this.message.create('success', 'Login successfully');
          this.router.navigate([isAdmin ? '/dashboard' : '/']);
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
