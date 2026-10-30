import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { IChat } from '../../interfaces';
import { ChatService } from '../../services';

@Component({
  selector: 'app-chat-inline-image',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <button *ngIf="src" type="button" class="image-button" (click)="open.emit(src)" [attr.aria-label]="'T_CHAT_VIEW_IMAGE' | translate">
      <img [src]="src" [alt]="'T_CHAT_MESSAGE_IMAGE_ALT' | translate" referrerpolicy="no-referrer" (error)="imageFailed()" />
    </button>
    <span *ngIf="loading" class="image-status" role="status">{{ 'T_CHAT_LOADING_IMAGE' | translate }}</span>
    <div *ngIf="error" class="image-status" role="alert">
      <span>{{ 'T_CHAT_IMAGE_LOAD_ERROR' | translate }}</span>
      <button type="button" class="retry" (click)="load()">{{ 'T_CHAT_IMAGE_RETRY' | translate }}</button>
    </div>
  `,
  styles: [`
    :host { display: block; max-width: 100%; }
    .image-button { display: block; width: min(220px, 100%); max-width: 100%; aspect-ratio: 4 / 3; padding: 0; border: 0; border-radius: 10px; overflow: hidden; background: var(--color-control-bg); cursor: pointer; }
    .image-button:focus-visible, .retry:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 3px; }
    img { display: block; width: 100%; height: 100%; object-fit: contain; }
    .image-status { display: grid; align-content: center; gap: 6px; width: min(220px, 100%); min-height: 120px; color: var(--color-text-muted); font-size: 11px; line-height: 1.5; }
    .retry { justify-self: start; border: 0; padding: 0; background: transparent; color: var(--color-accent); cursor: pointer; font: inherit; font-weight: 700; }
  `],
})
export class ChatInlineImageComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) message!: IChat;
  @Output() open = new EventEmitter<string>();
  private readonly chat = inject(ChatService);
  private request?: Subscription;
  src = ''; loading = false; error = false;

  ngOnChanges(): void { this.load(); }
  ngOnDestroy(): void { this.release(); }
  load(): void {
    this.release(); this.error = false;
    if (this.message.Type === 'jpg') {
      if (/^https:\/\//i.test(this.message.Message)) this.src = this.message.Message;
      else this.error = true;
      return;
    }
    this.loading = true;
    this.request = this.chat.getImage(this.message.MessageId).subscribe({
      next: blob => { this.src = URL.createObjectURL(blob); this.loading = false; },
      error: () => { this.loading = false; this.error = true; },
    });
  }
  imageFailed(): void { this.release(); this.error = true; }
  private release(): void {
    this.request?.unsubscribe(); this.request = undefined;
    if (this.src.startsWith('blob:')) URL.revokeObjectURL(this.src);
    this.src = ''; this.loading = false;
  }
}
