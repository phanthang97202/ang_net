import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { NonNullableFormBuilder } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { IChat } from '../../../interfaces';
import { AntdModule } from '../../../modules/antd.module';
import { BreadcrumbComponent } from '../../../components/breadcrumb/breadcrumb.component';
import { LocalDTime } from '../../../pipes/localeDTime.pipe';
import {
  ChatService,
  LoadingService,
  ShowErrorService,
} from '../../../services';

@Component({
  selector: 'app-message-list',
  standalone: true,
  imports: [AntdModule, BreadcrumbComponent, LocalDTime],
  templateUrl: './message-list.component.html',
  styleUrl: './message-list.component.scss',
})
export class MessageListComponent implements OnInit, OnDestroy {
  private readonly chat = inject(ChatService);
  private readonly loading = inject(LoadingService);
  private readonly showError = inject(ShowErrorService);
  private readonly fb = inject(NonNullableFormBuilder);

  messages: IChat[] = [];
  pageIndex = 1;
  pageSize = 20;
  total = 0;
  isLoading = false;
  previewVisible = false;
  previewLoading = false;
  previewImage = '';
  previewError = '';
  private previewRequest = 0;
  private previewOwnsUrl = false;

  readonly searchForm = this.fb.group({
    Keyword: this.fb.control(''),
    DateRange: this.fb.control<Date[]>([]),
    DeletionStatus: this.fb.control<'all' | 'active' | 'deleted'>('all'),
  });

  ngOnInit(): void {
    this.fetchMessages();
  }

  ngOnDestroy(): void {
    this.closeImagePreview();
  }

  handleSearch(): void {
    this.pageIndex = 1;
    this.fetchMessages();
  }

  handleReset(): void {
    this.searchForm.reset({
      Keyword: '',
      DateRange: [],
      DeletionStatus: 'all',
    });
    this.pageIndex = 1;
    this.fetchMessages();
  }

  handlePageIndexChange(index: number): void {
    this.pageIndex = index;
    this.fetchMessages();
  }

  handlePageSizeChange(size: number): void {
    this.pageSize = size;
    this.pageIndex = 1;
    this.fetchMessages();
  }

  senderIdentity(message: IChat): string {
    return message.SenderEmail || message.SenderUsername || message.UserId;
  }

  typeLabel(type: string): string {
    return ['image', 'jpg', 'png'].includes((type || '').toLowerCase())
      ? 'Hình ảnh'
      : 'Văn bản';
  }

  isImage(message: IChat): boolean {
    return ['image', 'jpg', 'png'].includes((message.Type || '').toLowerCase());
  }

  async openImage(message: IChat): Promise<void> {
    this.closeImagePreview();
    const request = this.previewRequest;
    this.previewVisible = true;
    this.previewLoading = true;

    if (message.Type !== 'image' && /^https:\/\//i.test(message.Message)) {
      this.previewImage = message.Message;
      this.previewLoading = false;
      return;
    }

    try {
      const blob = await firstValueFrom(
        this.chat.getAdminImage(message.MessageId)
      );
      if (request !== this.previewRequest) return;
      this.previewImage = URL.createObjectURL(blob);
      this.previewOwnsUrl = true;
    } catch {
      if (request === this.previewRequest)
        this.previewError = 'Không thể tải ảnh.';
    } finally {
      if (request === this.previewRequest) this.previewLoading = false;
    }
  }

  closeImagePreview(): void {
    ++this.previewRequest;
    if (this.previewOwnsUrl && this.previewImage.startsWith('blob:'))
      URL.revokeObjectURL(this.previewImage);
    this.previewOwnsUrl = false;
    this.previewVisible = false;
    this.previewLoading = false;
    this.previewImage = '';
    this.previewError = '';
  }

  handlePreviewError(): void {
    this.previewImage = '';
    this.previewError = 'Không thể tải ảnh.';
  }

  trackByMessage(_: number, message: IChat): string {
    return message.MessageId;
  }

  private fetchMessages(): void {
    const { Keyword, DateRange, DeletionStatus } =
      this.searchForm.getRawValue();
    const dates = DateRange || [];
    const from = dates[0] ? new Date(dates[0]) : undefined;
    const before = dates[1] ? new Date(dates[1]) : undefined;
    from?.setHours(0, 0, 0, 0);
    if (before) {
      before.setHours(0, 0, 0, 0);
      before.setDate(before.getDate() + 1);
    }

    this.setLoading(true);
    this.chat
      .searchMessages({
        pageIndex: this.pageIndex - 1,
        pageSize: this.pageSize,
        keyword: Keyword,
        sentFrom: from?.toISOString(),
        sentBefore: before?.toISOString(),
        isDeleted:
          DeletionStatus === 'all' ? undefined : DeletionStatus === 'deleted',
      })
      .subscribe({
        next: response => {
          if (response?.Success) {
            this.messages = response.objResult?.DataList || [];
            this.total = response.objResult?.ItemCount || 0;
          } else {
            this.showError.setShowError({
              icon: 'warning',
              title: response?.ErrorMessage || 'Không thể tải tin nhắn',
              message: JSON.stringify(response, null, 2),
            });
          }
        },
        error: error => {
          this.showError.setShowError({
            icon: 'warning',
            title: error?.message || 'Không thể tải tin nhắn',
            message: JSON.stringify(error, null, 2),
          });
          this.setLoading(false);
        },
        complete: () => this.setLoading(false),
      });
  }

  private setLoading(value: boolean): void {
    this.isLoading = value;
    this.loading.setLoading(value);
  }
}
