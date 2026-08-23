import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnDestroy,
  Output,
  ViewChild,
  inject,
} from '@angular/core';
import { environment } from '../../../environments/environment';

/* eslint-disable @typescript-eslint/no-explicit-any */
declare const window: any;

@Component({
  selector: 'app-google-signin-button',
  standalone: true,
  template: `<div #host class="google-signin"></div>`,
  styles: [
    `
      .google-signin {
        display: flex;
        justify-content: center;
        min-height: 40px;
      }
    `,
  ],
})
export class GoogleSigninButtonComponent implements AfterViewInit, OnDestroy {
  @Input() width = 300;
  @Input() shape: 'pill' | 'rectangular' = 'pill';

  /** Phát id_token của Google; nơi dùng tự quyết định làm gì tiếp (không tự điều hướng) */
  @Output() credential = new EventEmitter<string>();

  @ViewChild('host', { static: true }) host!: ElementRef<HTMLElement>;

  private zone = inject(NgZone);
  private timer?: ReturnType<typeof setTimeout>;

  ngAfterViewInit(): void {
    this.renderWhenSdkReady(0);
  }

  ngOnDestroy(): void {
    clearTimeout(this.timer);
  }

  /**
   * SDK Google nạp bằng async defer ở index.html nên lúc component khởi tạo có thể
   * chưa sẵn sàng - phải chờ rồi mới renderButton, thay vì gọi thẳng và hỏng im lặng.
   */
  private renderWhenSdkReady(attempt: number): void {
    const google = window.google;

    if (google?.accounts?.id) {
      // initialize là singleton toàn cục: phải gọi lại mỗi lần render, nếu không
      // component render sau sẽ chiếm mất callback của component render trước.
      google.accounts.id.initialize({
        client_id: environment.gg_client_id,
        callback: (response: any) =>
          this.zone.run(() => this.credential.emit(response.credential)),
      });

      google.accounts.id.renderButton(this.host.nativeElement, {
        theme: 'outline',
        size: 'large',
        shape: this.shape,
        width: this.width,
        logo_alignment: 'center',
      });
      return;
    }

    // Bỏ cuộc sau ~5 giây thay vì chờ mãi
    if (attempt > 50) {
      return;
    }

    this.timer = setTimeout(() => this.renderWhenSdkReady(attempt + 1), 100);
  }
}
