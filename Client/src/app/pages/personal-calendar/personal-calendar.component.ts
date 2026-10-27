import { CommonModule } from '@angular/common';
import { Component, DestroyRef, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, NgForm } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { addMonths, eachDayOfInterval, endOfMonth, format, isSameDay, isSameMonth, startOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Subscription } from 'rxjs';
import { CalendarCategory, CalendarEvent as ApiEvent, CalendarEventRequest, PersonalCalendarService } from '../../services/personal-calendar.service';
import { vietnameseLunarDate, VietnameseLunarDate } from './vietnamese-lunar-date';

type Category = CalendarCategory;
interface CalendarEvent { id: string; version: number; title: string; date: string; endDate: string; start: string; end: string; allDay: boolean; category: Category; location: string; notes: string; }
interface CalendarDay { date: Date; key: string; inMonth: boolean; events: CalendarEvent[]; lunar: VietnameseLunarDate | null; }

@Component({
  selector: 'app-personal-calendar', standalone: true,
  imports: [CommonModule, FormsModule, NzIconModule],
  templateUrl: './personal-calendar.component.html',
  styleUrls: ['./personal-calendar-agenda.component.scss', './personal-calendar.component.scss', './personal-calendar-dialog.component.scss'],
})
export class PersonalCalendarComponent implements OnInit {
  @ViewChild('editor') editor?: ElementRef<HTMLDialogElement>;
  private readonly api = inject(PersonalCalendarService);
  private readonly destroy = inject(DestroyRef);
  private listRequest?: Subscription;
  private requestGeneration = 0;
  private readonly lunarCache = new Map<string, VietnameseLunarDate | null>();
  readonly categories: { id: Category; label: string }[] = [
    { id: 'personal', label: 'Cá nhân' }, { id: 'leisure', label: 'Đi chơi' },
    { id: 'routine', label: 'Sinh hoạt' }, { id: 'work', label: 'Công việc' },
  ];
  readonly weekdays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
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

  ngOnInit(): void { this.load(); }

