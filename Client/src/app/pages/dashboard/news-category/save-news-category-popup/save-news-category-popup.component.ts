import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { NonNullableFormBuilder } from '@angular/forms';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzUploadFile } from 'ng-zorro-antd/upload';
import { FormValidatorsCommon } from '../../../../helpers';
import {
  INewsCategoryAdmin,
  IRequestNewsCategoryCreate,
} from '../../../../interfaces';
import {
  AntdModule,
  REUSE_COMPONENT_MODULES,
  REUSE_PIPE_MODULE,
} from '../../../../modules';
import { TTitlePopup } from '../type';
import {
  CloudinaryService,
  CloudinaryUploadResult,
} from '../../../../services';

@Component({
  selector: 'app-save-news-category-popup',
  standalone: true,
  imports: [AntdModule, ...REUSE_COMPONENT_MODULES, REUSE_PIPE_MODULE],
  templateUrl: './save-news-category-popup.component.html',
  styleUrl: './save-news-category-popup.component.scss',
})
export class SaveNewsCategoryPopupComponent implements OnChanges {
  constructor(private fb: NonNullableFormBuilder) {}

  private cloudinary = inject(CloudinaryService);
  private message = inject(NzMessageService);
  isUploadingLogo = false;

  @Input() formDataSource!: IRequestNewsCategoryCreate;
  @Input() isOpenPopup!: boolean;
  @Input() titlePopup: TTitlePopup = '';
  /** Danh sách để chọn danh mục cha, lấy từ chính bảng đang hiển thị */
  @Input() parentOptions: INewsCategoryAdmin[] = [];

  @Output() isOpenPopupChange = new EventEmitter<boolean>();
  @Output() _onSave = new EventEmitter<IRequestNewsCategoryCreate>();

  validateForm = this.fb.group({
    NewsCategoryId: this.fb.control('', [
      FormValidatorsCommon.Required({ en: 'NewsCategoryIdIsRequired!' }),
    ]),
    NewsCategoryName: this.fb.control('', [
      FormValidatorsCommon.Required({
        en: 'VietnameseCategoryNameIsRequired!',
      }),
    ]),
    NewsCategoryNameEn: this.fb.control('', [
      FormValidatorsCommon.Required({ en: 'EnglishCategoryNameIsRequired!' }),
    ]),
    NewsCategoryLogo: this.fb.control(''),
    NewsCategoryParentId: this.fb.control(''),
    NewsCategoryIndex: this.fb.control(0),
    IsGlobal: this.fb.control(false),
    FlagActive: this.fb.control(true),
  });

  /** Không cho chọn chính nó làm cha (sẽ tạo vòng lặp danh mục) */
  get selectableParents(): INewsCategoryAdmin[] {
    const currentId = this.formDataSource?.NewsCategoryId;
    return this.parentOptions.filter(x => x.NewsCategoryId !== currentId);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['formDataSource'] && this.formDataSource) {
      this.validateForm.patchValue(this.formDataSource);
    }

    if (changes['isOpenPopup']) {
      if (changes['isOpenPopup'].currentValue === false) {
        this.handleResetForm();
      }

      if (this.titlePopup === 'Create') {
        this.handleGetField('NewsCategoryId')?.enable();
        // Backend luôn set FlagActive = true khi tạo mới
        this.handleGetField('FlagActive')?.disable();
      } else {
        // Khóa mã danh mục khi sửa (là khóa chính)
        this.handleGetField('NewsCategoryId')?.disable();
        this.handleGetField('FlagActive')?.enable();
      }
    }
  }

  handleGetField(fieldName: keyof IRequestNewsCategoryCreate) {
    return this.validateForm.get(fieldName);
  }

  get logoUrl(): string {
    return this.validateForm.controls.NewsCategoryLogo.value;
  }

  handleUploadLogo = (file: NzUploadFile): boolean => {
    const isImage = !!file.type?.startsWith('image/');
    if (!isImage) {
      this.message.error('Logo must be an image file');
      return false;
    }

    const isUnder5Mb = (file.size || 0) <= 5 * 1024 * 1024;
    if (!isUnder5Mb) {
      this.message.error('Logo must be smaller than 5 MB');
      return false;
    }

    this.isUploadingLogo = true;
    this.cloudinary.uploadImage(file as unknown as File).subscribe({
      next: response => {
        const result = response as CloudinaryUploadResult;
        this.validateForm.controls.NewsCategoryLogo.setValue(result.secure_url);
        this.validateForm.controls.NewsCategoryLogo.markAsDirty();
        this.message.success('Logo uploaded successfully');
      },
      error: () => {
        this.isUploadingLogo = false;
        this.message.error('Logo upload failed');
      },
      complete: () => (this.isUploadingLogo = false),
    });

    return false;
  };

  handleRemoveLogo(): void {
    this.validateForm.controls.NewsCategoryLogo.setValue('');
    this.validateForm.controls.NewsCategoryLogo.markAsDirty();
  }

  handleSave() {
    if (this.isUploadingLogo) {
      this.message.warning('Please wait for the logo upload to finish');
      return;
    }

    if (this.validateForm.valid) {
      const remainFormValue = this.validateForm.getRawValue();

      const payload: IRequestNewsCategoryCreate = {
        ...remainFormValue,
        // input type="number" trả về chuỗi -> ép về số để backend bind int
        NewsCategoryIndex: Number(remainFormValue.NewsCategoryIndex) || 0,
        // nz-select nzAllowClear có thể set null -> ép về '' để không gửi "null"
        NewsCategoryParentId: remainFormValue.NewsCategoryParentId || '',
      };

      this._onSave.emit(payload);
    } else {
      Object.values(this.validateForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }

  handleCancel() {
    this.isOpenPopup = false;
    this.isOpenPopupChange.emit(this.isOpenPopup);
    this.handleResetForm();
  }

  handleResetForm() {
    this.validateForm.reset({
      NewsCategoryId: '',
      NewsCategoryName: '',
      NewsCategoryNameEn: '',
      NewsCategoryLogo: '',
      NewsCategoryParentId: '',
      NewsCategoryIndex: 0,
      IsGlobal: false,
      FlagActive: true,
    });
  }
}
