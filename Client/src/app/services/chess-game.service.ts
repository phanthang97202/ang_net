import { Injectable } from '@angular/core';
import * as SignalR from '@microsoft/signalr';
import { environment } from '../../environments/environment';
import { ChessRoomStatus } from '../interfaces';

@Injectable({
  providedIn: 'root',
})
export class ChessGameService {
  private hubConnection: SignalR.HubConnection;
  wsUrl: string = environment.wsUrl;

  constructor() {
    this.hubConnection = new SignalR.HubConnectionBuilder()
      .withUrl(`${this.wsUrl}chess-hub`, {
        skipNegotiation: true,
        transport: SignalR.HttpTransportType.WebSockets,
      })
      .build();
  }

  get connectionId(): string | null {
    return this.hubConnection.connectionId;
  }

  get isConnected(): boolean {
    return this.hubConnection.state === SignalR.HubConnectionState.Connected;
  }

  connect(): Promise<void> {
    if (this.isConnected) return Promise.resolve();
    return this.hubConnection.start();
  }

  createRoom(playerName: string): Promise<string> {
    return this.hubConnection.invoke<string>('CreateRoom', playerName);
  }

  joinRoom(roomId: string, playerName: string): Promise<string> {
    return this.hubConnection.invoke<string>('JoinRoom', roomId, playerName);
  }

  setReady(roomId: string): Promise<void> {
    return this.hubConnection.invoke('SetReady', roomId);
  }

  sendMove(roomId: string, fen: string, moveSan: string): Promise<void> {
    return this.hubConnection.invoke('SendMove', roomId, fen, moveSan);
  }

  resign(roomId: string): Promise<void> {
    return this.hubConnection.invoke('Resign', roomId);
  }

  onRoomStateChanged(cb: RoomStateChangedCallback): void {
    this.hubConnection.on('RoomStateChanged', cb);
  }

  offRoomStateChanged(cb: RoomStateChangedCallback): void {
    this.hubConnection.off('RoomStateChanged', cb);
  }

  onMoveReceived(cb: MoveReceivedCallback): void {
    this.hubConnection.on('MoveReceived', cb);
  }

  offMoveReceived(cb: MoveReceivedCallback): void {
    this.hubConnection.off('MoveReceived', cb);
  }

  onOpponentLeft(cb: OpponentLeftCallback): void {
    this.hubConnection.on('OpponentLeftGame', cb);
  }

  offOpponentLeft(cb: OpponentLeftCallback): void {
    this.hubConnection.off('OpponentLeftGame', cb);
  }
}

type RoomStateChangedCallback = (
  roomId: string,
  player1Name: string,
  player1Ready: boolean,
  player2Name: string,
  player2Ready: boolean,
  status: ChessRoomStatus,
  fen: string
) => void;
type MoveReceivedCallback = (fen: string, moveSan: string) => void;
type OpponentLeftCallback = (reason: 'resign' | 'disconnected' | 'left') => void;
