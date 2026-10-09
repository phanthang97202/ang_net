import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  inject,
  OnInit,
  Output,
  ViewChild,
  OnDestroy,
  DestroyRef,
  HostListener,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import { SpinnerComponent } from '../spinner/spinner.component';
import { TranslateModule } from '@ngx-translate/core';

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
    SpinnerComponent,
    TranslateModule,
  ],
  templateUrl: './chat-box.component.html',
  styleUrl: './chat-box.component.scss',
})
export class ChatBoxComponent implements OnInit, OnDestroy {
  chatService = inject(ChatService);
  detailUser = inject(AuthService);
  cloudinary = inject(CloudinaryService);
  showErrorService = inject(ShowErrorService);
  private destroyRef = inject(DestroyRef);
  private destroyed = false;
  private acknowledging = false;
  private acknowledged = 0;
  sendError = '';
  sending = false;
  get canSend(): boolean {
    return this.chatService.canSend;
  }

  @ViewChild('chatContainer') chatContainer!: ElementRef;
  @Output() closeChat = new EventEmitter<void>();

  pageIndex: number = 0;
  pageSize: number = 20;
  itemCount: number = 0;
  loadingMessages: boolean = false;
  isUploading: boolean = false;

  messages: IChat[] = [];
  newMessage: string = '';
  typeMessage: TypeMessage = 'string';
  // Keep existing email-based chat history; no-email accounts use a distinct ID.
  userId: string =
    this.detailUser.getAccountInfo().email ||
    `account:${this.detailUser.getAccountInfo().nameid}`;

  fileList: any[] = [];
  previewImage: string | undefined = '';
  previewVisible = false;

  constructor(private cdref: ChangeDetectorRef) {}

  ngOnInit(): void {
    if (!this.chatService.canView) {
      this.closeChat.emit();
      return;
    }
    this.loadInitialMessages();
    this.setupSignalR();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
  }

  private loadInitialMessages(): void {
    this.loadingMessages = true;
    this.chatService
      .getMessage(0, this.pageSize)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => {
          // Giữ nguyên thứ tự từ API, KHÔNG reverse
          const merged = new Map(
            [...res.objResult.DataList, ...this.messages].map(m => [
              m.MessageId,
              m,
            ])
          );
          this.messages = [...merged.values()].sort(
            (a, b) => a.Sequence - b.Sequence
          );
          this.itemCount = res.objResult.ItemCount;
          this.loadingMessages = false;

          // Scroll to bottom after initial load
          setTimeout(() => {
            this.scrollToBottom();
            this.acknowledge();
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
    this.chatService.reconnected$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.pageIndex = 0;
        this.messages = [];
        this.loadInitialMessages();
      });
    this.chatService.received$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(message => {
        const atBottom = this.atBottom();
        if (!this.messages.some(m => m.MessageId === message.MessageId))
          this.messages.push(message);
        setTimeout(() => {
          if (this.destroyed) return;
          if (atBottom) this.scrollToBottom();
          this.acknowledge();
        }, 50);
      });
  }

  async sendMessage(): Promise<void> {
    if (!this.canSend || this.sending || this.isUploading) return;
    const trimmedMessage = this.newMessage.trim();
    if (!trimmedMessage) {
      return;
    }

    // Detect image type
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const hasImageExtension = imageExtensions.some(ext =>
      trimmedMessage.toLowerCase().includes(`.${ext}`)
    );

    const messageType: TypeMessage =
      this.typeMessage === 'jpg' || hasImageExtension ? 'jpg' : 'string';

    this.sending = true;
    this.sendError = '';
    try {
      await this.chatService.sendMessage(
        this.userId,
        trimmedMessage,
        messageType
      );
      this.newMessage = '';
      this.typeMessage = 'string';
      this.fileList = [];
    } catch {
      this.sendError = 'Không gửi được tin nhắn. Vui lòng thử lại.';
    } finally {
      this.sending = false;
    }
  }

  handleUploadFile = (file: any): boolean => {
    if (!this.canSend || this.sending || this.isUploading) return false;
    this.isUploading = true;

    this.cloudinary
      .uploadImage(file)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          this.newMessage = res.secure_url || res.url;
          this.typeMessage = 'jpg';
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
    this.acknowledge();
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

    this.chatService
      .getMessage(this.pageIndex + 1, this.pageSize)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => {
          // Add old messages to the BEGINNING of array
          const olderMessages = res.objResult.DataList;
          this.messages = [
            ...new Map(
              [...olderMessages, ...this.messages].map(m => [m.MessageId, m])
            ).values(),
          ].sort((a, b) => a.Sequence - b.Sequence);
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
  private atBottom(): boolean {
    const el = this.chatContainer?.nativeElement;
    return !!el && el.scrollHeight - el.scrollTop - el.clientHeight <= 40;
  }
  @HostListener('document:visibilitychange')
  async acknowledge(): Promise<void> {
    if (
      this.destroyed ||
      this.acknowledging ||
      this.loadingMessages ||
      document.visibilityState !== 'visible' ||
      !this.atBottom()
    )
      return;
    const sequence = Math.max(0, ...this.messages.map(m => m.Sequence));
    if (sequence <= this.acknowledged) return;
    this.acknowledging = true;
    try {
      await this.chatService.markRead(sequence);
      this.acknowledged = sequence;
    } catch {
      /* Keep unread status if acknowledgement fails. */
    } finally {
      this.acknowledging = false;
    }
    if (
      !this.destroyed &&
      Math.max(0, ...this.messages.map(m => m.Sequence)) > sequence
    )
      void this.acknowledge();
  }

  handlePreview = async (file: any): Promise<void> => {
    this.previewImage = file.url || file.preview || file.thumbUrl;
    this.previewVisible = true;
  };

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
