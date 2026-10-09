import { Injectable, signal } from '@angular/core';
import * as SignalR from '@microsoft/signalr';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import {
  IChat,
  IChatResponse,
  IChatNotifications,
  TypeMessage,
} from '../interfaces';
import { firstValueFrom, Observable, Subject, takeUntil } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private connection?: SignalR.HubConnection;
  private starting?: Promise<void>;
  private generation = 0;
  private notificationRequest = 0;
  private activeAccount?: string;
  private stopped$ = new Subject<void>();
  private bindAccount(): string {
    const account = this.auth.getAccountInfo().nameid;
    if (this.activeAccount && this.activeAccount !== account)
      this.stopConnection();
    this.activeAccount = account;
    return account;
  }
  readonly reconnected$ = new Subject<void>();
  readonly received$ = new Subject<IChat>();
  readonly unreadCount = signal(0);
  readonly latestMessage = signal<IChat | null>(null);
  readonly connected = signal(false);
  readonly error = signal('');
  readonly apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {}
  get canView(): boolean {
    return !!this.auth.getToken() && this.auth.hasPermission('chat.view');
  }
  get canSend(): boolean {
    return this.canView && this.auth.hasPermission('chat.send');
  }
  get identity(): string {
    const user = this.auth.getAccountInfo();
    return user.email || `account:${user.nameid}`;
  }
  getNotifications(): Observable<{
    Success: boolean;
    Data: IChatNotifications;
  }> {
    return this.http.get<{ Success: boolean; Data: IChatNotifications }>(
      `${this.apiUrl}chat/notifications`
    );
  }
  private apply(data: IChatNotifications): void {
    this.unreadCount.set(data.UnreadCount);
    this.latestMessage.set(data.LatestMessage);
  }
  async syncNotifications(): Promise<void> {
    if (!this.canView) return;
    const account = this.bindAccount();
    const generation = this.generation;
    const request = ++this.notificationRequest;
    try {
      const res = await firstValueFrom(
        this.getNotifications().pipe(takeUntil(this.stopped$))
      );
      if (
        generation === this.generation &&
        request === this.notificationRequest &&
        account === this.auth.getAccountInfo().nameid &&
        this.canView &&
        res.Success
      ) {
        this.apply(res.Data);
        if (this.connected()) this.error.set('');
      }
    } catch {
      if (generation === this.generation)
        this.error.set('Không thể tải thông báo tin nhắn.');
    }
  }
  startConnection(): Promise<void> {
    if (!this.canView)
      return Promise.reject(new Error('Bạn không có quyền xem tin nhắn.'));
    this.bindAccount();
    if (this.connection?.state === SignalR.HubConnectionState.Connected)
      return Promise.resolve();
    if (this.starting) return this.starting;
    if (
      this.connection &&
      this.connection.state !== SignalR.HubConnectionState.Disconnected
    )
      return Promise.resolve();
    const generation = this.generation;
    const promise = this.connect(generation);
    this.starting = promise;
    void promise
      .finally(() => {
        if (this.starting === promise) this.starting = undefined;
      })
      .catch(() => undefined);
    return promise;
  }
  private async connect(generation: number): Promise<void> {
    const account = this.activeAccount;
    // The protected request refreshes an expired access token before opening a socket.
    await this.syncNotifications();
    if (generation !== this.generation || !this.canView) return;
    const connection = new SignalR.HubConnectionBuilder()
      .withUrl(`${environment.wsUrl}chat-hub`, {
        accessTokenFactory: async () => {
          if (!this.auth.isLoggedIn()) await this.syncNotifications();
          return this.auth.getToken() || '';
        },
        skipNegotiation: true,
        transport: SignalR.HttpTransportType.WebSockets,
      })
      .withAutomaticReconnect()
      .configureLogging(SignalR.LogLevel.None)
      .build();
    this.connection = connection;
    const current = () =>
      this.connection === connection &&
      generation === this.generation &&
      account === this.auth.getAccountInfo().nameid &&
      this.canView;
    connection.on('ReceiveMessage', (message: IChat) => {
      if (!current()) return;
      this.received$.next(message);
      void this.syncNotifications();
    });
    connection.onreconnecting(() => {
      if (current()) this.connected.set(false);
    });
    connection.onreconnected(() => {
      if (current()) {
        this.connected.set(true);
        this.reconnected$.next();
        void this.syncNotifications();
      }
    });
    connection.onclose(() => {
      if (current()) this.connected.set(false);
    });
    try {
      await connection.start();
      if (!current()) {
        await connection.stop();
        return;
      }
      this.connected.set(true);
      this.error.set('');
      await this.syncNotifications();
    } catch {
      if (current()) {
        this.connected.set(false);
        this.error.set('Chưa kết nối được chat. Đang thử kết nối lại.');
      }
      throw new Error('Không thể kết nối chat.');
    }
  }
  stopConnection(): void {
    this.generation++;
    this.stopped$.next();
    this.activeAccount = undefined;
    const connection = this.connection;
    this.connection = undefined;
    this.starting = undefined;
    if (connection) void connection.stop().catch(() => undefined);
    this.connected.set(false);
    this.unreadCount.set(0);
    this.latestMessage.set(null);
    this.error.set('');
  }
  async sendMessage(
    userId: string,
    message: string,
    type: TypeMessage
  ): Promise<void> {
    if (!this.canSend) throw new Error('Bạn không có quyền gửi tin nhắn.');
    await this.startConnection();
    if (!this.connected() || !this.canSend)
      throw new Error('Chat chưa kết nối. Vui lòng thử lại.');
    await this.connection!.invoke('SendMessage', userId, message, type);
  }
  getMessage(pageIndex: number, pageSize: number): Observable<IChatResponse> {
    return this.http.get<IChatResponse>(
      `${this.apiUrl}chat/getmessage?PageIndex=${pageIndex}&PageSize=${pageSize}`
    );
  }
  async markRead(sequence: number): Promise<void> {
    if (!this.canView) return;
    this.bindAccount();
    const generation = this.generation;
    ++this.notificationRequest;
    const res = await firstValueFrom(
      this.http
        .post<{ Success: boolean; Data: IChatNotifications }>(
          `${this.apiUrl}chat/read`,
          { Sequence: sequence }
        )
        .pipe(takeUntil(this.stopped$))
    );
    if (generation === this.generation && this.canView && res.Success) {
      // Re-query after acknowledgement so a concurrent notification response cannot undo it.
      await this.syncNotifications();
    }
  }
}
