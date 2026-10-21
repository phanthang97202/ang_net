import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, LoadingService, ShowErrorService } from '../../services';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Observable } from 'rxjs';
import { AuthResponse } from '../../interfaces';
import { TranslateModule } from '@ngx-translate/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { environment } from '../../../environments/environment';
import {
  DEFAULT_LOGIN_IMAGE,
  LoginAppearance,
  LoginAppearanceService,
} from './login-appearance.service';
import { ConfigSkeletonComponent } from '../../components/config-skeleton/config-skeleton.component';
interface GoogleCredentialResponse {
  credential: string;
}

declare const google: {
  accounts: {
    id: {
      initialize(options: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
      }): void;
      renderButton(
        element: HTMLElement,
        options: {
          theme: string;
          size: string;
          shape: string;
          width: number;
          logo_alignment: string;
        }
      ): void;
    };
  };
};
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TranslateModule,
    NzButtonModule,
    NzFormModule,
    NzInputModule,
    NzIconModule,
    ConfigSkeletonComponent,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit, AfterViewInit, OnDestroy {
  authService = inject(AuthService);
  loadingService = inject(LoadingService);
  showErrorService = inject(ShowErrorService);
  passwordVisible = false;
  appearance: LoginAppearance = {
    image: '',
    description: null,
  };
  appearanceLoading = true;
  heroImageLoaded = false;
  private readonly loginAppearance = inject(LoginAppearanceService);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('googleButton', { static: true })
  private googleButton!: ElementRef<HTMLElement>;
  private readonly zone = inject(NgZone);
  private googleResizeObserver?: ResizeObserver;
  private googleScript?: HTMLScriptElement;
  private googleButtonWidth = 0;
  private readonly initializeGoogle = () => {
    google.accounts.id.initialize({
      client_id: environment.gg_client_id,
      callback: response =>
        this.zone.run(() => this.handleCredentialResponse(response)),
    });

    this.zone.runOutsideAngular(() => {
      this.renderGoogleButton();
      this.googleResizeObserver = new ResizeObserver(() =>
        this.renderGoogleButton()
      );
      this.googleResizeObserver.observe(this.googleButton.nativeElement);
    });
  };

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
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loginAppearance
      .load()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(appearance => {
        if (this.appearance.image !== appearance.image)
          this.heroImageLoaded = false;
        this.appearance = appearance;
        this.appearanceLoading = false;
      });
  }

  onHeroImageError(): void {
    // If even the bundled fallback fails, keep the plain background, not a loop.
    if (this.appearance.image === DEFAULT_LOGIN_IMAGE) {
      this.heroImageLoaded = true;
      return;
    }
    this.appearance = { ...this.appearance, image: DEFAULT_LOGIN_IMAGE };
  }

  ngAfterViewInit(): void {
    if (typeof google !== 'undefined') {
      this.initializeGoogle();
    } else {
      // SDK tải async; form tài khoản vẫn dùng được trong lúc chờ Google.
      this.googleScript =
        document.querySelector<HTMLScriptElement>(
          'script[src="https://accounts.google.com/gsi/client"]'
        ) ?? undefined;
      this.googleScript?.addEventListener('load', this.initializeGoogle, {
        once: true,
      });
    }
  }

  ngOnDestroy(): void {
    this.googleResizeObserver?.disconnect();
    this.googleScript?.removeEventListener('load', this.initializeGoogle);
  }

  private renderGoogleButton(): void {
    const element = this.googleButton.nativeElement;
    const width = Math.min(
      400,
      Math.floor(element.getBoundingClientRect().width)
    );
    if (width < 200 || width === this.googleButtonWidth) return;
    this.googleButtonWidth = width;

    // SDK không nhận chiều rộng %, nên đo lại khi form đổi kích thước.
    element.replaceChildren();
    google.accounts.id.renderButton(element, {
      theme: 'outline',
      size: 'large',
      shape: 'rectangular',
      width,
      logo_alignment: 'left',
    });
  }

  handleCredentialResponse(res: GoogleCredentialResponse): void {
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

        // Đưa vào khu quản trị nếu có bất kỳ quyền nào, không chỉ riêng Admin -
        // khớp với canActiveDashboard. Trước đây chỉ hỏi vai trò Admin nên người
        // được gán quyền vẫn bị đẩy ra trang chủ sau khi đăng nhập.
        const canAccessDashboard = this.authService.hasAnyPermissionAtAll();

        if (response?.Success) {
          this.message.create('success', 'Login successfully');
          this.router.navigate([canAccessDashboard ? '/dashboard' : '/']);
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
