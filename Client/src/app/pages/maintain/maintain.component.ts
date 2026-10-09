import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-maintain',
  standalone: true,
  imports: [RouterLink],
  template: `
    <main class="maintenance-page">
      <section class="maintenance-card" aria-labelledby="maintenance-title">
        <span class="maintenance-icon" aria-hidden="true">⚙</span>
        <h1 id="maintenance-title">
          Hệ thống đang bảo trì, vui lòng thử lại sau!
        </h1>
        <a routerLink="/">Thử lại</a>
      </section>
    </main>
  `,
  styles: `
    :host {
      display: block;
      font-family: 'Montserrat', sans-serif;
    }
    .maintenance-page {
      min-height: 100dvh;
      display: grid;
      place-items: center;
      padding: 24px;
      background: var(--color-bg-page);
      color: var(--color-text);
    }
    .maintenance-card {
      width: min(100%, 520px);
      padding: 40px 28px;
      text-align: center;
      border: 1px solid var(--color-border);
      border-radius: 24px;
      background: var(--color-bg-card);
      box-shadow: 0 8px 30px var(--color-card-shadow);
    }
    .maintenance-icon {
      display: inline-grid;
      place-items: center;
      width: 64px;
      height: 64px;
      margin-bottom: 24px;
      border-radius: 20px;
      background: var(--color-accent-bg);
      color: var(--color-accent);
      font-size: 36px;
    }
    h1 {
      margin: 0 0 28px;
      color: inherit;
      font-size: clamp(20px, 4vw, 26px);
      font-weight: 800;
      line-height: 1.6;
    }
    a {
      display: inline-block;
      padding: 12px 24px;
      border-radius: 14px;
      background: var(--color-accent);
      color: white;
      font-size: 13px;
      font-weight: 700;
      text-decoration: none;
    }
    a:focus-visible {
      outline: 2px solid var(--color-accent);
      outline-offset: 4px;
    }
  `,
})
export class MaintainComponent {}
