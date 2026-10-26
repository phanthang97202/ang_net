import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  NgZone,
  OnDestroy,
  Output,
  ViewChild,
  inject,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { environment } from '../../../environments/environment';
import {
  TurnstileApi,
  TurnstileService,
} from '../../services/turnstile.service';

@Component({
  selector: 'app-turnstile',
  standalone: true,
  imports: [TranslateModule],
  template: `
    <div #container></div>
    <div role="status" aria-live="polite" class="captcha-status">
      @if (status) {
        <span>{{ status | translate }}</span>
      }
      @if (status === 'T_COMMENT_CAPTCHA_LOAD_ERROR') {
        <button type="button" (click)="retry()">
          {{ 'T_COMMENT_CAPTCHA_RETRY' | translate }}
        </button>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        margin-top: 8px;
      }
      .captcha-status {
        color: var(--color-text-muted);
        font-size: 12px;
      }
      button {
        margin-left: 8px;
        background: transparent;
        border: 0;
        color: var(--color-accent);
        cursor: pointer;
        text-decoration: underline;
      }
    `,
  ],
})
export class TurnstileComponent implements AfterViewInit, OnDestroy {
  @ViewChild('container', { static: true }) container!: ElementRef<HTMLElement>;
  @Output() tokenChange = new EventEmitter<string>();
  private loader = inject(TurnstileService);
  private zone = inject(NgZone);
  private api?: TurnstileApi;
  private widget?: string;
  private destroyed = false;
  status = 'T_COMMENT_CAPTCHA_LOADING';

  ngAfterViewInit(): void {
    void Promise.resolve().then(() => {
      if (!this.destroyed) void this.mount();
    });
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    if (this.widget !== undefined) this.api?.remove(this.widget);
  }

  reset(): void {
    this.update('', 'T_COMMENT_CAPTCHA_LOADING');
    if (this.widget !== undefined) this.api?.reset(this.widget);
  }

  retry(): void {
    if (this.widget !== undefined) this.reset();
    else void this.mount();
  }

  private async mount(): Promise<void> {
    if (!environment.turnstileSiteKey) {
      this.update('', 'T_COMMENT_CAPTCHA_UNAVAILABLE');
      return;
    }
    this.update('', 'T_COMMENT_CAPTCHA_LOADING');
    try {
      const api = await this.loader.load();
      if (this.destroyed) return;
      this.api = api;
      this.widget = api.render(this.container.nativeElement, {
        sitekey: environment.turnstileSiteKey,
        action: 'news_comment',
        theme: 'auto',
        size: 'flexible',
        'response-field': false,
        callback: token => this.update(token, ''),
        'expired-callback': () => this.update('', 'T_COMMENT_CAPTCHA_EXPIRED'),
        'error-callback': () => this.update('', 'T_COMMENT_CAPTCHA_LOAD_ERROR'),
        'timeout-callback': () =>
          this.update('', 'T_COMMENT_CAPTCHA_LOAD_ERROR'),
      });
    } catch {
      this.update('', 'T_COMMENT_CAPTCHA_LOAD_ERROR');
    }
  }

  private update(token: string, status: string): void {
    if (this.destroyed) return;
    this.zone.run(() => {
      this.status = status;
      this.tokenChange.emit(token);
    });
  }
}
