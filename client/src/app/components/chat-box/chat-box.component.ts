import {
  AfterViewChecked,
  ChangeDetectorRef,
  Component,
  DoCheck,
  ElementRef,
  inject,
  NgModule,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ChatService } from '../../services/ws-chat.service';
import { sendMessage } from '@microsoft/signalr/dist/esm/Utils';
import { CommonModule } from '@angular/common';
import { FormsModule, NgModel } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCommentModule } from 'ng-zorro-antd/comment';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { IChat } from '../../interfaces/chat';
import { ShowErrorService } from '../../services/show-error.service';
@Component({
  selector: 'chat-box',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzInputModule,
    NzIconModule,
    NzCommentModule,
    NzAvatarModule,
    NzButtonModule,
  ],
  templateUrl: './chat-box.component.html',
  styleUrl: './chat-box.component.scss',
})
export class ChatBoxComponent implements OnInit, AfterViewChecked, DoCheck {
  chatService = inject(ChatService);
  detailUser = inject(AuthService);
  @ViewChild('chatContainer') chatContainer!: ElementRef;
  constructor(private cdref: ChangeDetectorRef) {}
  showErrorService = inject(ShowErrorService);

  quantity: number = 5;

  public messages: IChat[] = [];
  public newMessage: string = '';
  public userId: string = this.detailUser.getAccountInfo().email!;

  ngOnInit(): void {
    this.chatService.getMessage(this.quantity).subscribe({
      next: (res) => {
        this.messages = [...this.messages, ...res.DataList];
        return res.DataList;
      },
      error: (err) => {
        this.showErrorService.setShowError({
          icon: 'warning',
          message: JSON.stringify(err, null, 2),
          title: err.message,
        });
        throw new Error(err);
      },
    });

    this.chatService.startConnection();
    this.chatService.onMessageReceived((userId, message) => {
      this.messages.push({
        UserId: userId,
        Message: message,
        MessageId: '',
        CreatedDTime: new Date(),
      });
    });
  }

  sendMessage() {
    this.chatService.sendMessage(this.userId, this.newMessage);
    this.newMessage = '';
  }

  // fix delay dom
  ngAfterViewChecked() {
    this.cdref.detectChanges();
  }

  ngDoCheck() {
    console.log('re render');
  }

  onScroll() {
    const element = this.chatContainer.nativeElement;

    if (element.scrollTop === 0) {
      // this.quantity = this.quantity + 5;

      // this.chatService.getMessage(this.quantity).subscribe({
      //   next: (res) => {
      //     this.messages = [...this.messages, ...res.DataList];
      //     return res.DataList;
      //   },
      //   error: (err) => {
      //     this.showErrorService.setShowError({
      //       icon: 'warning',
      //       message: JSON.stringify(err, null, 2),
      //       title: err.message,
      //     });
      //     throw new Error(err);
      //   },
      // });
      console.log('Cannot scroll up further!', this.quantity);
      // You can handle what to do when scroll is at the top
    }
  }
}
