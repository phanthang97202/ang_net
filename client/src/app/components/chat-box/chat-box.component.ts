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
export class ChatBoxComponent implements OnInit, AfterViewChecked {
  chatService = inject(ChatService);
  detailUser = inject(AuthService);
  @ViewChild('chatContainer') chatContainer!: ElementRef;
  constructor(private cdref: ChangeDetectorRef) {}
  showErrorService = inject(ShowErrorService);

  pageIndex: number = 0;
  pageSize: number = 5;
  maxScrollQuantity: number = 0;
  countScroll: number = 0;
  itemCount: number = 0;
  public loadingMessages: boolean = false;

  public messages: IChat[] = [];
  public newMessage: string = '';
  public userId: string = this.detailUser.getAccountInfo().email!;

  ngOnInit(): void {
    this.chatService.getMessage(this.pageIndex, this.pageSize).subscribe({
      next: (res) => {
        this.messages = [...this.messages, ...res.objResult.DataList];
        this.maxScrollQuantity = res.objResult.PageCount;
        this.itemCount = res.objResult.ItemCount;
        return res.objResult.DataList;
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
    // const element = this.chatContainer.nativeElement;
    // element.scrollTop = element.scrollHeight;
  }

  onScroll() {
    const element = this.chatContainer.nativeElement;
    if (
      element.scrollTop === 0 &&
      !this.loadingMessages &&
      this.pageIndex < this.itemCount / this.pageSize
    ) {
      this.loadMessages();
    }
  }

  loadMessages() {
    this.loadingMessages = true;
    const oldScrollHeight = this.chatContainer.nativeElement.scrollHeight;

    this.chatService.getMessage(this.pageIndex + 1, this.pageSize).subscribe({
      next: (res) => {
        this.messages = [...res.objResult.DataList, ...this.messages];
        this.pageIndex += 1;
        this.loadingMessages = false;

        // Adjust the scroll position to maintain the user's view
        setTimeout(() => {
          const newScrollHeight = this.chatContainer.nativeElement.scrollHeight;
          this.chatContainer.nativeElement.scrollTop =
            newScrollHeight - oldScrollHeight;
        }, 0); // Delay to allow DOM to update
      },
      error: (err) => {
        console.error('Error loading messages:', err);
        this.loadingMessages = false;
      },
    });
  }
}
