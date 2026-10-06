import { Injectable, NgZone, inject } from '@angular/core';
import * as SignalR from '@microsoft/signalr';
import { BehaviorSubject, Subject, firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { INote, INoteUnreadState } from '../interfaces';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class NoteRealtimeService {
  private readonly api = inject(ApiService);
  private readonly zone = inject(NgZone);
  private readonly lastReadKey = 'angnet.note.lastReadAt';

  private readonly unreadCountSubject = new BehaviorSubject<number>(0);
  private readonly newNoteSubject = new Subject<INote>();

  readonly unreadCount$ = this.unreadCountSubject.asObservable();
  readonly newNote$ = this.newNoteSubject.asObservable();

  private connection?: SignalR.HubConnection;
  private connectionStart?: Promise<void>;
  private reconnectTimer?: ReturnType<typeof setTimeout>;
  private initialized = false;
  private refreshRunning = false;
  private refreshPending = false;

  private readonly onStorage = (event: StorageEvent): void => {
    if (event.key !== this.lastReadKey) return;

    this.zone.run(() => {
      if (this.isNotePage()) {
        this.unreadCountSubject.next(0);
        return;
      }
      void this.refreshUnreadCount();
    });
  };

  initialize(): void {
    if (this.initialized || typeof window === 'undefined') return;

    this.initialized = true;
    window.addEventListener('storage', this.onStorage);
    void this.bootstrap();
  }

  async markAllAsRead(): Promise<void> {
    const state = await this.getState(null);
    if (!state) return;

    this.saveLastReadAt(state.ServerDTime);
    this.unreadCountSubject.next(0);
  }

  private async bootstrap(): Promise<void> {
    // Lần đầu dùng trình duyệt: lấy thời gian server làm mốc, không coi toàn bộ
    // lịch sử ghi chú là chưa đọc.
    if (!this.getLastReadAt()) {
      const initialState = await this.getState(null);
      if (initialState) {
        this.saveLastReadAt(initialState.ServerDTime);
        this.unreadCountSubject.next(0);
      }
    }

    // HTTP và WebSocket chạy độc lập: badge vẫn có số đúng ngay cả khi mạng
    // của người dùng chặn WebSocket, còn kết nối realtime sẽ tự thử lại.
    await Promise.all([this.startConnection(), this.refreshUnreadCount()]);
  }

  private buildConnection(): SignalR.HubConnection {
    const connection = new SignalR.HubConnectionBuilder()
      .withUrl(`${environment.wsUrl}note-hub`, {
        skipNegotiation: true,
        transport: SignalR.HttpTransportType.WebSockets,
      })
      .withAutomaticReconnect([0, 2_000, 10_000, 30_000])
      .build();

    connection.on('NoteCreated', (note: INote) => {
      this.zone.run(() => this.handleNewNote(note));
    });
    connection.onreconnected(() => {
      this.zone.run(() => void this.refreshUnreadCount());
    });
    connection.onclose(() => this.scheduleReconnect());

    return connection;
  }

  private async startConnection(): Promise<void> {
    if (!this.connection) {
      this.connection = this.buildConnection();
    }

    if (
      this.connection.state === SignalR.HubConnectionState.Connected ||
      this.connection.state === SignalR.HubConnectionState.Connecting ||
      this.connection.state === SignalR.HubConnectionState.Reconnecting
    ) {
      return;
    }
    if (this.connectionStart) {
      return this.connectionStart;
    }

    const start = this.connection
      .start()
      .then(() => {
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = undefined;
        }
        return this.refreshUnreadCount();
      })
      .catch(() => this.scheduleReconnect())
      .finally(() => {
        if (this.connectionStart === start) {
          this.connectionStart = undefined;
        }
      });

    this.connectionStart = start;
    return start;
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer || typeof window === 'undefined') return;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined;
      void this.startConnection();
    }, 5_000);
  }

  private handleNewNote(note: INote): void {
    if (!note?.NoteId) return;

    this.newNoteSubject.next(note);
    if (this.isNotePage()) {
      this.saveLastReadAt(note.CreatedDTime);
      this.unreadCountSubject.next(0);
      return;
    }

    // Đối soát lại với DB thay vì chỉ +1 để vẫn đúng nếu tab vừa bị mất mạng.
    void this.refreshUnreadCount();
  }

  private async refreshUnreadCount(): Promise<void> {
    if (this.refreshRunning) {
      this.refreshPending = true;
      return;
    }

    this.refreshRunning = true;
    try {
      do {
        this.refreshPending = false;
        const lastReadAt = this.getLastReadAt();
        const state = await this.getState(lastReadAt);
        if (!state) continue;

        if (!lastReadAt || this.isNotePage()) {
          this.saveLastReadAt(state.ServerDTime);
          this.unreadCountSubject.next(0);
        } else {
          this.unreadCountSubject.next(Math.max(0, state.UnreadCount || 0));
        }
      } while (this.refreshPending);
    } finally {
      this.refreshRunning = false;
    }
  }

  private async getState(
    lastReadAt: string | null
  ): Promise<INoteUnreadState | null> {
    try {
      const response = await firstValueFrom(
        this.api.NoteUnreadState(lastReadAt)
      );
      return response?.Success ? response.Data : null;
    } catch {
      return null;
    }
  }

  private getLastReadAt(): string | null {
    try {
      const value = localStorage.getItem(this.lastReadKey);
      return value && Number.isFinite(Date.parse(value)) ? value : null;
    } catch {
      return null;
    }
  }

  private saveLastReadAt(value: string): void {
    if (!value || !Number.isFinite(Date.parse(value))) return;

    try {
      const current = this.getLastReadAt();
      if (!current || Date.parse(value) > Date.parse(current)) {
        localStorage.setItem(this.lastReadKey, value);
      }
    } catch {
      // Trình duyệt có thể chặn storage; realtime trong tab hiện tại vẫn hoạt động.
    }
  }

  private isNotePage(): boolean {
    if (typeof window === 'undefined') return false;
    return window.location.pathname.replace(/\/+$/, '') === '/note';
  }
}
