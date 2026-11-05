import { CommonModule } from '@angular/common';
import { Component, DestroyRef, ElementRef, HostListener, OnInit, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek } from 'date-fns';
import { enUS, vi } from 'date-fns/locale';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { CalendarEvent, PersonalCalendarService } from '../../services/personal-calendar.service';
import { vietnameseLunarDate, VietnameseLunarDate } from '../../pages/personal-calendar/vietnamese-lunar-date';

interface HomeCalendarDay { date: Date; key: string; inMonth: boolean; lunar: VietnameseLunarDate | null; events: CalendarEvent[]; }

@Component({
  selector: 'app-home-calendar', standalone: true,
  imports: [CommonModule, RouterLink, NzIconModule, TranslateModule],
  templateUrl: './home-calendar.component.html', styleUrl: './home-calendar.component.scss',
})
export class HomeCalendarComponent implements OnInit {
  @ViewChild('calendarCard') calendarCard?: ElementRef<HTMLElement>;
  private readonly api = inject(PersonalCalendarService);
  private readonly destroy = inject(DestroyRef);
  private readonly translate = inject(TranslateService);
  private request?: Subscription;
  private generation = 0;
  readonly weekdays = ['T_CALENDAR_WEEKDAY_MON', 'T_CALENDAR_WEEKDAY_TUE', 'T_CALENDAR_WEEKDAY_WED', 'T_CALENDAR_WEEKDAY_THU', 'T_CALENDAR_WEEKDAY_FRI', 'T_CALENDAR_WEEKDAY_SAT', 'T_CALENDAR_WEEKDAY_SUN'];
  today = new Date(); month = startOfMonth(this.today);
  days: HomeCalendarDay[] = []; selected?: HomeCalendarDay;
  loading = false; loadError = false;

  ngOnInit(): void {
    this.load();
    this.api.changed$.pipe(takeUntilDestroyed(this.destroy)).subscribe(() => this.load());
  }
  get monthTitle(): string {
    return this.translate.instant('T_CALENDAR_MONTH_TITLE', { month: this.month.getMonth() + 1, monthName: format(this.month, 'LLLL', { locale: enUS }), year: this.month.getFullYear() });
  }
  get selectedTitle(): string {
    if (!this.selected) return '';
    return format(this.selected.date, this.translate.currentLang === 'en' ? 'EEEE, dd/MM' : 'EEEE, dd/MM', { locale: this.translate.currentLang === 'en' ? enUS : vi });
  }
  key(date: Date): string { return format(date, 'yyyy-MM-dd'); }
  isToday(day: HomeCalendarDay): boolean { return isSameDay(day.date, this.today); }
  trackDay(_index: number, day: HomeCalendarDay): string { return day.key; }
  trackEvent(_index: number, event: CalendarEvent): string { return `${event.EventId}|${event.StartDate}`; }
  changeMonth(delta: number): void { this.month = addMonths(this.month, delta); this.selected = undefined; this.load(); }
  select(day: HomeCalendarDay): void { this.selected = this.selected?.key === day.key ? undefined : day; }
  close(): void { this.selected = undefined; }
  @HostListener('document:click', ['$event']) outside(event: MouseEvent): void {
    if (this.selected && event.target instanceof Node && !this.calendarCard?.nativeElement.contains(event.target)) this.close();
  }
  @HostListener('document:keydown.escape') escape(): void { this.close(); }
  eventTime(event: CalendarEvent): string {
    if (event.AllDay) return this.translate.instant('T_CALENDAR_ALL_DAY');
    const date = this.selected?.key ?? '';
    if (event.StartDate < date && event.EndDate > date) return this.translate.instant('T_CALENDAR_ONGOING');
    if (event.StartDate < date) return this.translate.instant('T_CALENDAR_UNTIL', { time: event.EndTime?.slice(0, 5) });
    if (event.EndDate > date) return this.translate.instant('T_CALENDAR_FROM', { time: event.StartTime?.slice(0, 5) });
    return `${event.StartTime?.slice(0, 5)} – ${event.EndTime?.slice(0, 5)}`;
  }
  load(): void {
    this.request?.unsubscribe(); const generation = ++this.generation;
    const start = startOfWeek(startOfMonth(this.month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(this.month), { weekStartsOn: 1 });
    const dates = eachDayOfInterval({ start, end });
    this.days = dates.map(date => ({ date, key: this.key(date), inMonth: isSameMonth(date, this.month), lunar: vietnameseLunarDate(date), events: [] }));
    this.loading = true; this.loadError = false; this.selected = undefined;
    this.request = this.api.list(this.key(start), this.key(end)).pipe(takeUntilDestroyed(this.destroy)).subscribe({
      next: events => {
        if (generation !== this.generation) return;
        this.days = this.days.map(day => ({ ...day, events: events.filter(event => event.StartDate <= day.key && event.EndDate >= day.key).sort((a, b) => Number(b.AllDay) - Number(a.AllDay) || (a.StartTime || '').localeCompare(b.StartTime || '') || a.Title.localeCompare(b.Title)) }));
        if (this.selected) this.selected = this.days.find(day => day.key === this.selected?.key);
        this.loading = false;
      },
      error: () => { if (generation === this.generation) { this.loading = false; this.loadError = true; } },
    });
  }
}
