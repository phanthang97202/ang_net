import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';

export type CalendarCategory = 'personal' | 'leisure' | 'routine' | 'work';
export interface CalendarEvent {
  EventId: string; Title: string; StartDate: string; EndDate: string; StartTime: string; EndTime: string;
  AllDay: boolean; Category: CalendarCategory; Location: string; Notes: string; Version: number;
}
export type CalendarEventRequest = Omit<CalendarEvent, 'EventId'>;

@Injectable({ providedIn: 'root' })
export class PersonalCalendarService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}PersonalCalendar`;
  list(from: string, to: string) {
    return this.http.get<CalendarEvent[]>(this.url, { params: new HttpParams().set('from', from).set('to', to) });
  }
  create(data: CalendarEventRequest) { return this.http.post<CalendarEvent>(this.url, data); }
  update(id: string, data: CalendarEventRequest) { return this.http.put<CalendarEvent>(`${this.url}/${encodeURIComponent(id)}`, data); }
  delete(id: string, version: number) { return this.http.delete<void>(`${this.url}/${encodeURIComponent(id)}`, { params: new HttpParams().set('version', version) }); }
}
