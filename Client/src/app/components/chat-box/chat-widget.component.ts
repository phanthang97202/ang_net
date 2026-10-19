import {
  Component,
  DestroyRef,
  effect,
  inject,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { interval } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChatService } from '../../services/ws-chat.service';
import { BrowserTitleService } from '../../services/browser-title.service';
import { ChatBoxComponent } from './chat-box.component';

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [CommonModule, NzIconModule, ChatBoxComponent],
  template: `
    <button
      *ngIf="chat.canView"
      class="chat-toggle-btn"
      [class.has-personal-notes]="hasPersonalNotes"
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
          latest.Type === 'jpg' || latest.Type === 'image'
            ? '[Hình ảnh]'
            : latest.Message
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
  @Input() hasPersonalNotes = false;
  chat = inject(ChatService);
  private destroyRef = inject(DestroyRef);
  private title = inject(BrowserTitleService);
  open = false;
  constructor() {
    effect(() => {
      this.title.setUnreadCount(
        this.chat.canView ? this.chat.unreadCount() : 0
      );
    });
  }
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
    this.title.setUnreadCount(0);
    this.chat.stopConnection();
  }
}
