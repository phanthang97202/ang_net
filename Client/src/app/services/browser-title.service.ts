import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, NgZone, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';

/** Keeps page titles from both routing and article detail separate from chat alerts. */
@Injectable({ providedIn: 'root' })
export class BrowserTitleService extends Title {
  private readonly zone = inject(NgZone);
  private pageTitle: string;
  private unreadCount = 0;
  private showUnread = false;
  private timer?: ReturnType<typeof setInterval>;

  constructor() {
    super(inject(DOCUMENT));
    this.pageTitle = super.getTitle();
    inject(DestroyRef).onDestroy(() => this.setUnreadCount(0));
  }

  override setTitle(title: string): void {
    this.pageTitle = title;
    this.renderTitle();
  }

  setUnreadCount(count: number): void {
    this.unreadCount = count;
    if (count <= 0) {
      clearInterval(this.timer);
      this.timer = undefined;
      this.showUnread = false;
    } else if (this.timer === undefined) {
      // Updating only document.title does not need an application render every 3 seconds.
      this.zone.runOutsideAngular(() => {
        this.timer = setInterval(() => {
          this.showUnread = !this.showUnread;
          this.renderTitle();
        }, 3000);
      });
    }
    this.renderTitle();
  }

  private renderTitle(): void {
    super.setTitle(
      this.showUnread && this.unreadCount > 0
        ? `(${this.unreadCount} tin nhắn mới)`
        : this.pageTitle
    );
  }
}
