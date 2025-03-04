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
import { BehaviorSubject, from, of, ReplaySubject, Subject } from 'rxjs';
import { Observable } from 'ckeditor5';

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
    console.log('======================');

    // const behaviorSubject = new BehaviorSubject<string>('🌱 Giá trị mặc định');

    // behaviorSubject.subscribe(value => console.log('Subscriber 1:', value));

    // behaviorSubject.next('🚀 Giá trị 1');
    // behaviorSubject.next('🔥 Giá trị 2');

    // behaviorSubject.subscribe(value => console.log('Subscriber 2:', value));
    // // Subscriber 2 nhận ngay '🔥 Giá trị 2' (giá trị gần nhất)

    // behaviorSubject.next('🎉 Giá trị 3');
    // // Cả 2 subscriber đều nhận được

    const replaySubject = new ReplaySubject<string>(2); // Lưu trữ 2 giá trị gần nhất

    replaySubject.next('🚀 Giá trị 1');
    replaySubject.next('🔥 Giá trị 2');
    replaySubject.next('🎉 Giá trị 3');

    replaySubject.subscribe(value => console.log('Subscriber 1:', value));
    // Subscriber 1 nhận được '🔥 Giá trị 2' và '🎉 Giá trị 3'
    console.log('======================');
    replaySubject.next('💡 Giá trị 4');
    replaySubject.next('💡 Giá trị 5');
    replaySubject.next('💡 Giá trị 6');
    // Subscriber 1 nhận được '💡 Giá trị 4'
  }

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
