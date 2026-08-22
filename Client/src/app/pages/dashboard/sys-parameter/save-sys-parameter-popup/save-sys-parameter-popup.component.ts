import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { NonNullableFormBuilder } from '@angular/forms';
import { FormValidatorsCommon } from '../../../../helpers';
import { IRequestSysParameterCreate } from '../../../../interfaces';
import { TTitlePopup } from '../type';
import {
  AntdModule,
  REUSE_COMPONENT_MODULES,
  REUSE_PIPE_MODULE,
} from '../../../../modules';

@Component({
  selector: 'app-save-sys-parameter-popup',
  standalone: true,
  imports: [AntdModule, ...REUSE_COMPONENT_MODULES, REUSE_PIPE_MODULE],
  templateUrl: './save-sys-parameter-popup.component.html',
  styleUrl: './save-sys-parameter-popup.component.scss',
})
export class SaveSysParameterPopupComponent implements OnChanges {
  constructor(private fb: NonNullableFormBuilder) {}

  @Input() formDataSource!: IRequestSysParameterCreate;
  @Input() isOpenPopup!: boolean;
  @Input() titlePopup: TTitlePopup = '';

  @Output() isOpenPopupChange = new EventEmitter<boolean>();
  @Output() _onSave = new EventEmitter<IRequestSysParameterCreate>();

  // Kiểu dữ liệu phổ biến; backend lưu free-text nên đây chỉ để gợi ý nhập.
  dataTypeOptions = ['string', 'int', 'bool', 'json'];

  validateForm = this.fb.group({
    // Không dùng StringCode: mã tham số theo quy ước thường có gạch dưới
    // (vd SITE_TITLE), trong khi StringCode chỉ cho phép [a-zA-Z0-9].
    ParameterCode: this.fb.control('', [
      FormValidatorsCommon.Required({ en: 'ParameterCodeIsRequired!' }),
    ]),
    Category: this.fb.control('', [
      FormValidatorsCommon.Required({ en: 'CategoryIsRequired!' }),
    ]),
    DataType: this.fb.control('string', [
      FormValidatorsCommon.Required({ en: 'DataTypeIsRequired!' }),
    ]),
    ParameterNameVi: this.fb.control('', [
      FormValidatorsCommon.Required({ en: 'ParameterNameViIsRequired!' }),
    ]),
    ParameterNameEn: this.fb.control('', [
      FormValidatorsCommon.Required({ en: 'ParameterNameEnIsRequired!' }),
    ]),
    ParameterValueVi: this.fb.control('', [
      FormValidatorsCommon.Required({ en: 'ParameterValueViIsRequired!' }),
    ]),
    ParameterValueEn: this.fb.control('', [
      FormValidatorsCommon.Required({ en: 'ParameterValueEnIsRequired!' }),
    ]),
    DefaultValueVi: this.fb.control('', [
      FormValidatorsCommon.Required({ en: 'DefaultValueViIsRequired!' }),
    ]),
    DefaultValueEn: this.fb.control('', [
      FormValidatorsCommon.Required({ en: 'DefaultValueEnIsRequired!' }),
    ]),
    DescriptionVi: this.fb.control(''),
    DescriptionEn: this.fb.control(''),
    SortOrder: this.fb.control(0),
    FlagActive: this.fb.control(true),
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['formDataSource'] && this.formDataSource) {
      this.validateForm.patchValue(this.formDataSource);
    }

    if (changes['isOpenPopup']) {
      if (changes['isOpenPopup'].currentValue === false) {
        this.handleResetForm();
      }

      if (this.titlePopup === 'Create') {
        this.handleGetField('ParameterCode')?.enable();
        this.handleGetField('FlagActive')?.disable();
      } else {
        // Khóa mã tham số khi sửa (là khóa chính)
        this.handleGetField('ParameterCode')?.disable();
        this.handleGetField('FlagActive')?.enable();
      }
    }
  }

  handleGetField(fieldName: keyof IRequestSysParameterCreate) {
    return this.validateForm.get(fieldName);
  }

  handleSave() {
    if (this.validateForm.valid) {
      const formValue = this.validateForm.value as IRequestSysParameterCreate;
      const remainFormValue = this.validateForm.getRawValue();

      const payload: IRequestSysParameterCreate = {
        ...remainFormValue,
        ...formValue,
        // input type="number" trả về chuỗi -> ép về số để backend bind int
        SortOrder: Number(remainFormValue.SortOrder) || 0,
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
      ParameterCode: '',
      Category: '',
      DataType: 'string',
      ParameterNameVi: '',
      ParameterNameEn: '',
      ParameterValueVi: '',
      ParameterValueEn: '',
      DefaultValueVi: '',
      DefaultValueEn: '',
      DescriptionVi: '',
      DescriptionEn: '',
      SortOrder: 0,
      FlagActive: true,
    });
  }
}
