import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChange,
  SimpleChanges,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { FormValidatorsCommon } from '../../../../helpers/validator/form/validator-form';
import {
  IRequestProvinceCreate,
  IResponseProvinceCreate,
} from '../../../../interfaces/province';

@Component({
  selector: 'save-province-popup',
  standalone: true,
  imports: [
    NzFormModule,
    NzSwitchModule,
    ReactiveFormsModule,
    NzIconModule,
    NzInputModule,
    NzButtonModule,
    NzModalModule,
  ],
  templateUrl: './save-province-popup.component.html',
  styleUrl: './save-province-popup.component.scss',
})
export class SaveProvincePopupComponent implements OnChanges {
  constructor(private fb: NonNullableFormBuilder) {}
  @Input() formDataSource!: IRequestProvinceCreate;
  @Input() isOpenPopup!: boolean;
  @Input() titlePopup: string = '';

  @Output() isOpenPopupChange = new EventEmitter<boolean>();
  @Output() onSave = new EventEmitter<IRequestProvinceCreate>();

  validateForm = this.fb.group({
    ProvinceCode: this.fb.control('', [
      FormValidatorsCommon.Required({
        en: `ProvinceCodeIsRequired!`,
      }),
      FormValidatorsCommon.StringCode({
        en: `ProvinceCodeIsNotValid!`,
      }),
    ]),
    ProvinceName: this.fb.control('', [
      FormValidatorsCommon.Required({
        en: `ProvinceNameIsRequired!`,
      }),
    ]),
    FlagActive: this.fb.control(true),
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['formDataSource'] && this.formDataSource) {
      this.validateForm.patchValue(this.formDataSource);
    }
  }

  handleSave() {
    if (this.validateForm.valid) {
      const formValue = this.validateForm.value as IRequestProvinceCreate;
      this.onSave.emit(formValue);
      this.handleCancel();
    } else {
      Object.values(this.validateForm.controls).forEach((control) => {
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
    this.validateForm.reset({
      ProvinceCode: '',
      ProvinceName: '',
      FlagActive: true,
    });
  }
}
