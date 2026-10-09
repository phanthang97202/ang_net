import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  inject,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { lastValueFrom, tap } from 'rxjs';
import {
  IArchiveCollection,
  IArchiveItem,
  IArchiveItemCreate,
} from '../../../interfaces';
import { ArchiveService, ArchiveUploadEvent, AuthService } from '../../../services';
import {
  ResolvedLinkEmbed,
  resolveLinkEmbed,
} from '../../../helpers/utils/embed-url';
import { ArchiveProviderIconComponent } from '../archive-provider-icon/archive-provider-icon.component';

type ItemFormMode = 'upload' | 'link';

interface PendingFile {
  file: File;
  kind: 'Image' | 'Video';
  previewUrl: string;
  status: 'pending' | 'uploading' | 'done' | 'error';
  percent: number;
  error: string;
}

const MAX_FILES_PER_BATCH = 20;

/**
 * Modal thêm / sửa mục lưu trữ.
 * - Thêm: tải 1 hoặc nhiều ảnh/video (mỗi file thành một mục), hoặc dán link.
 * - Sửa (item != null): tiêu đề, ghi chú, ngày, chuyển sang bộ khác.
 */
@Component({
  selector: 'app-archive-item-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzModalModule,
    NzIconModule,
    ArchiveProviderIconComponent,
  ],
  templateUrl: './archive-item-form.component.html',
  styleUrl: './archive-item-form.component.scss',
})
export class ArchiveItemFormComponent implements OnChanges, OnDestroy {
  @Input() visible = false;
  @Input({ required: true }) collectionId = '';
  @Input() item: IArchiveItem | null = null;
  /** Đã lưu xong (ít nhất một mục) - bên ngoài tải lại danh sách */
  @Output() saved = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private archiveService = inject(ArchiveService);
  private message = inject(NzMessageService);
  private auth = inject(AuthService);

  get canUpload(): boolean { return this.auth.hasPermission('archive.upload'); }

  mode: ItemFormMode = 'upload';
  files: PendingFile[] = [];
  linkPreview: ResolvedLinkEmbed | null = null;
  collections: IArchiveCollection[] = [];
  isSaving = false;
  isDragOver = false;

  form = this.fb.nonNullable.group({
    SourceUrl: [''],
    LinkKind: this.fb.nonNullable.control<'Link' | 'Image' | 'Video'>('Link'),
    Title: ['', [Validators.maxLength(300)]],
    Note: ['', [Validators.maxLength(10000)]],
    ThumbnailUrl: [''],
    // Chuỗi yyyy-MM-dd của <input type="date">
    TakenAt: [''],
    CollectionId: [''],
  });

  ngOnChanges(): void {
    if (!this.visible) return;

    this.clearFiles();
    this.linkPreview = null;
    this.mode = this.item?.Kind === 'Link' || !this.canUpload ? 'link' : 'upload';
    this.form.reset({
      SourceUrl: this.item?.SourceUrl ?? '',
      LinkKind: this.item?.Kind ?? 'Link',
      Title: this.item?.Title ?? '',
      Note: this.item?.Note ?? '',
      ThumbnailUrl: this.item?.Kind === 'Link' ? this.item.ThumbnailUrl : '',
      TakenAt: this.item ? this.item.TakenAt?.slice(0, 10) ?? '' : this.today(),
      CollectionId: this.item?.CollectionId ?? this.collectionId,
    });
    if (this.item?.Kind === 'Link') {
      this.onLinkChange();
    }

    if (this.item) {
      this.archiveService.myCollections().subscribe({
        next: response => (this.collections = response?.DataList ?? []),
      });
    }
  }

  ngOnDestroy(): void {
    this.clearFiles();
  }

  get isEdit(): boolean {
    return !!this.item;
  }

  get title(): string {
    return this.isEdit ? 'Sửa mục lưu trữ' : 'Thêm vào bộ sưu tập';
  }

  setMode(mode: ItemFormMode): void {
    if (this.isSaving || (mode === 'upload' && !this.canUpload)) return;
    this.mode = mode;
  }

  onFileInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.addFiles(Array.from(input.files ?? []));
    // Cho phép chọn lại đúng file vừa bỏ
    input.value = '';
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    this.addFiles(Array.from(event.dataTransfer?.files ?? []));
  }

  onDragOver(event: DragEvent, isOver: boolean): void {
    event.preventDefault();
    this.isDragOver = isOver;
  }

  removeFile(pending: PendingFile): void {
    if (this.isSaving) return;
    URL.revokeObjectURL(pending.previewUrl);
    this.files = this.files.filter(f => f !== pending);
  }

  onLinkChange(): void {
    const url = this.form.controls.SourceUrl.value.trim();
    this.linkPreview = this.form.controls.LinkKind.value === 'Link' && this.isHttpUrl(url) ? resolveLinkEmbed(url) : null;
  }

  submit(): void {
    if (this.isSaving) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.isEdit) {
      this.saveEdit();
    } else if (this.mode === 'link') {
      this.saveLink();
    } else {
      void this.saveUploads();
    }
  }

  close(): void {
    if (this.isSaving) return;
    this.closed.emit();
  }

  private addFiles(selected: File[]): void {
    if (this.isSaving || !this.canUpload || this.mode !== 'upload') return;
    const accepted = selected.filter(
      f => f.type.startsWith('image/') || f.type.startsWith('video/')
    );
    if (accepted.length < selected.length) {
      this.message.warning('Chỉ nhận file ảnh hoặc video');
    }

    const room = MAX_FILES_PER_BATCH - this.files.length;
    if (accepted.length > room) {
      this.message.warning(`Mỗi lần tải tối đa ${MAX_FILES_PER_BATCH} file`);
    }

    // Chỉ xem trước tại máy; file chỉ được tải lên khi bấm Lưu
    for (const file of accepted.slice(0, Math.max(room, 0))) {
      this.files.push({
        file,
        kind: file.type.startsWith('video/') ? 'Video' : 'Image',
        previewUrl: URL.createObjectURL(file),
        status: 'pending',
        percent: 0,
        error: '',
      });
    }
  }

  private async saveUploads(): Promise<void> {
    if (!this.canUpload) { this.message.warning('Bạn chưa được cấp quyền tải ảnh/video từ thiết bị'); return; }
    const queue = this.files.filter(f => f.status !== 'done');
    if (queue.length === 0) {
      this.message.warning('Hãy chọn ít nhất một ảnh hoặc video');
      return;
    }

    const value = this.form.getRawValue();
    this.isSaving = true;
    let savedCount = 0;

    // Tải lần lượt từng file: song song nhiều video sẽ nghẽn mạng và khó báo tiến trình
    for (const pending of queue) {
      pending.status = 'uploading';
      pending.percent = 0;
      pending.error = '';
      let deleteToken: string | null = null;

      try {
        const uploaded = await lastValueFrom(
          this.archiveService.uploadFile(pending.file, pending.kind).pipe(
            tap(event => {
              if (event.type === 'progress') pending.percent = event.percent;
            })
          )
        );
        if (uploaded.type !== 'done') throw new Error('Tải file thất bại');
        deleteToken = uploaded.deleteToken;

        const response = await lastValueFrom(
          this.archiveService.createItem(
            this.buildUploadRequest(pending, uploaded, value, queue.length)
          )
        );
        if (!response?.Success) {
          throw new Error(response?.ErrorMessage || 'Không lưu được mục');
        }

        pending.status = 'done';
        pending.percent = 100;
        savedCount++;
      } catch (err: unknown) {
        // Đã lên Cloudinary nhưng không lưu được vào DB -> dọn file ngay
        this.archiveService.discardUpload(deleteToken);
        pending.status = 'error';
        pending.error = this.readUploadError(err);
      }
    }

    this.isSaving = false;

    if (savedCount > 0) {
      this.saved.emit();
    }

    const failed = this.files.filter(f => f.status === 'error').length;
    if (failed === 0) {
      this.message.success(`Đã lưu ${savedCount} mục`);
      this.closed.emit();
    } else {
      // Giữ modal mở, file lỗi vẫn ở đó để bấm Lưu thử lại
      this.message.error(`${failed} file chưa lưu được`);
      for (const done of this.files.filter(f => f.status === 'done')) {
        URL.revokeObjectURL(done.previewUrl);
      }
      this.files = this.files.filter(f => f.status !== 'done');
    }
  }

  private buildUploadRequest(
    pending: PendingFile,
    uploaded: Extract<ArchiveUploadEvent, { type: 'done' }>,
    value: { Title: string; Note: string; TakenAt: string },
    batchSize: number
  ): IArchiveItemCreate {
    // Tải nhiều file một lúc thì tiêu đề chung không còn ý nghĩa, lấy tên file
    const fileTitle = pending.file.name.replace(/\.[^.]+$/, '');
    return {
      CollectionId: this.collectionId,
      Kind: pending.kind,
      SourceUrl: uploaded.secureUrl,
      StoragePublicId: uploaded.publicId,
      ThumbnailUrl:
        pending.kind === 'Video'
          ? this.archiveService.videoPosterUrl(uploaded.secureUrl)
          : '',
      Title: (batchSize === 1 && value.Title.trim()) || fileTitle,
      Note: value.Note.trim(),
      Width: uploaded.width || null,
      Height: uploaded.height || null,
      DurationSeconds: uploaded.durationSeconds,
      Bytes: uploaded.bytes || null,
      TakenAt: this.toTakenAt(value.TakenAt),
    };
  }

  private saveLink(): void {
    const value = this.form.getRawValue();
    const url = value.SourceUrl.trim();
    if (!this.isHttpUrl(url)) {
      this.message.warning('Link cần bắt đầu bằng http:// hoặc https://');
      return;
    }

    this.isSaving = true;
    this.archiveService
      .createItem({
        CollectionId: this.collectionId,
        Kind: value.LinkKind,
        SourceUrl: url,
        StoragePublicId: '',
        ThumbnailUrl: value.LinkKind === 'Image' ? url : value.ThumbnailUrl.trim() || this.linkPreview?.thumbnailUrl || '',
        Title: value.Title.trim(),
        Note: value.Note.trim(),
        Width: null,
        Height: null,
        DurationSeconds: null,
        Bytes: null,
        TakenAt: this.toTakenAt(value.TakenAt),
      })
      .subscribe({
        next: response => this.afterSave(response?.Success, response?.ErrorMessage),
        error: () => this.afterSave(false, ''),
      });
  }

  private saveEdit(): void {
    const value = this.form.getRawValue();
    this.isSaving = true;
    this.archiveService
      .updateItem({
        ItemId: this.item!.ItemId,
        CollectionId: value.CollectionId || this.item!.CollectionId,
        Title: value.Title.trim(),
        Note: value.Note.trim(),
        ThumbnailUrl: value.ThumbnailUrl.trim(),
        TakenAt: this.toTakenAt(value.TakenAt),
      })
      .subscribe({
        next: response => this.afterSave(response?.Success, response?.ErrorMessage),
        error: () => this.afterSave(false, ''),
      });
  }

  private afterSave(success: boolean | undefined, errorMessage: string | undefined): void {
    this.isSaving = false;
    if (!success) {
      this.message.error(errorMessage || 'Không lưu được mục');
      return;
    }
    this.message.success('Đã lưu');
    this.saved.emit();
    this.closed.emit();
  }

  /**
   * Ngày kỷ niệm chỉ có ngày, không có giờ: lưu nửa đêm UTC và hiển thị theo
   * UTC, để người ở múi giờ nào xem cũng thấy đúng ngày đã chọn.
   */
  private toTakenAt(value: string): string | null {
    return /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00Z` : null;
  }

  private today(): string {
    // Use the user's local date, not UTC (which can still be yesterday).
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  /** Cloudinary trả lỗi dạng { error: { message } } trong HttpErrorResponse.error */
  private readUploadError(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      return err.error?.error?.message || err.message;
    }
    return err instanceof Error ? err.message : 'Tải file thất bại';
  }

  private clearFiles(): void {
    for (const pending of this.files) {
      URL.revokeObjectURL(pending.previewUrl);
    }
    this.files = [];
  }

  private isHttpUrl(value: string): boolean {
    try {
      const url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }
}
