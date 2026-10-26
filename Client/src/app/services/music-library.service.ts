import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, map, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  IMusicCollectionResponse,
  IMusicCollectionSave,
  IMusicLibraryBoolResponse,
  IMusicLibraryTrackResponse,
  IMusicTrackKey,
  IMusicTrackKeyResponse,
  IMusicTrackPreview,
  TMusicProvider,
} from '../interfaces';

export function musicTrackKey(
  provider: TMusicProvider,
  externalId: string
): string {
  return `${provider}:${externalId}`;
}

export interface MusicSaveToast {
  track: IMusicTrackPreview;
  saved: boolean;
}

/**
 * API của Thư viện nhạc + trạng thái dùng chung giữa các tab:
 *  - savedKeys: bài nào đã lưu (để tô nút ♥ ở kết quả YouTube/Audius/Thư viện),
 *  - pickerTrack / toast: modal "Thêm vào bộ sưu tập" và toast sau khi lưu chỉ
 *    đặt một lần ở trang, mọi nút ♥ đều mở chung,
 *  - changes: tăng mỗi khi thư viện đổi để tab Thư viện tải lại.
 */
@Injectable({ providedIn: 'root' })
export class MusicLibraryService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}musiclibrary`;

  /** key (Provider:ExternalId) -> TrackId của các bài đã lưu mà client từng hỏi tới */
  readonly savedKeys = signal<ReadonlyMap<string, string>>(new Map());
  readonly pickerTrack = signal<IMusicTrackPreview | null>(null);
  readonly toast = signal<MusicSaveToast | null>(null);
  readonly changes = signal(0);

  isSaved(provider: TMusicProvider, externalId: string): boolean {
    return this.savedKeys().has(musicTrackKey(provider, externalId));
  }

  /** Hỏi một lần cho cả danh sách (vd. 20 kết quả tìm kiếm). */
  refreshSaveState(tracks: IMusicTrackKey[]): void {
    const keys = tracks
      .filter(t => !!t.ExternalId)
      .map(t => ({ Provider: t.Provider, ExternalId: t.ExternalId }));
    if (keys.length === 0) return;

    this.http
      .post<IMusicTrackKeyResponse>(`${this.apiUrl}/savestate`, {
        Tracks: keys,
      })
      .subscribe({
        next: response => {
          if (!response?.Success) return;
          const next = new Map(this.savedKeys());
          keys.forEach(k =>
            next.delete(musicTrackKey(k.Provider, k.ExternalId))
          );
          (response.DataList ?? []).forEach(k =>
            next.set(musicTrackKey(k.Provider, k.ExternalId), k.TrackId ?? '')
          );
          this.savedKeys.set(next);
        },
        error: () => {
          // Không tô được trạng thái thì nút ♥ hiện như chưa lưu, bấm vẫn lưu đúng
        },
      });
  }

  saved(
    pageIndex: number,
    pageSize: number
  ): Observable<IMusicLibraryTrackResponse> {
    return this.http.get<IMusicLibraryTrackResponse>(
      `${this.apiUrl}/saved?pageIndex=${pageIndex}&pageSize=${pageSize}`
    );
  }

  save(track: IMusicTrackKey): Observable<IMusicLibraryTrackResponse> {
    return this.http
      .post<IMusicLibraryTrackResponse>(`${this.apiUrl}/save`, {
        Provider: track.Provider,
        ExternalId: track.ExternalId,
      })
      .pipe(
        tap(response => {
          if (!response?.Success || !response.Data) return;
          this.markSaved(track, response.Data.TrackId);
          this.notifyChanged();
        })
      );
  }

  unsave(track: IMusicTrackKey): Observable<IMusicLibraryBoolResponse> {
    const trackId =
      track.TrackId ||
      this.savedKeys().get(musicTrackKey(track.Provider, track.ExternalId)) ||
      '';
    if (!trackId) {
      return of({ Success: true, Data: true } as IMusicLibraryBoolResponse);
    }

    return this.http
      .delete<IMusicLibraryBoolResponse>(
        `${this.apiUrl}/save?trackId=${encodeURIComponent(trackId)}`
      )
      .pipe(
        tap(response => {
          if (!response?.Success) return;
          const next = new Map(this.savedKeys());
          next.delete(musicTrackKey(track.Provider, track.ExternalId));
          this.savedKeys.set(next);
          this.notifyChanged();
        })
      );
  }

  /** Bấm ♥: lưu hoặc bỏ lưu. Trả về trạng thái mới, lỗi thì ném ra cho nút xử lý. */
  toggleSave(track: IMusicTrackPreview): Observable<boolean> {
    if (this.isSaved(track.Provider, track.ExternalId)) {
      return this.unsave(track).pipe(
        map(response => {
          if (!response?.Success) throw new Error(response?.ErrorMessage || '');
          this.toast.set({ track, saved: false });
          return false;
        })
      );
    }

    return this.save(track).pipe(
      map(response => {
        if (!response?.Success) throw new Error(response?.ErrorMessage || '');
        this.toast.set({ track, saved: true });
        return true;
      })
    );
  }

  openPicker(track: IMusicTrackPreview): void {
    this.toast.set(null);
    this.pickerTrack.set(track);
  }

  closePicker(): void {
    this.pickerTrack.set(null);
  }

  myCollections(
    track?: IMusicTrackKey | null
  ): Observable<IMusicCollectionResponse> {
    const query = track
      ? `?provider=${track.Provider}&externalId=${encodeURIComponent(track.ExternalId)}`
      : '';
    return this.http.get<IMusicCollectionResponse>(
      `${this.apiUrl}/mycollections${query}`
    );
  }

  collection(collectionId: string): Observable<IMusicCollectionResponse> {
    return this.http.get<IMusicCollectionResponse>(
      `${this.apiUrl}/collection?collectionId=${encodeURIComponent(collectionId)}`
    );
  }

  collectionTracks(
    collectionId: string,
    pageIndex: number,
    pageSize: number
  ): Observable<IMusicLibraryTrackResponse> {
    return this.http.get<IMusicLibraryTrackResponse>(
      `${this.apiUrl}/collectiontracks?collectionId=${encodeURIComponent(collectionId)}&pageIndex=${pageIndex}&pageSize=${pageSize}`
    );
  }

  createCollection(
    request: IMusicCollectionSave
  ): Observable<IMusicCollectionResponse> {
    return this.http
      .post<IMusicCollectionResponse>(`${this.apiUrl}/collection`, request)
      .pipe(tap(response => response?.Success && this.notifyChanged()));
  }

  updateCollection(
    request: IMusicCollectionSave
  ): Observable<IMusicCollectionResponse> {
    return this.http
      .put<IMusicCollectionResponse>(`${this.apiUrl}/collection`, request)
      .pipe(tap(response => response?.Success && this.notifyChanged()));
  }

  deleteCollection(
    collectionId: string
  ): Observable<IMusicLibraryBoolResponse> {
    return this.http
      .delete<IMusicLibraryBoolResponse>(
        `${this.apiUrl}/collection?collectionId=${encodeURIComponent(collectionId)}`
      )
      .pipe(tap(response => response?.Success && this.notifyChanged()));
  }

  /** Thêm vào bộ thì server cũng tự đưa bài vào Yêu thích. */
  addToCollection(
    collectionId: string,
    track: IMusicTrackKey
  ): Observable<IMusicLibraryTrackResponse> {
    return this.http
      .post<IMusicLibraryTrackResponse>(`${this.apiUrl}/collectionitem`, {
        CollectionId: collectionId,
        Provider: track.Provider,
        ExternalId: track.ExternalId,
      })
      .pipe(
        tap(response => {
          if (!response?.Success || !response.Data) return;
          this.markSaved(track, response.Data.TrackId);
          this.notifyChanged();
        })
      );
  }

  removeFromCollection(
    collectionId: string,
    trackId: string
  ): Observable<IMusicLibraryBoolResponse> {
    return this.http
      .delete<IMusicLibraryBoolResponse>(
        `${this.apiUrl}/collectionitem?collectionId=${encodeURIComponent(collectionId)}&trackId=${encodeURIComponent(trackId)}`
      )
      .pipe(tap(response => response?.Success && this.notifyChanged()));
  }

  moveCollectionItem(
    collectionId: string,
    trackId: string,
    direction: 'up' | 'down'
  ): Observable<IMusicLibraryBoolResponse> {
    return this.http.post<IMusicLibraryBoolResponse>(
      `${this.apiUrl}/movecollectionitem`,
      { CollectionId: collectionId, TrackId: trackId, Direction: direction }
    );
  }

  private markSaved(track: IMusicTrackKey, trackId: string): void {
    const next = new Map(this.savedKeys());
    next.set(musicTrackKey(track.Provider, track.ExternalId), trackId);
    this.savedKeys.set(next);
  }

  private notifyChanged(): void {
    this.changes.update(value => value + 1);
  }
}
