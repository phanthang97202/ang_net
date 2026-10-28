import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { Subject, tap } from 'rxjs';

// Mã mục trong LookupList của người dùng (CALENDAR_CATEGORY / CALENDAR_STATUS). Mặc định:
// personal, leisure, routine, work và todo, in_progress, urgent, done, cancelled.
export type CalendarCategory = string;
export type CalendarStatus = string;
export interface CalendarEvent {
  EventId: string; Title: string; StartDate: string; EndDate: string; StartTime: string; EndTime: string;
  AllDay: boolean; Category: CalendarCategory; Location: string; Notes: string; Version: number;
  RepeatDays?: number; RepeatUntil?: string | null; SeriesStartDate?: string; SeriesEndDate?: string;
  // Trạng thái của buổi này (chuỗi lặp có thể khác nhau giữa các buổi).
  Status?: CalendarStatus;
}
// Status chỉ gửi khi tạo; trạng thái từng buổi đổi qua setStatus.
export type CalendarEventRequest = Omit<CalendarEvent, 'EventId' | 'SeriesStartDate' | 'SeriesEndDate'>;
// Việc theo trạng thái trên mọi ngày; Counts luôn tính trên toàn bộ việc.
export interface CalendarTasks { Counts: Record<string, number>; Total: number; Items: CalendarEvent[]; }

@Injectable({ providedIn: 'root' })
export class PersonalCalendarService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}PersonalCalendar`;
  private readonly changedSubject = new Subject<void>();
  readonly changed$ = this.changedSubject.asObservable();
  list(from: string, to: string) {
    return this.http.get<CalendarEvent[]>(this.url, { params: new HttpParams().set('from', from).set('to', to) });
  }
  tasks(today: string, status?: CalendarStatus) {
    const params = new HttpParams().set('today', today);
    return this.http.get<CalendarTasks>(`${this.url}/tasks`, { params: status ? params.set('status', status) : params });
  }
  create(data: CalendarEventRequest) { return this.http.post<CalendarEvent>(this.url, data).pipe(tap(() => this.changedSubject.next())); }
  update(id: string, data: CalendarEventRequest) { return this.http.put<CalendarEvent>(`${this.url}/${encodeURIComponent(id)}`, data).pipe(tap(() => this.changedSubject.next())); }
  setStatus(id: string, date: string, status: CalendarStatus) { return this.http.put<CalendarEvent>(`${this.url}/${encodeURIComponent(id)}/status`, { Date: date, Status: status }).pipe(tap(() => this.changedSubject.next())); }
  delete(id: string, version: number) { return this.http.delete<void>(`${this.url}/${encodeURIComponent(id)}`, { params: new HttpParams().set('version', version) }).pipe(tap(() => this.changedSubject.next())); }
}
