import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { ISysMenuSave, ISysMenuTree } from '../../../../interfaces';
import { AntdModule, REUSE_COMPONENT_MODULES } from '../../../../modules';

@Component({
  selector: 'app-save-sys-menu-popup',
  standalone: true,
  imports: [AntdModule, ...REUSE_COMPONENT_MODULES],
  templateUrl: './save-sys-menu-popup.component.html',
  styleUrl: './save-sys-menu-popup.component.scss',
})
export class SaveSysMenuPopupComponent implements OnChanges {
  constructor(private fb: NonNullableFormBuilder) {}

  @Input() formDataSource!: ISysMenuSave;
  @Input() isOpenPopup = false;
  @Input() titlePopup: 'Create' | 'Update' = 'Create';
  @Input() parentOptions: ISysMenuTree[] = [];

  @Output() isOpenPopupChange = new EventEmitter<boolean>();
  @Output() _onSave = new EventEmitter<ISysMenuSave>();

  // Icon hay dùng cho menu. Backend lưu free-text nên đây chỉ để gợi ý, gõ tên
  // icon khác của ng-zorro vẫn được.
  iconOptions = [
    'home',
    'tool',
    'play-circle',
    'trophy',
    'read',
    'calculator',
    'file-text',
    'dollar',
    'appstore',
    'user',
    'setting',
    'team',
  ];

  validateForm = this.fb.group({
    // Mã menu là khóa chính, sửa thì coi như menu khác - nên chỉ cho nhập lúc tạo.
    MenuId: this.fb.control('', [Validators.required]),
    ParentId: this.fb.control(''),
    TitleVi: this.fb.control('', [Validators.required]),
    TitleEn: this.fb.control('', [Validators.required]),
    Path: this.fb.control(''),
    Icon: this.fb.control(''),
    SortOrder: this.fb.control(0),
    FlagActive: this.fb.control(true),
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['formDataSource'] && this.formDataSource) {
      this.validateForm.patchValue({ ...this.formDataSource });

      if (this.titlePopup === 'Update') {
        this.validateForm.controls.MenuId.disable();
      } else {
        this.validateForm.controls.MenuId.enable();
      }
    }

    // Dựng lại khi đổi mục đang sửa (loại chính nó ra) hoặc khi danh sách menu
    // cha thay đổi sau một lần lưu.
    if (changes['formDataSource'] || changes['parentOptions']) {
      this.rebuildSelectableParents();
    }
  }

  /**
   * Danh sách menu được phép chọn làm cha, TÍNH SẴN chứ không để template gọi.
   *
   * Getter lọc mảng sẽ trả về mảng mới mỗi lần đọc; template gọi nó trong *ngFor
   * thì Angular thấy tham chiếu khác -> vẽ lại -> change detection -> đọc lại...
   * thành vòng lặp không dừng, treo trình duyệt.
   */
  selectableParents: ISysMenuTree[] = [];

  /**
   * Khi sửa, không cho chọn chính nó làm cha: backend chặn, nhưng để lựa chọn đó
   * trong danh sách chỉ khiến người dùng bấm rồi nhận lỗi.
   */
  private rebuildSelectableParents(): void {
    const currentId = this.formDataSource?.MenuId;
    this.selectableParents = (this.parentOptions || []).filter(
      p => p.MenuId !== currentId
    );
  }

  handleClose(): void {
    this.isOpenPopup = false;
    this.isOpenPopupChange.emit(false);
  }

  handleSave(): void {
    if (!this.validateForm.valid) {
      Object.values(this.validateForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      return;
    }

    // getRawValue để lấy cả MenuId lúc đang disable (chế độ sửa).
    const raw = this.validateForm.getRawValue();

    this._onSave.emit({
      MenuId: raw.MenuId,
      ParentId: raw.ParentId || '',
      TitleVi: raw.TitleVi,
      TitleEn: raw.TitleEn,
      Path: raw.Path || '',
      Icon: raw.Icon || '',
      SortOrder: raw.SortOrder ?? 0,
      FlagActive: raw.FlagActive,
    });
  }
}
