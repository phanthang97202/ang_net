import {
  Component,
  DestroyRef,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { interval } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChatService } from '../../services/ws-chat.service';
import { ChatBoxComponent } from './chat-box.component';

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [CommonModule, NzIconModule, ChatBoxComponent],
  template: `
    <button
      *ngIf="chat.canView"
      class="chat-toggle-btn"
      [class.is-open]="open"
      type="button"
      [attr.aria-label]="
        open
          ? 'Đóng tin nhắn'
          : chat.unreadCount()
            ? 'Tin nhắn: ' + chat.unreadCount() + ' tin chưa đọc'
            : 'Mở tin nhắn'
      "
      [attr.aria-expanded]="open"
      aria-controls="blog-chat-panel"
      (click)="open = !open">
      <span
        nz-icon
        [nzType]="open ? 'close' : 'comment'"
        nzTheme="outline"></span>
      <span *ngIf="chat.unreadCount() > 0" class="chat-unread">{{
        chat.unreadCount() > 99 ? '99+' : chat.unreadCount()
      }}</span>
      <span
        *ngIf="
          !open && chat.unreadCount() > 0 && chat.latestMessage() as latest
        "
        class="chat-preview"
        role="status">
        <strong>{{ latest.SenderName || 'Người dùng' }}</strong>
        <span>{{
          latest.Type === 'jpg' ? 'Đã gửi một ảnh' : latest.Message
        }}</span>
      </span>
    </button>
    <div
      *ngIf="open && chat.canView"
      id="blog-chat-panel"
      class="chat-box-container">
      <app-chat-box (closeChat)="open = false" />
    </div>
  `,
  styleUrl: './chat-widget.component.scss',
})
export class ChatWidgetComponent implements OnInit, OnDestroy {
  chat = inject(ChatService);
  private destroyRef = inject(DestroyRef);
  open = false;
  ngOnInit(): void {
    void this.chat.startConnection().catch(() => undefined);
    interval(15000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        void this.chat.syncNotifications();
        void this.chat.startConnection().catch(() => undefined);
      });
  }
  ngOnDestroy(): void {
    this.chat.stopConnection();
  }
}
