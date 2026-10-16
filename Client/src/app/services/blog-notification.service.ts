import { Injectable, NgZone, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import {
  HubConnection,
  HubConnectionState,
  HubConnectionBuilder,
  HttpTransportType,
} from '@microsoft/signalr';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import {
  BlogNotification,
  BlogNotificationPage,
} from '../interfaces/blog-notification';

@Injectable({ providedIn: 'root' })
export class BlogNotificationService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private zone = inject(NgZone);
  private readonly url = `${environment.apiUrl}Notifications`;
  readonly unread = signal(0);
  readonly items = signal<BlogNotification[]>([]);
  readonly loading = signal(false);
  readonly error = signal(false);
  readonly saving = signal(false);
  readonly activeMenu = signal<string | null>(null);
  readonly hasMore = signal(false);
  private snapshot: string | null = null;
  private cursor: string | null = null;
  private userId = '';
  private generation = 0;
  private revision = 0;
  private unreadRequest = 0;
  private pageRequest = 0;
  private pendingReads = 0;
  private consumers = 0;
  private cancel = new Subject<void>();
  private timer?: ReturnType<typeof setInterval>;
  private connection?: HubConnection;
  private readonly onFocus = (): void => {
    this.zone.run(() => {
      this.syncAccount();
      this.refreshUnread();
      if (this.connection?.state === HubConnectionState.Disconnected) {
        const connection = this.connection;
        this.zone.runOutsideAngular(() => {
          void connection.start().catch(() => undefined);
        });
      }
    });
  };

  attach(): void {
    if (++this.consumers !== 1) return;
    this.syncAccount();
    window.addEventListener('focus', this.onFocus);
    this.zone.runOutsideAngular(() => {
      this.timer = setInterval(() => {
        if (!document.hidden) this.onFocus();
      }, 30_000);
    });
  }

  detach(): void {
    if (--this.consumers !== 0) return;
    clearInterval(this.timer);
    window.removeEventListener('focus', this.onFocus);
    this.reset('');
  }

  syncAccount(): void {
    const id = this.auth.isLoggedIn()
      ? (this.auth.getAccountInfo()?.nameid ?? '')
      : '';
    if (id === this.userId) return;
    this.reset(id);
    if (!id) return;
    this.refreshUnread();
    this.connect();
  }

  private reset(id: string): void {
    this.generation++;
    this.cancel.next();
    void this.connection?.stop();
    this.connection = undefined;
    this.userId = id;
    this.items.set([]);
    this.unread.set(0);
    this.loading.set(false);
    this.saving.set(false);
    this.pendingReads = 0;
    this.error.set(false);
    this.hasMore.set(false);
    this.activeMenu.set(null);
    this.cursor = this.snapshot = null;
  }

  private connect(): void {
    const generation = this.generation;
    const connection = new HubConnectionBuilder()
      .withUrl(`${environment.wsUrl}notification-hub`, {
        accessTokenFactory: () => this.auth.getToken() ?? '',
        skipNegotiation: true,
        transport: HttpTransportType.WebSockets,
      })
      .withAutomaticReconnect([0, 2000, 10000, 30000])
      .build();
    const changed = (): void =>
      this.zone.run(() => {
        if (generation !== this.generation) return;
        this.refreshUnread();
        if (this.activeMenu()) this.load(true);
      });
    connection.on('NotificationsChanged', changed);
    connection.onreconnected(changed);
    this.connection = connection;
    this.zone.runOutsideAngular(() => {
      void connection.start().catch(() => undefined);
    });
  }

  refreshUnread(): void {
    if (!this.userId) return;
    const revision = this.revision;
    const request = ++this.unreadRequest;
    this.http
      .get<{ UnreadCount: number }>(`${this.url}/Unread`)
      .pipe(takeUntil(this.cancel))
      .subscribe({
        next: result => {
          if (revision === this.revision && request === this.unreadRequest)
            this.unread.set(result.UnreadCount);
        },
        error: () => undefined,
      });
  }

  show(id: string, open: boolean): void {
    if (!open) {
      if (this.activeMenu() === id) this.activeMenu.set(null);
      return;
    }
    this.activeMenu.set(id);
    this.load(true);
  }

  load(reset = false): void {
    if (!this.userId || (!reset && (this.loading() || !this.hasMore()))) return;
    const request = ++this.pageRequest;
    const revision = this.revision;
    if (reset) {
      this.cursor = null;
      this.snapshot = null;
      this.hasMore.set(false);
    }
    this.loading.set(true);
    this.error.set(false);
    let params = new HttpParams().set('pageSize', 15);
    if (this.cursor) params = params.set('cursor', this.cursor);
    this.http
      .get<{ Success: boolean; objResult: BlogNotificationPage }>(this.url, {
        params,
      })
      .pipe(takeUntil(this.cancel))
      .subscribe({
        next: response => {
          if (request !== this.pageRequest) return;
          this.loading.set(false);
          if (!response.Success || !response.objResult) {
            this.error.set(true);
            return;
          }
          // A response fetched before a read must not restore old unread rows.
          if (revision !== this.revision) {
            this.load(true);
            return;
          }
          const page = response.objResult;
          const existing = reset ? [] : this.items();
          const seen = new Set(existing.map(item => item.NotificationId));
          this.items.set([
            ...existing,
            ...page.DataList.filter(item => !seen.has(item.NotificationId)),
          ]);
          this.cursor = page.NextCursor;
          this.snapshot = page.SnapshotAt;
          this.hasMore.set(page.HasMore);
          if (revision === this.revision) this.unread.set(page.UnreadCount);
        },
        error: () => {
          if (request !== this.pageRequest) return;
          this.loading.set(false);
          this.error.set(true);
        },
      });
  }

  read(item?: BlogNotification): void {
    if (!this.userId || (!item && (this.saving() || !this.snapshot))) return;
    this.pendingReads++;
    this.saving.set(true);
    this.revision++;
    const through = this.snapshot;
    const url = item
      ? `${this.url}/${encodeURIComponent(item.NotificationId)}/Read`
      : `${this.url}/ReadAll`;
    this.http
      .post<{ UnreadCount: number }>(url, item ? {} : { Through: through })
      .pipe(takeUntil(this.cancel))
      .subscribe({
        next: response => {
          this.revision++;
          this.saving.set(--this.pendingReads > 0);
          this.unread.set(response.UnreadCount);
          this.items.update(items =>
            items.map(row =>
              (
                item
                  ? row.NotificationId === item.NotificationId
                  : Date.parse(row.CreatedAt) <= Date.parse(through!)
              )
                ? { ...row, ReadAt: row.ReadAt ?? new Date().toISOString() }
                : row
            )
          );
          if (!this.pendingReads) this.refreshUnread();
        },
        error: () => {
          this.saving.set(--this.pendingReads > 0);
          this.error.set(true);
          this.refreshUnread();
        },
      });
  }
}
