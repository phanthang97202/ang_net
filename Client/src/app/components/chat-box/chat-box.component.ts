import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  OnInit,
  ViewChild,
  OnDestroy,
} from '@angular/core';
import {
  ChatService,
  AuthService,
  ShowErrorService,
  CloudinaryService,
} from '../../services';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCommentModule } from 'ng-zorro-antd/comment';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { IChat, TypeMessage } from '../../interfaces';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSpinModule } from 'ng-zorro-antd/spin';

@Component({
  selector: 'app-chat-box',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzInputModule,
    NzIconModule,
    NzCommentModule,
    NzAvatarModule,
    NzButtonModule,
    NzUploadModule,
    NzModalModule,
    NzSpinModule,
  ],
  templateUrl: './chat-box.component.html',
  styleUrl: './chat-box.component.scss',
})
export class ChatBoxComponent implements OnInit, OnDestroy {
  chatService = inject(ChatService);
  detailUser = inject(AuthService);
  cloudinary = inject(CloudinaryService);
  showErrorService = inject(ShowErrorService);

  @ViewChild('chatContainer') chatContainer!: ElementRef;

  pageIndex: number = 0;
  pageSize: number = 20;
  itemCount: number = 0;
  loadingMessages: boolean = false;
  isUploading: boolean = false;

  messages: IChat[] = [];
  newMessage: string = '';
  typeMessage: TypeMessage = 'string';
  userId: string = this.detailUser.getAccountInfo().email!;

  fileList: any[] = [];
  previewImage: string | undefined = '';
  previewVisible = false;

  private isInitialLoad = true;

  constructor(private cdref: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadInitialMessages();
    this.setupSignalR();
  }

  ngOnDestroy(): void {
    // Cleanup SignalR connection if needed
  }

  private loadInitialMessages(): void {
    this.loadingMessages = true;
    this.chatService.getMessage(this.pageIndex, this.pageSize).subscribe({
      next: res => {
        // Giữ nguyên thứ tự từ API, KHÔNG reverse
        this.messages = [...res.objResult.DataList];
        this.itemCount = res.objResult.ItemCount;
        this.loadingMessages = false;

        // Scroll to bottom after initial load
        setTimeout(() => {
          this.scrollToBottom();
          this.isInitialLoad = false;
        }, 100);
      },
      error: err => {
        this.loadingMessages = false;
        this.showErrorService.setShowError({
          icon: 'warning',
          message: JSON.stringify(err, null, 2),
          title: err.message,
        });
      },
    });
  }

  private setupSignalR(): void {
    this.chatService.startConnection();
    this.chatService.onMessageReceived((userId, message, type) => {
      this.messages.push({
        UserId: userId,
        Message: message,
        MessageId: this.generateId(),
        Type: type,
        CreatedDTime: new Date(),
      });

      // Auto scroll to bottom when receiving new messages
      setTimeout(() => this.scrollToBottom(), 50);
    });
  }

  sendMessage(): void {
    const trimmedMessage = this.newMessage.trim();
    if (!trimmedMessage) {
      return;
    }

    // Detect image type
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const hasImageExtension = imageExtensions.some(ext =>
      trimmedMessage.toLowerCase().includes(`.${ext}`)
    );

    const messageType: TypeMessage = hasImageExtension ? 'jpg' : 'string';

    this.chatService.sendMessage(this.userId, trimmedMessage, messageType);

    // Clear input
    this.newMessage = '';
    this.typeMessage = 'string';
    this.fileList = [];
  }

  handleUploadFile = (file: any): boolean => {
    this.isUploading = true;

    this.cloudinary.uploadImage(file).subscribe({
      next: (res: any) => {
        this.newMessage = res.url;
        this.isUploading = false;
        this.cdref.detectChanges();
      },
      error: err => {
        this.isUploading = false;
        this.showErrorService.setShowError({
          icon: 'error',
          message: 'Failed to upload image',
          title: 'Upload Error',
        });
      },
    });

    return false;
  };

  onScroll(): void {
    const element = this.chatContainer.nativeElement;
    const scrollTop = element.scrollTop;
    const scrollThreshold = 50;

    // Scroll to top = load more old messages
    if (
      scrollTop <= scrollThreshold &&
      !this.loadingMessages &&
      this.hasMoreMessages()
    ) {
      this.loadOlderMessages();
    }
  }

  private hasMoreMessages(): boolean {
    return (this.pageIndex + 1) * this.pageSize < this.itemCount;
  }

  private loadOlderMessages(): void {
    this.loadingMessages = true;
    const element = this.chatContainer.nativeElement;
    const oldScrollHeight = element.scrollHeight;
    const oldScrollTop = element.scrollTop;

    this.chatService.getMessage(this.pageIndex + 1, this.pageSize).subscribe({
      next: res => {
        // Add old messages to the BEGINNING of array
        const olderMessages = res.objResult.DataList;
        this.messages = [...olderMessages, ...this.messages];
        this.pageIndex += 1;
        this.loadingMessages = false;

        // Maintain scroll position after adding messages
        this.cdref.detectChanges();

        requestAnimationFrame(() => {
          const newScrollHeight = element.scrollHeight;
          const scrollDiff = newScrollHeight - oldScrollHeight;
          element.scrollTop = oldScrollTop + scrollDiff;
        });
      },
      error: err => {
        console.error('Error loading messages:', err);
        this.loadingMessages = false;
      },
    });
  }

  private scrollToBottom(): void {
    if (this.chatContainer) {
      const element = this.chatContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }

  handlePreview = async (file: any): Promise<void> => {
    this.previewImage = file.url || file.preview || file.thumbUrl;
    this.previewVisible = true;
  };

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  trackByMessageId(index: number, message: IChat): string {
    return message.MessageId || index.toString();
  }

  formatDate(date: Date): string {
    if (!date) return '';
    try {
      const d = new Date(date);
      return d.toLocaleString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  }
}
