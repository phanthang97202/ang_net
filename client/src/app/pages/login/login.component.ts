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
import {
  BehaviorSubject,
  from,
  interval,
  of,
  ReplaySubject,
  Subject,
  takeUntil,
} from 'rxjs';
import { Observable } from 'rxjs';

import { HttpClient } from '@angular/common/http';
import { AuthResponse } from '../../interfaces/auth-response';
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
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements AfterViewInit {
  authService = inject(AuthService);
  loadingService = inject(LoadingService);
  showErrorService = inject(ShowErrorService);

  constructor(
    private fb: NonNullableFormBuilder,
    private message: NzMessageService,
    private router: Router,
    private http: HttpClient
  ) {
    // const testOb = of(1, 2, 3);
    // testOb.subscribe(v => console.log(v));

    // from({ name: 'thang' }).subscribe(v => console.log(v));

    // const subject = new Subject<string>();

    // subject.subscribe(value => console.log('Subscriber 1:', value));

    // subject.next('🚀 Giá trị 1'); // Subscriber 1 nhận được
    // subject.next('🔥 Giá trị 2'); // Subscriber 1 nhận được

    // subject.subscribe(value => console.log('Subscriber 2:', value));

    // subject.next('🎉 Giá trị 3');
    // Cả Subscriber 1 và 2 đều nhận được '🎉 Giá trị 3'
    // Nhưng Subscriber 2 không nhận được '🚀 Giá trị 1' và '🔥 Giá trị 2'

    // const behaviorSubject = new BehaviorSubject<string>('🌱 Giá trị mặc định');

    // behaviorSubject.subscribe(value => console.log('Subscriber 1:', value));

    // behaviorSubject.next('🚀 Giá trị 1');
    // behaviorSubject.next('🔥 Giá trị 2');

    // behaviorSubject.subscribe(value => console.log('Subscriber 2:', value));
    // // Subscriber 2 nhận ngay '🔥 Giá trị 2' (giá trị gần nhất)

    // behaviorSubject.next('🎉 Giá trị 3');
    // // Cả 2 subscriber đều nhận được

    // const replaySubject = new ReplaySubject<string>(2); // Lưu trữ 2 giá trị gần nhất

    // replaySubject.next('🚀 Giá trị 1');
    // replaySubject.next('🔥 Giá trị 2');
    // replaySubject.next('🎉 Giá trị 3');

    // replaySubject.subscribe(value => console.log('Subscriber 1:', value));
    // // Subscriber 1 nhận được '🔥 Giá trị 2' và '🎉 Giá trị 3'
    // console.log('======================');
    // replaySubject.next('💡 Giá trị 4');
    // replaySubject.next('💡 Giá trị 5');
    // replaySubject.next('💡 Giá trị 6');
    // replaySubject.subscribe(value => console.log('Subscriber 2:', value));
    // // Subscriber 2 nhận được '💡 Giá trị 5'
    // // Subscriber 2 nhận được '💡 Giá trị 6'

    console.log('======================');
    const replaySubject = new ReplaySubject<number>(2); // Lưu trữ 2 giá trị gần nhất
    // Subscriber 1 đăng ký ngay lập tức
    replaySubject.subscribe(value => console.log('Subscriber 1 nhận:', value));

    replaySubject.next(1); // Phát giá trị 1
    replaySubject.next(2); // Phát giá trị 2
    replaySubject.next(3); // Phát giá trị 3
    replaySubject.next(4); // Phát giá trị 4
    // Bộ nhớ ReplaySubject lưu giá trị: [3, 4]

    // Subscriber 2 đăng ký muộn
    replaySubject.subscribe(value => console.log('Subscriber 2 nhận:', value));

    replaySubject.next(5); // Phát giá trị 5
    replaySubject.next(6); // Phát giá trị 5
    replaySubject.next(7); // Phát giá trị 5
    replaySubject
      .pipe(takeUntil(interval(2000)))
      .subscribe(value => console.log('Subscriber 3 nhận:', value));
  }

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

  passwordVisible = true;

  validateForm: FormGroup<{
    userName: FormControl<string>;
    password: FormControl<string>;
  }> = this.fb.group({
    userName: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  handleCredentialResponse(res: any): void {
    const idToken = res.credential;
    console.log('Google ID Token:', idToken);

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
