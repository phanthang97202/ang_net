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
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { IMusicCollection, TArchiveVisibility } from '../../interfaces';
import { MusicLibraryService } from '../../services';
import { ARCHIVE_VISIBILITY_OPTIONS } from '../archive/archive-visibility';

/**
 * Modal tạo / sửa bộ sưu tập nhạc. collection = null là tạo mới. Cùng khung và
 * cùng 3 chế độ hiển thị với form bộ sưu tập của Thư viện lưu trữ.
 */
@Component({
  selector: 'app-music-collection-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzModalModule,
    NzIconModule,
    TranslateModule,
  ],
  templateUrl: './music-collection-form.component.html',
  styleUrl:
    '../archive/archive-collection-form/archive-collection-form.component.scss',
})
export class MusicCollectionFormComponent implements OnChanges {
  @Input() visible = false;
  @Input() collection: IMusicCollection | null = null;
  @Output() saved = new EventEmitter<IMusicCollection>();
  @Output() closed = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private library = inject(MusicLibraryService);
  private message = inject(NzMessageService);
  private translate = inject(TranslateService);

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
      Visibility: value.Visibility,
    };

    this.isSaving = true;
    const call = this.isEdit
      ? this.library.updateCollection(request)
      : this.library.createCollection(request);

    call.subscribe({
      next: response => {
        this.isSaving = false;
        if (!response?.Success) {
          this.message.error(
            response?.ErrorMessage ||
              this.translate.instant('T_MUSIC_COLLECTION_SAVE_ERROR')
          );
          return;
        }
        this.message.success(
          this.translate.instant(
            this.isEdit
              ? 'T_MUSIC_COLLECTION_UPDATED'
              : 'T_MUSIC_COLLECTION_CREATED'
          )
        );
        this.saved.emit(response.Data);
      },
      error: () => {
        this.isSaving = false;
        this.message.error(
          this.translate.instant('T_MUSIC_COLLECTION_SAVE_ERROR')
        );
      },
    });
  }

  close(): void {
    if (this.isSaving) return;
    this.closed.emit();
  }
}
