import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

export interface TurnstileApi {
  render(
    container: HTMLElement,
    options: {
      sitekey: string;
      action: string;
      theme: 'auto';
      size: 'flexible';
      'response-field': boolean;
      callback: (token: string) => void;
      'expired-callback': () => void;
      'error-callback': () => void;
      'timeout-callback': () => void;
    }
  ): string;
  reset(widget: string): void;
  remove(widget: string): void;
}

@Injectable({ providedIn: 'root' })
export class TurnstileService {
  private document = inject(DOCUMENT);
  private loading?: Promise<TurnstileApi>;

  load(): Promise<TurnstileApi> {
    const window = this.document.defaultView as
      | (Window & { turnstile?: TurnstileApi })
      | null;
    if (window?.turnstile) return Promise.resolve(window.turnstile);
    if (this.loading) return this.loading;

    this.loading = new Promise<TurnstileApi>((resolve, reject) => {
      const script = this.document.createElement('script');
      script.src =
        'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      const failed = () => {
        clearTimeout(timer);
        script.remove();
        reject(new Error('Turnstile could not load'));
      };
      const timer = setTimeout(failed, 15000);
      script.onerror = failed;
      script.onload = () => {
        clearTimeout(timer);
        if (window?.turnstile) resolve(window.turnstile);
        else failed();
      };
      this.document.head.appendChild(script);
    }).catch(error => {
      this.loading = undefined;
      throw error;
    });
    return this.loading;
  }
}
