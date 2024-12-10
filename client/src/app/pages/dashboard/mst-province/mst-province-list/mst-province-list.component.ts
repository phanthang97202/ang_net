import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzTableModule } from 'ng-zorro-antd/table';
import { AuthService } from '../../../../services/auth.service';
import { ShowErrorService } from '../../../../services/show-error.service';
import { LoadingService } from '../../../../services/loading-service.service';
import { delay } from 'rxjs';
import { ApiService } from '../../../../services/api.service';
import {
  IProvince,
  IRequestProvinceCreate,
} from '../../../../interfaces/province';
import { SaveProvincePopupComponent } from '../save-province-popup/save-province-popup.component';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';

@Component({
  selector: 'app-mst-province',
  standalone: true,
  imports: [
    NzTableModule,
    NzBreadCrumbModule,
    CommonModule,
    NzIconModule,
    SaveProvincePopupComponent,
    NzButtonModule,
    NzTagModule,
  ],
  templateUrl: './mst-province-list.component.html',
  styleUrl: './mst-province-list.component.scss',
})
export class MstProvinceComponent {
  api = inject(ApiService);
  showErrorService = inject(ShowErrorService);
  message = inject(NzMessageService);
  loadingService = inject(LoadingService);

  dataSource: IProvince[] = [];
  titlePopup: string = '';
  formDataSource: IRequestProvinceCreate = {
    ProvinceCode: '',
    ProvinceName: '',
    FlagActive: true,
  };
  _isOpenPopup: boolean = false;

  ngOnInit() {
    this.fetchData();
  }

  fetchData() {
    this.loadingService.setLoading(true);
    this.api
      .MstProvinceSearch({
        pageIndex: 0,
        pageSize: 10,
        keyword: '',
      })
      .pipe()
      .subscribe({
        next: (value) => {
          this.dataSource = value.objResult.DataList;
          this.loadingService.setLoading(false);
        },
        error: (err) => {
          this.loadingService.setLoading(false);
          this.showErrorService.setShowError({
            icon: 'warning',
            message: JSON.stringify(err, null, 2),
            title: err.message,
          });
        },
        complete() {},
      });
  }

  createData(formValue: IRequestProvinceCreate) {
    this.loadingService.setLoading(true);
    this.api.MstProvinceCreate(formValue).subscribe({
      next: (value) => {
        this.loadingService.setLoading(false);
        this.message.create('success', 'Create successfully');
        this.fetchData();
      },
      error: (err) => {
        this.loadingService.setLoading(false);
        this.showErrorService.setShowError({
          icon: 'warning',
          message: JSON.stringify(err, null, 2),
          title: err.message,
        });
      },
      complete() {},
    });
  }

  updateData(formValue: IRequestProvinceCreate) {
    this.loadingService.setLoading(true);
    this.api.MstProvinceUpdate(formValue).subscribe({
      next: (value) => {
        this.loadingService.setLoading(false);
        this.message.create('success', 'Update successfully');
        this.fetchData();
      },
      error: (err) => {
        this.loadingService.setLoading(false);
        this.showErrorService.setShowError({
          icon: 'warning',
          message: JSON.stringify(err, null, 2),
          title: err.message,
        });
      },
      complete() {},
    });
  }

  deleteData(key: string) {
    this.loadingService.setLoading(true);
    this.api.MstProvinceDelete(key).subscribe({
      next: (value) => {
        this.loadingService.setLoading(false);
        this.message.create('success', 'Delete successfully');
        this.fetchData();
      },
      error: (err) => {
        this.loadingService.setLoading(false);
        this.showErrorService.setShowError({
          icon: 'warning',
          message: JSON.stringify(err, null, 2),
          title: err.message,
        });
      },
      complete() {},
    });
  }

  handleOpenCreate() {
    this._isOpenPopup = true;
    this.titlePopup = 'Create';
    this.formDataSource = {
      ProvinceCode: '',
      ProvinceName: '',
      FlagActive: true,
    };
  }

  handleDetail(data: IRequestProvinceCreate) {
    this._isOpenPopup = true;
    this.titlePopup = 'Update';
    this.formDataSource = {
      ProvinceCode: data.ProvinceCode,
      ProvinceName: data.ProvinceName,
      FlagActive: data.FlagActive,
    };
  }

  handleDelete(data: IRequestProvinceCreate) {
    this.deleteData(data.ProvinceCode);
  }

  handleSaveForm(formValue: IRequestProvinceCreate) {
    // cờ phân biệt giữa tạo và sửa
    if (this.titlePopup === 'Create') {
      this.createData(formValue);
    } else {
      this.updateData(formValue);
    }
  }
}
