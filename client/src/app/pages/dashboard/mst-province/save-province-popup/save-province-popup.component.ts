import { Component, Input } from '@angular/core';
import {
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { IProvince } from '../../../../interfaces/province';

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
export class SaveProvincePopupComponent {
  @Input() isOpenPopup: boolean = false;
  @Input() titlePopup: string = '';
  @Input() formDataSource: Partial<IProvince> = {
    ProvinceCode: '',
    ProvinceName: '',
    FlagActive: true,
  };

  validateForm: FormGroup<{
    ProvinceCode: FormControl<string>;
    ProvinceName: FormControl<string>;
    FlagActive: FormControl<boolean>;
  }>;

  constructor(private fb: NonNullableFormBuilder) {
    // use `MyValidators`
    const { required } = ProvinceValidators;
    this.validateForm = this.fb.group({
      ProvinceCode: ['', [required]],
      ProvinceName: ['', [required]],
      FlagActive: [false],
    });
  }

  handleSave() {
    if (this.validateForm.valid) {
      console.log('submit', this.validateForm.value);
    } else {
      Object.values(this.validateForm.controls).forEach((control) => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }
}

export class ProvinceValidators extends Validators {}
