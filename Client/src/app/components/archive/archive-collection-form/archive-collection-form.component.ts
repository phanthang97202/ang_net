import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  inject,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { IArchiveCollection, TArchiveVisibility } from '../../../interfaces';
import { ArchiveService } from '../../../services';
import { ARCHIVE_VISIBILITY_OPTIONS } from '../archive-visibility';

/** Modal tạo / sửa bộ sưu tập. collection = null là tạo mới. */
@Component({
  selector: 'app-archive-collection-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzModalModule,
    NzIconModule,
  ],
  templateUrl: './archive-collection-form.component.html',
  styleUrl: './archive-collection-form.component.scss',
})
export class ArchiveCollectionFormComponent implements OnChanges {
  @Input() visible = false;
  @Input() collection: IArchiveCollection | null = null;
  @Output() saved = new EventEmitter<IArchiveCollection>();
  @Output() closed = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private archiveService = inject(ArchiveService);
  private message = inject(NzMessageService);

  readonly visibilityOptions = ARCHIVE_VISIBILITY_OPTIONS;
  isSaving = false;

  form = this.fb.nonNullable.group({
    Name: ['', [Validators.required, Validators.maxLength(150)]],
    Description: ['', [Validators.maxLength(2000)]],
    Visibility: ['Private' as TArchiveVisibility],
  });

  ngOnChanges(): void {
    if (!this.visible) return;
    this.form.reset({
      Name: this.collection?.Name ?? '',
      Description: this.collection?.Description ?? '',
      Visibility: this.collection?.Visibility ?? 'Private',
    });
  }

  get isEdit(): boolean {
    return !!this.collection;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const request = {
      CollectionId: this.collection?.CollectionId ?? '',
      Name: value.Name.trim(),
      Description: value.Description.trim(),
      // Giữ nguyên ảnh bìa tự chọn; form này không sửa ảnh bìa
      CoverUrl: this.collection?.CustomCoverUrl ?? '',
      Visibility: value.Visibility,
    };

    this.isSaving = true;
    const call = this.isEdit
      ? this.archiveService.updateCollection(request)
      : this.archiveService.createCollection(request);

    call.subscribe({
      next: response => {
        this.isSaving = false;
        if (!response?.Success) {
          this.message.error(response?.ErrorMessage || 'Không lưu được bộ sưu tập');
          return;
        }
        this.message.success(this.isEdit ? 'Đã cập nhật bộ sưu tập' : 'Đã tạo bộ sưu tập');
        this.saved.emit(response.Data);
      },
      error: () => {
        this.isSaving = false;
        this.message.error('Không lưu được bộ sưu tập');
      },
    });
  }

  close(): void {
    if (this.isSaving) return;
    this.closed.emit();
  }
}
