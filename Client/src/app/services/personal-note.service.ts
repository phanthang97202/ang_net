import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import {
  PersonalNote,
  PersonalNotePage,
  PersonalNoteSave,
  PublicPersonalNote,
  PersonalNotePublish,
  SharedPersonalNote,
} from '../interfaces/personal-note';

@Injectable({ providedIn: 'root' })
export class PersonalNoteService {
  private http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}PersonalNotes`;
  list(keyword: string, cursor: string | null) {
    let params = new HttpParams().set('keyword', keyword).set('pageSize', 20);
    if (cursor) params = params.set('cursor', cursor);
    return this.http.get<PersonalNotePage>(this.url, { params });
  }
  get(id: string) {
    return this.http.get<PersonalNote>(`${this.url}/${encodeURIComponent(id)}`);
  }
  save(id: string, body: PersonalNoteSave) {
    return this.http.put<PersonalNote>(
      `${this.url}/${encodeURIComponent(id)}`,
      body
    );
  }
  delete(id: string, version: number) {
    return this.http.delete<void>(`${this.url}/${encodeURIComponent(id)}`, {
      params: { version },
    });
  }
  publish(id: string, body: PersonalNotePublish) {
    return this.http.post<PersonalNote>(
      `${this.url}/${encodeURIComponent(id)}/publish`,
      body
    );
  }
  unpublish(id: string, version: number) {
    return this.http.delete<PersonalNote>(
      `${this.url}/${encodeURIComponent(id)}/publication`,
      { params: { version } }
    );
  }
  publicNote(token: string) {
    return this.http.get<PublicPersonalNote>(
      `${environment.apiUrl}PublicPersonalNotes/${encodeURIComponent(token)}`
    );
  }
  revokeEditing(id: string, version: number) {
    return this.http.delete<PersonalNote>(
      `${this.url}/${encodeURIComponent(id)}/edit-link`,
      { params: { version } }
    );
  }
  sharedNote(token: string) {
    return this.http.get<SharedPersonalNote>(
      `${environment.apiUrl}SharedPersonalNotes/${encodeURIComponent(token)}`
    );
  }
  saveShared(token: string, body: PersonalNoteSave) {
    return this.http.put<SharedPersonalNote>(
      `${environment.apiUrl}SharedPersonalNotes/${encodeURIComponent(token)}`,
      body
    );
  }
}
