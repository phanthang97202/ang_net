import { NgTemplateOutlet } from '@angular/common';
import { AfterViewInit, Component, inject } from '@angular/core';
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
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AuthResponse } from '../../interfaces/auth-response';
import { TranslateModule } from '@ngx-translate/core';
declare const google: any;
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
    TranslateModule,
  ],
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
      client_id:
        '202020211023-c70kb86dn19s9q0tvotv94f04no8r1ct.apps.googleusercontent.com',
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
