import { Injectable, NgZone, inject, signal } from '@angular/core';
import { format } from 'date-fns';
import { Subscription } from 'rxjs';
import { AuthService } from './auth.service';
import { CalendarEvent, PersonalCalendarService } from './personal-calendar.service';

@Injectable({ providedIn: 'root' })
export class CalendarNotificationService {
  private readonly auth = inject(AuthService);
  private readonly api = inject(PersonalCalendarService);
  private readonly zone = inject(NgZone);
  readonly events = signal<CalendarEvent[]>([]);
  readonly loading = signal(false);
  readonly error = signal(false);
  private userId = '';
  private day = '';
  private consumers = 0;
  private generation = 0;
  private request?: Subscription;
  private changes?: Subscription;
  private timer?: ReturnType<typeof setInterval>;
  private readonly onFocus = () => this.zone.run(() => { this.syncAccount(); this.refresh(); });
  get today(): string { return format(new Date(), 'yyyy-MM-dd'); }

  attach(): void {
    if (++this.consumers !== 1) return;
    this.changes = this.api.changed$.subscribe(() => this.refresh());
    window.addEventListener('focus', this.onFocus);
    this.zone.runOutsideAngular(() => {
      this.timer = setInterval(() => { if (!document.hidden) this.onFocus(); }, 60_000);
    });
    this.syncAccount();
  }
  detach(): void {
    if (--this.consumers !== 0) return;
    clearInterval(this.timer);
    window.removeEventListener('focus', this.onFocus);
    this.changes?.unsubscribe();
    this.reset('');
  }
  syncAccount(): void {
    const id = this.auth.isLoggedIn() && this.auth.hasPermission('calendar.use') ? (this.auth.getAccountInfo()?.nameid ?? '') : '';
    if (id === this.userId) return;
    this.reset(id);
    if (id) this.refresh();
  }
  refresh(): void {
    if (!this.userId) return;
    const day = this.today;
    if (day !== this.day) { this.day = day; this.events.set([]); }
    this.request?.unsubscribe();
    const generation = ++this.generation;
    this.loading.set(true); this.error.set(false);
    this.request = this.api.list(day, day).subscribe({
      next: events => {
        if (generation !== this.generation) return;
        this.events.set([...events].sort((a, b) => Number(b.AllDay) - Number(a.AllDay) || a.StartTime.localeCompare(b.StartTime) || a.Title.localeCompare(b.Title)));
        this.loading.set(false);
      },
      error: () => { if (generation !== this.generation) return; this.events.set([]); this.loading.set(false); this.error.set(true); },
    });
  }
  time(event: CalendarEvent): string {
    if (event.AllDay) return 'T_CALENDAR_ALL_DAY';
    if (event.StartDate < this.day && event.EndDate > this.day) return 'T_CALENDAR_ONGOING';
    if (event.StartDate < this.day) return `→ ${event.EndTime}`;
    if (event.EndDate > this.day) return `${event.StartTime} →`;
    return `${event.StartTime} – ${event.EndTime}`;
  }
  private reset(id: string): void {
    this.generation++; this.request?.unsubscribe(); this.userId = id; this.day = '';
    this.events.set([]); this.loading.set(false); this.error.set(false);
  }
}