  get title(): string { return `Tháng ${format(this.month, 'M, yyyy')}`; }
  get selectedLabel(): string { return format(this.selected, "EEEE, 'ngày' d 'tháng' M", { locale: vi }); }
  get monthEvents(): number { return this.events.filter(event => event.date <= format(endOfMonth(this.month), 'yyyy-MM-dd') && event.endDate >= format(this.month, 'yyyy-MM-dd')).length; }
  get days(): CalendarDay[] {
    const start = startOfWeek(startOfMonth(this.month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(this.month), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end }).map(date => ({ date, key: this.key(date), inMonth: isSameMonth(date, this.month), events: this.eventsFor(date), lunar: this.lunarFor(date) }));
  }
  get selectedEvents(): CalendarEvent[] { return this.eventsFor(this.selected); }
  get hasLeapMonth(): boolean { return this.days.some(day => day.inMonth && day.lunar?.leapMonth); }
  get isTodaySelected(): boolean { return isSameDay(this.today, this.selected); }
  key(date: Date): string { return format(date, 'yyyy-MM-dd'); }
  isSelected(date: Date): boolean { return isSameDay(this.selected, date); }
  isToday(date: Date): boolean { return isSameDay(this.today, date); }
  label(category: Category): string { return this.categories.find(item => item.id === category)?.label ?? ''; }
  dateLabel(date: Date): string { return format(date, "EEEE, 'ngày' d 'tháng' M 'năm' yyyy", { locale: vi }); }
  lunarLabel(lunar: VietnameseLunarDate | null): string {
    return lunar ? `âm lịch ngày ${lunar.day} tháng ${lunar.month}${lunar.leapMonth ? ' nhuận' : ''} năm ${lunar.year}` : 'không có dữ liệu âm lịch';
  }
  eventTime(event: CalendarEvent): string {
    if (event.allDay) return 'Cả ngày';
    return `${event.start} – ${event.end}`;
  }
  select(date: Date): void { const changed = !isSameMonth(date, this.month); this.selected = this.day(date); this.month = startOfMonth(date); if (changed) this.load(); }
  changeMonth(delta: number): void { this.month = addMonths(this.month, delta); this.selected = startOfMonth(this.month); this.load(); }
  goToday(): void { this.select(this.today); }
  openCreate(): void { this.editing = false; this.error = ''; this.draft = this.emptyEvent(this.selected); this.editor?.nativeElement.showModal(); }
  openEdit(event: CalendarEvent): void { this.editing = true; this.error = ''; this.draft = { ...event }; this.editor?.nativeElement.showModal(); }
  close(): void { if (!this.saving) this.editor?.nativeElement.close(); }
  load(): void {
    this.listRequest?.unsubscribe();
    const generation = ++this.requestGeneration;
    const from = startOfWeek(startOfMonth(this.month), { weekStartsOn: 1 });
    const to = endOfWeek(endOfMonth(this.month), { weekStartsOn: 1 });
    this.loading = true; this.loadError = ''; this.events = [];
    this.listRequest = this.api.list(this.key(from), this.key(to)).pipe(takeUntilDestroyed(this.destroy)).subscribe({
      next: events => { if (generation !== this.requestGeneration) return; this.events = events.map(event => this.fromApi(event)); this.loading = false; },
      error: () => { if (generation !== this.requestGeneration) return; this.loading = false; this.loadError = 'Không thể tải lịch. Vui lòng thử lại.'; },
    });
  }
  save(form: NgForm): void {
    if (this.saving) return;
    if (form.invalid || !this.draft.title.trim()) { this.error = 'Vui lòng nhập tên sự kiện và ngày hợp lệ.'; return; }
    if (this.draft.endDate < this.draft.date || (!this.draft.allDay && this.draft.endDate === this.draft.date && this.draft.end <= this.draft.start)) {
      this.error = 'Thời gian kết thúc phải sau thời gian bắt đầu.'; return;
    }
    const draft = { ...this.draft };
    const data: CalendarEventRequest = { Title: draft.title.trim(), StartDate: draft.date, EndDate: draft.endDate, StartTime: draft.allDay ? '' : draft.start, EndTime: draft.allDay ? '' : draft.end, AllDay: draft.allDay, Category: draft.category, Location: draft.location, Notes: draft.notes, Version: draft.version };
    this.saving = true; this.error = '';
    const request = this.editing ? this.api.update(draft.id, data) : this.api.create(data);
    request.pipe(takeUntilDestroyed(this.destroy)).subscribe({
      next: event => { this.saving = false; this.editor?.nativeElement.close(); this.selected = this.parseDay(event.StartDate); this.month = startOfMonth(this.selected); this.load(); },
      error: (error: HttpErrorResponse) => { this.saving = false; this.error = error.status === 409 ? 'Sự kiện đã thay đổi ở nơi khác. Hãy đóng và tải lại lịch trước khi sửa.' : 'Không thể lưu sự kiện. Nội dung vẫn được giữ để thử lại.'; },
    });
  }
  remove(): void {
    if (this.saving || !this.editing || !window.confirm('Xóa sự kiện này?')) return;
    this.saving = true; this.error = '';
    this.api.delete(this.draft.id, this.draft.version).pipe(takeUntilDestroyed(this.destroy)).subscribe({
      next: () => { this.saving = false; this.editor?.nativeElement.close(); this.load(); },
      error: (error: HttpErrorResponse) => { this.saving = false; this.error = error.status === 409 ? 'Sự kiện đã thay đổi ở nơi khác. Hãy đóng và tải lại lịch trước khi xóa.' : 'Không thể xóa sự kiện. Vui lòng thử lại.'; },
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
  private fromApi(event: ApiEvent): CalendarEvent { return { id: event.EventId, version: event.Version, title: event.Title, date: event.StartDate, endDate: event.EndDate, start: event.StartTime, end: event.EndTime, allDay: event.AllDay, category: event.Category, location: event.Location, notes: event.Notes }; }
}
