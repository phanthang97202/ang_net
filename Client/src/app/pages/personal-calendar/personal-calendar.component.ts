import { CommonModule } from '@angular/common';
import { Component, DestroyRef, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, NgForm } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { addDays, addMonths, differenceInCalendarDays, eachDayOfInterval, endOfMonth, format, isSameDay, isSameMonth, startOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { enUS, vi } from 'date-fns/locale';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { CalendarCategory, CalendarEvent as ApiEvent, CalendarEventRequest, PersonalCalendarService } from '../../services/personal-calendar.service';
import { vietnameseLunarDate, VietnameseLunarDate } from './vietnamese-lunar-date';

type Category = CalendarCategory;
interface CalendarEvent { id: string; version: number; title: string; date: string; endDate: string; start: string; end: string; allDay: boolean; category: Category; location: string; notes: string; repeatDays?: number; repeatUntil?: string; seriesStartDate?: string; seriesEndDate?: string; }
interface CalendarDay { date: Date; key: string; inMonth: boolean; events: CalendarEvent[]; lunar: VietnameseLunarDate | null; }

@Component({
  selector: 'app-personal-calendar', standalone: true,
  imports: [CommonModule, FormsModule, NzIconModule, TranslateModule],
  templateUrl: './personal-calendar.component.html',
  styleUrls: ['./personal-calendar-agenda.component.scss', './personal-calendar.component.scss', './personal-calendar-dialog.component.scss'],
})
export class PersonalCalendarComponent implements OnInit {
  @ViewChild('editor') editor?: ElementRef<HTMLDialogElement>;
  private readonly api = inject(PersonalCalendarService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroy = inject(DestroyRef);
  private readonly translate = inject(TranslateService);
  private listRequest?: Subscription;
  private requestGeneration = 0;
  private readonly lunarCache = new Map<string, VietnameseLunarDate | null>();
  // label là khóa dịch trong vi.json / en.json
  readonly categories: { id: Category; label: string }[] = [
    { id: 'personal', label: 'T_CALENDAR_CATEGORY_PERSONAL' }, { id: 'leisure', label: 'T_CALENDAR_CATEGORY_LEISURE' },
    { id: 'routine', label: 'T_CALENDAR_CATEGORY_ROUTINE' }, { id: 'work', label: 'T_CALENDAR_CATEGORY_WORK' },
  ];
  readonly weekdays = ['T_CALENDAR_WEEKDAY_MON', 'T_CALENDAR_WEEKDAY_TUE', 'T_CALENDAR_WEEKDAY_WED', 'T_CALENDAR_WEEKDAY_THU', 'T_CALENDAR_WEEKDAY_FRI', 'T_CALENDAR_WEEKDAY_SAT', 'T_CALENDAR_WEEKDAY_SUN'];
  readonly repeatWeekdays = [{ label: 'T_CALENDAR_WEEKDAY_MON', bit: 2 }, { label: 'T_CALENDAR_WEEKDAY_TUE', bit: 4 }, { label: 'T_CALENDAR_WEEKDAY_WED', bit: 8 }, { label: 'T_CALENDAR_WEEKDAY_THU', bit: 16 }, { label: 'T_CALENDAR_WEEKDAY_FRI', bit: 32 }, { label: 'T_CALENDAR_WEEKDAY_SAT', bit: 64 }, { label: 'T_CALENDAR_WEEKDAY_SUN', bit: 1 }];
  readonly repeatLongDurations = Array.from({ length: 30 }, (_, index) => index + 2);
  readonly today = this.day(new Date());
  selected = this.today;
  month = startOfMonth(this.today);
  events: CalendarEvent[] = [];
  draft: CalendarEvent = this.emptyEvent(this.today);
  editing = false;
  error = '';
  loadError = '';
  loading = false;
  saving = false;
  repeatWeekly = false;

  ngOnInit(): void {
    this.load();
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroy)).subscribe(params => {
      const value = params.get('date');
      if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return;
      const date = this.parseDay(value);
      if (Number.isNaN(date.getTime()) || this.key(date) !== value) return;
      this.select(date);
    });
  }

  private get english(): boolean { return this.translate.currentLang === 'en'; }
  get title(): string { return this.translate.instant('T_CALENDAR_MONTH_TITLE', { month: this.month.getMonth() + 1, monthName: format(this.month, 'LLLL', { locale: enUS }), year: this.month.getFullYear() }); }
  get selectedLabel(): string { return this.english ? format(this.selected, 'EEEE, MMMM d', { locale: enUS }) : format(this.selected, "EEEE, 'ngày' d 'tháng' M", { locale: vi }); }
  get tileMonth(): string { return this.english ? format(this.selected, 'MMM', { locale: enUS }).toUpperCase() : `TH ${this.selected.getMonth() + 1}`; }
  get monthEvents(): number { return this.events.filter(event => event.date <= format(endOfMonth(this.month), 'yyyy-MM-dd') && event.endDate >= format(this.month, 'yyyy-MM-dd')).length; }
  get days(): CalendarDay[] {
    const start = startOfWeek(startOfMonth(this.month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(this.month), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end }).map(date => ({ date, key: this.key(date), inMonth: isSameMonth(date, this.month), events: this.eventsFor(date), lunar: this.lunarFor(date) }));
  }
  get selectedEvents(): CalendarEvent[] { return this.eventsFor(this.selected); }
  get hasLeapMonth(): boolean { return this.days.some(day => day.inMonth && day.lunar?.leapMonth); }
  get isTodaySelected(): boolean { return isSameDay(this.today, this.selected); }
  trackDay(_index: number, day: CalendarDay): string { return day.key; }
  key(date: Date): string { return format(date, 'yyyy-MM-dd'); }
  isSelected(date: Date): boolean { return isSameDay(this.selected, date); }
  isToday(date: Date): boolean { return isSameDay(this.today, date); }
  label(category: Category): string { return this.categories.find(item => item.id === category)?.label ?? ''; }
  dateLabel(date: Date): string { return this.english ? format(date, 'EEEE, MMMM d, yyyy', { locale: enUS }) : format(date, "EEEE, 'ngày' d 'tháng' M 'năm' yyyy", { locale: vi }); }
  lunarLabel(lunar: VietnameseLunarDate | null): string {
    if (!lunar) return this.translate.instant('T_CALENDAR_LUNAR_NONE');
    const leap = lunar.leapMonth ? this.translate.instant('T_CALENDAR_LUNAR_LEAP') : '';
    return this.translate.instant('T_CALENDAR_LUNAR_LABEL', { day: lunar.day, month: lunar.month, leap, year: lunar.year });
  }
  eventTime(event: CalendarEvent): string {
    if (event.allDay) return this.translate.instant('T_CALENDAR_ALL_DAY');
    const selected = this.key(this.selected);
    if (event.date < selected && event.endDate > selected) return this.translate.instant('T_CALENDAR_ONGOING');
    if (event.date < selected) return this.translate.instant('T_CALENDAR_UNTIL', { time: event.end });
    if (event.endDate > selected) return this.translate.instant('T_CALENDAR_FROM', { time: event.start });
    return `${event.start} – ${event.end}`;
  }
  select(date: Date): void { const changed = !isSameMonth(date, this.month); this.selected = this.day(date); this.month = startOfMonth(date); if (changed) this.load(); }
  changeMonth(delta: number): void { this.month = addMonths(this.month, delta); this.selected = startOfMonth(this.month); this.load(); }
  goToday(): void { this.select(this.today); }
  openCreate(): void { this.editing = false; this.repeatWeekly = false; this.error = ''; this.draft = this.emptyEvent(this.selected); this.editor?.nativeElement.showModal(); }
  openEdit(event: CalendarEvent): void { this.editing = true; this.repeatWeekly = !!event.repeatDays; this.error = ''; this.draft = { ...event, date: event.seriesStartDate || event.date, endDate: event.seriesEndDate || event.endDate }; this.editor?.nativeElement.showModal(); }
  get repeatDurationDays(): number {
    if (!this.draft.date || !this.draft.endDate) return 0;
    return differenceInCalendarDays(this.parseDay(this.draft.endDate), this.parseDay(this.draft.date));
  }
  setRepeatDuration(days: number): void {
    if (!this.draft.date || !Number.isInteger(days) || days < 0 || days > 31) return;
    this.draft.endDate = this.key(addDays(this.parseDay(this.draft.date), days));
  }
  changeStartDate(date: string): void {
    const duration = this.repeatDurationDays;
    this.draft.date = date;
    if (this.repeatWeekly && date && duration >= 0 && duration <= 31) this.setRepeatDuration(duration);
  }
  changeRepeat(enabled: boolean): void {
    this.repeatWeekly = enabled;
    if (enabled && this.repeatDurationDays === 0 && !this.draft.allDay && this.draft.end <= this.draft.start) this.setRepeatDuration(1);
  }
  changeTime(field: 'start' | 'end', value: string): void {
    this.draft[field] = value;
    if (this.repeatWeekly && this.repeatDurationDays === 0 && this.draft.start && this.draft.end && this.draft.end < this.draft.start) this.setRepeatDuration(1);
  }
  toggleRepeatDay(bit: number): void { this.draft.repeatDays = (this.draft.repeatDays || 0) ^ bit; }
  isRepeatDay(bit: number): boolean { return !!((this.draft.repeatDays || 0) & bit); }
  close(): void { if (!this.saving) this.editor?.nativeElement.close(); }
  load(): void {
    this.listRequest?.unsubscribe();
    const generation = ++this.requestGeneration;
    const from = startOfWeek(startOfMonth(this.month), { weekStartsOn: 1 });
    const to = endOfWeek(endOfMonth(this.month), { weekStartsOn: 1 });
    this.loading = true; this.loadError = ''; this.events = [];
    this.listRequest = this.api.list(this.key(from), this.key(to)).pipe(takeUntilDestroyed(this.destroy)).subscribe({
      next: events => { if (generation !== this.requestGeneration) return; this.events = events.map(event => this.fromApi(event)); this.loading = false; },
      error: () => { if (generation !== this.requestGeneration) return; this.loading = false; this.loadError = 'T_CALENDAR_LOAD_ERROR'; },
    });
  }
  save(form: NgForm): void {
    if (this.saving) return;
    if (form.invalid || !this.draft.title.trim()) { this.error = 'T_CALENDAR_VALIDATION_REQUIRED'; return; }
    if (this.draft.endDate < this.draft.date || (!this.draft.allDay && this.draft.endDate === this.draft.date && this.draft.end <= this.draft.start)) {
      this.error = 'T_CALENDAR_VALIDATION_END_AFTER_START'; return;
    }
    if (this.repeatWeekly && (!this.draft.repeatDays || (this.draft.repeatUntil && this.draft.repeatUntil < this.draft.date))) {
      this.error = 'T_CALENDAR_VALIDATION_REPEAT_DAYS'; return;
    }
    if (this.repeatWeekly && (this.parseDay(this.draft.endDate).getTime() - this.parseDay(this.draft.date).getTime()) / 86400000 > 31) {
      this.error = 'T_CALENDAR_VALIDATION_REPEAT_LENGTH'; return;
    }
    const draft = { ...this.draft };
    const data: CalendarEventRequest = { Title: draft.title.trim(), StartDate: draft.date, EndDate: draft.endDate, StartTime: draft.allDay ? '' : draft.start, EndTime: draft.allDay ? '' : draft.end, AllDay: draft.allDay, Category: draft.category, Location: draft.location, Notes: draft.notes, Version: draft.version, RepeatDays: this.repeatWeekly ? draft.repeatDays : 0, RepeatUntil: this.repeatWeekly ? draft.repeatUntil || null : null };
    this.saving = true; this.error = '';
    const request = this.editing ? this.api.update(draft.id, data) : this.api.create(data);
    request.pipe(takeUntilDestroyed(this.destroy)).subscribe({
      next: event => { this.saving = false; this.editor?.nativeElement.close(); if (!this.editing) { this.selected = this.parseDay(event.StartDate); this.month = startOfMonth(this.selected); } this.load(); },
      error: (error: HttpErrorResponse) => { this.saving = false; this.error = error.status === 409 ? 'T_CALENDAR_SAVE_CONFLICT' : 'T_CALENDAR_SAVE_ERROR'; },
    });
  }
  remove(): void {
    if (this.saving || !this.editing || !window.confirm(this.translate.instant(this.draft.repeatDays ? 'T_CALENDAR_DELETE_SERIES_CONFIRM' : 'T_CALENDAR_DELETE_CONFIRM'))) return;
    this.saving = true; this.error = '';
    this.api.delete(this.draft.id, this.draft.version).pipe(takeUntilDestroyed(this.destroy)).subscribe({
      next: () => { this.saving = false; this.editor?.nativeElement.close(); this.load(); },
      error: (error: HttpErrorResponse) => { this.saving = false; this.error = error.status === 409 ? 'T_CALENDAR_DELETE_CONFLICT' : 'T_CALENDAR_DELETE_ERROR'; },
    });
  }
  private eventsFor(date: Date): CalendarEvent[] {
    const key = this.key(date);
    return this.events.filter(event => event.date <= key && event.endDate >= key)
      .sort((a, b) => Number(b.allDay) - Number(a.allDay) || a.start.localeCompare(b.start) || a.title.localeCompare(b.title));
  }
  private day(date: Date): Date { return new Date(date.getFullYear(), date.getMonth(), date.getDate()); }
  private lunarFor(date: Date): VietnameseLunarDate | null {
    const key = this.key(date);
    if (!this.lunarCache.has(key)) {
      if (this.lunarCache.size >= 500) this.lunarCache.clear();
      this.lunarCache.set(key, vietnameseLunarDate(date));
    }
    return this.lunarCache.get(key) ?? null;
  }
  private parseDay(value: string): Date { const [year, month, day] = value.split('-').map(Number); return new Date(year, month - 1, day); }
  private emptyEvent(date: Date): CalendarEvent { const key = this.key(date); return { id: '', version: 0, title: '', date: key, endDate: key, start: '09:00', end: '10:00', allDay: false, category: 'personal', location: '', notes: '' }; }
  private fromApi(event: ApiEvent): CalendarEvent { return { id: event.EventId, version: event.Version, title: event.Title, date: event.StartDate, endDate: event.EndDate, start: event.StartTime, end: event.EndTime, allDay: event.AllDay, category: event.Category, location: event.Location, notes: event.Notes, repeatDays: event.RepeatDays, repeatUntil: event.RepeatUntil || '', seriesStartDate: event.SeriesStartDate, seriesEndDate: event.SeriesEndDate }; }
}
