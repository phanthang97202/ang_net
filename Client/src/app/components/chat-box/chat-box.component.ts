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
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ChatService, AuthService, ShowErrorService } from '../../services';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { IChat, TypeMessage } from '../../interfaces';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { SpinnerComponent } from '../spinner/spinner.component';
import { TranslateModule } from '@ngx-translate/core';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { ChatLinksPipe } from './chat-links.pipe';

@Component({
  selector: 'app-chat-box',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzIconModule,
    NzAvatarModule,
    NzModalModule,
    SpinnerComponent,
    TranslateModule,
    NzPopconfirmModule,
    ChatLinksPipe,
  ],
  templateUrl: './chat-box.component.html',
  styleUrl: './chat-box.component.scss',
})
export class ChatBoxComponent implements OnInit, OnDestroy {
  chatService = inject(ChatService);
  detailUser = inject(AuthService);
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
  get canSendImage(): boolean {
    return this.chatService.canSendImage;
  }
  get canDelete(): boolean {
    return this.chatService.canDelete;
  }
  deletingIds = new Set<string>();
  private olderCursor?: number;
  private moreHistory = false;

  @ViewChild('chatContainer') chatContainer!: ElementRef;
  @Output() closeChat = new EventEmitter<void>();

  pageIndex: number = 0;
  pageSize: number = 20;
  itemCount: number = 0;
  loadingMessages: boolean = false;
  isUploading: boolean = false;

  messages: IChat[] = [];
  newMessage: string = '';
  selectedImage: File | null = null;
  selectedImagePreview = '';
  private uploadedImageUrl = '';
  // Keep existing email-based chat history; no-email accounts use a distinct ID.
  userId: string =
    this.detailUser.getAccountInfo().email ||
    `account:${this.detailUser.getAccountInfo().nameid}`;

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
    this.clearImage();
  }

  private loadInitialMessages(): void {
    this.loadingMessages = true;
    this.chatService
      .getMessage(0, this.pageSize)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => {
          const page = res.objResult.DataList;
          this.olderCursor = page.length
            ? Math.min(...page.map(m => m.Sequence))
            : undefined;
          this.moreHistory = page.length === this.pageSize;
          // Giữ nguyên thứ tự từ API, KHÔNG reverse
          const merged = new Map(
            [...res.objResult.DataList, ...this.messages].map(m => [
              m.MessageId,
              m,
            ])
          );
          this.messages = [...merged.values()]
            .filter(m => !this.chatService.isMessageDeleted(m.MessageId))
            .sort((a, b) => a.Sequence - b.Sequence);
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
    this.chatService.deleted$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(message => {
        const removed = this.messages.find(
          m => m.MessageId === message.MessageId
        );
        if (removed?.Type === 'jpg' && this.previewImage === removed.Message) {
          this.previewVisible = false;
          this.previewImage = '';
        }
        this.messages = this.messages.filter(
          m => m.MessageId !== message.MessageId
        );
        this.itemCount = Math.max(0, this.itemCount - 1);
      });
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
        if (
          !this.chatService.isMessageDeleted(message.MessageId) &&
          !this.messages.some(m => m.MessageId === message.MessageId)
        )
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
    if (!trimmedMessage && !this.selectedImage) {
      return;
    }
    if (this.selectedImage && !this.canSendImage) {
      this.sendError = 'Bạn không có quyền gửi ảnh.';
      return;
    }

    // Pasted URLs remain clickable text links, including links to images.
    const messageType: TypeMessage = this.selectedImage ? 'jpg' : 'string';

    this.sending = true;
    this.sendError = '';
    let failureMessage = 'Không gửi được tin nhắn. Vui lòng thử lại.';
    try {
      let message = trimmedMessage;
      if (this.selectedImage) {
        if (!this.uploadedImageUrl) {
          failureMessage = 'Không thể tải ảnh lên. Vui lòng thử lại.';
          this.isUploading = true;
          const response = await firstValueFrom(
            this.chatService
              .uploadImage(this.selectedImage)
              .pipe(takeUntilDestroyed(this.destroyRef))
          );
          this.isUploading = false;
          if (this.destroyed) return;
          if (!response.Success || !response.Data?.Url) {
            this.sendError = response.ErrorMessage || failureMessage;
            return;
          }
          // If sending fails after upload, reuse this URL on retry.
          this.uploadedImageUrl = response.Data.Url;
        }
        message = this.uploadedImageUrl;
      }
      failureMessage = 'Không gửi được tin nhắn. Vui lòng thử lại.';
      if (this.destroyed) return;
      await this.chatService.sendMessage(this.userId, message, messageType);
      if (this.destroyed) return;
      this.newMessage = '';
      this.clearImage();
    } catch (err) {
      if (!this.destroyed)
        this.sendError =
          err instanceof HttpErrorResponse &&
          typeof err.error?.ErrorMessage === 'string'
            ? err.error.ErrorMessage
            : failureMessage;
    } finally {
      this.sending = false;
      this.isUploading = false;
    }
  }

  handleUploadFile = (file: File): boolean => {
    if (!this.canSendImage || this.sending || this.isUploading) return false;
    if (!file.size || file.size >= 2 * 1024 * 1024) {
      this.sendError = 'Ảnh phải có dung lượng nhỏ hơn 2 MB.';
      return false;
    }
    if (
      !['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(
        file.type
      )
    ) {
      this.sendError = 'Chỉ hỗ trợ ảnh JPG, PNG, GIF hoặc WebP.';
      return false;
    }
    this.sendError = '';
    this.clearImage();
    this.selectedImage = file;
    this.selectedImagePreview = URL.createObjectURL(file);

    return false;
  };

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) this.handleUploadFile(file);
  }

  clearImage(): void {
    if (this.selectedImagePreview)
      URL.revokeObjectURL(this.selectedImagePreview);
    this.selectedImage = null;
    this.selectedImagePreview = '';
    this.uploadedImageUrl = '';
  }
  async deleteMessage(message: IChat): Promise<void> {
    if (!this.canDelete || this.deletingIds.has(message.MessageId)) return;
    this.sendError = '';
    this.deletingIds.add(message.MessageId);
    try {
      await this.chatService.deleteMessage(message.MessageId);
    } catch {
      if (!this.destroyed)
        this.sendError = 'Không thể xóa tin nhắn. Vui lòng thử lại.';
    } finally {
      this.deletingIds.delete(message.MessageId);
    }
  }

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
    return this.moreHistory && this.olderCursor !== undefined;
  }

  private loadOlderMessages(): void {
    this.loadingMessages = true;
    const element = this.chatContainer.nativeElement;
    const oldScrollHeight = element.scrollHeight;
    const oldScrollTop = element.scrollTop;

    this.chatService
      .getMessage(this.pageIndex + 1, this.pageSize, this.olderCursor)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => {
          // Add old messages to the BEGINNING of array
          const olderMessages = res.objResult.DataList;
          this.moreHistory = olderMessages.length === this.pageSize;
          if (olderMessages.length)
            this.olderCursor = Math.min(...olderMessages.map(m => m.Sequence));
          this.messages = [
            ...new Map(
              [...olderMessages, ...this.messages].map(m => [m.MessageId, m])
            ).values(),
          ]
            .filter(m => !this.chatService.isMessageDeleted(m.MessageId))
            .sort((a, b) => a.Sequence - b.Sequence);
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
