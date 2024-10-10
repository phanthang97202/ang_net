import { Injectable } from '@angular/core';
import * as SignalR from '@microsoft/signalr';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { IChat, IChatResponse } from '../interfaces/chat';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private hubConnection: SignalR.HubConnection;
  wsUrl: string = environment.wsUrl;
  apiUrl: string = environment.apiUrl;

  constructor(private http: HttpClient) {
    this.hubConnection = new SignalR.HubConnectionBuilder()
      .withUrl(`${this.wsUrl}chat-hub`, {
        skipNegotiation: true,
        transport: SignalR.HttpTransportType.WebSockets,
      })
      .build();
  }

  startConnection() {
    this.hubConnection
      .start()
      .then(() => {
        console.log('ConnectSuccessfully');
      })
      .catch((err) => {
        console.error(err);
      });
  }

  // invoke(gọi) đến method signalr BE
  sendMessage(userId: string, message: string) {
    this.hubConnection
      .invoke('SendMessage', userId, message)
      .catch((err) => console.error(err));
  }

  // listener method ReceiveMessage signalR BE
  onMessageReceived(cb: (userId: string, message: string) => void) {
    this.hubConnection.on('ReceiveMessage', cb);
  }

  // get all chat message
  getMessage(pageIndex: number, pageSize: number): Observable<IChatResponse> {
    return this.http.get<IChatResponse>(
      `${this.apiUrl}chat/getmessage?PageIndex=${pageIndex}&PageSize=${pageSize}`
    );
  }
}
