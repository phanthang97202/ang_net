import { Component, inject, OnInit } from '@angular/core';
import {
  ShowErrorService,
  LoadingService,
  ApiService,
} from '../../../../services';
import {
  IProvince,
  IRequestProvinceCreate,
  IResponseProvinceCreate,
  IBaseResponse,
} from '../../../../interfaces';
import { NzMessageService } from 'ng-zorro-antd/message';
import { TTitlePopup } from '../type';
import { NzUploadFile } from 'ng-zorro-antd/upload';
import { Checker } from '../../../../helpers';
import { NonNullableFormBuilder } from '@angular/forms';
import {
  AntdModule,
  REUSE_COMPONENT_MODULES,
  REUSE_PIPE_MODULE,
} from '../../../../modules';
@Component({
  selector: 'app-mst-province',
  standalone: true,
  imports: [AntdModule, ...REUSE_COMPONENT_MODULES, ...REUSE_PIPE_MODULE],
  templateUrl: './mst-province-list.component.html',
  styleUrls: ['./mst-province-list.component.scss'],
})
export class MstProvinceComponent implements OnInit {
  private api = inject(ApiService);
  private showErrorService = inject(ShowErrorService);
  private message = inject(NzMessageService);
  private loadingService = inject(LoadingService);
  private fb = inject(NonNullableFormBuilder);

  dataSource: IProvince[] = [];
  titlePopup: TTitlePopup = '';
  formDataSource: IRequestProvinceCreate = this.getDefaultFormData();
  _isOpenPopup = false;
  _isOpenImportExcelPopup = false;

  validateForm = this.fb.group({
    Keyword: this.fb.control(''),
  });

  listButtonsHeader = [
    {
      text: 'Create',
      iconType: 'plus',
      onClick: () => this.handleOpenCreate(),
    },
    {
      text: 'ImportExcel',
      iconType: 'upload',
      onClick: () => this.handleOpenImportExcel(),
    },
    {
      text: 'ExportExcel',
      iconType: 'export',
      onClick: () => this.handleExportExcel(),
    },
  ];

  ngOnInit(): void {
    this.fetchData();
  }

  private fetchData(): void {
    this.setLoading(true);
    this.api
      .MstProvinceSearch({ pageIndex: 0, pageSize: 100, keyword: '' })
      .subscribe({
        next: response => {
          if (response?.Success) {
            this.dataSource = response.objResult?.DataList || [];
          } else {
            this.showErrorService.setShowError({
              icon: 'warning',
              message: JSON.stringify(response, null, 2),
              title: response?.ErrorMessage || 'Error',
            });
          }
        },
        error: err => this.handleApiError(err),
        complete: () => this.setLoading(false),
      });
  }

  private createData(formValue: IRequestProvinceCreate): void {
    this.setLoading(true);
    this.api.MstProvinceCreate(formValue).subscribe({
      next: response =>
        this.handleApiResponse<IResponseProvinceCreate>(
          response,
          'Create successfully'
        ),
      error: err => this.handleApiError(err),
      complete: () => this.setLoading(false),
    });
  }

  private updateData(formValue: IRequestProvinceCreate): void {
    this.setLoading(true);
    this.api.MstProvinceUpdate(formValue).subscribe({
      next: response =>
        this.handleApiResponse<IResponseProvinceCreate>(
          response,
          'Update successfully'
        ),
      error: err => this.handleApiError(err),
      complete: () => this.setLoading(false),
    });
  }

  private uploadFile(file: NzUploadFile[]) {
    this.setLoading(true);
    this.api.MstProvinceImportExcel(file[0].originFileObj!).subscribe({
      next: response =>
        this.handleApiResponse<IResponseProvinceCreate>(
          response,
          'Import successfully'
        ),
      error: err => this.handleApiError(err),
      complete: () => this.setLoading(false),
    });
  }

  private exportTemplateFile() {
    this.setLoading(true);
    this.api.MstProvinceExportTemplate().subscribe({
      next: response => {
        Checker.DownloadFile(response, 'Mst_Provice_Template');
      },
      error: err => this.handleApiError(err),
      complete: () => this.setLoading(false),
    });
  }

  private exportExcel() {
    this.setLoading(true);
    this.api.MstProvinceExportExcel().subscribe({
      next: response => {
        Checker.DownloadFile(response, 'Mst_Provice_Data');
      },
      error: err => this.handleApiError(err),
      complete: () => this.setLoading(false),
    });
  }

  private deleteData(key: string): void {
    this.setLoading(true);
    this.api.MstProvinceDelete(key).subscribe({
      next: () => {
        this.message.success('Delete successfully');
        this.fetchData();
      },
      error: err => this.handleApiError(err),
      complete: () => this.setLoading(false),
    });
  }

  handleOpenImportExcel(): void {
    this._isOpenImportExcelPopup = true;
  }

  handleOpenCreate(): void {
    this._isOpenPopup = true;
    this.titlePopup = 'Create';
    this.formDataSource = this.getDefaultFormData();
  }

  handleDetail(data: IRequestProvinceCreate): void {
    this._isOpenPopup = true;
    this.titlePopup = 'Update';
    this.formDataSource = { ...data };
  }

  handleDelete(data: IRequestProvinceCreate): void {
    this.deleteData(data.ProvinceCode);
  }

  handleSaveForm(formValue: IRequestProvinceCreate): void {
    if (this.titlePopup === 'Create') {
      this.createData(formValue);
    } else {
      this.updateData(formValue);
    }
  }

  handleUploadFile(file: NzUploadFile[]) {
    this.uploadFile(file);
  }

  handleExportTemplateFile() {
    this.exportTemplateFile();
  }

  handleExportExcel() {
    this.exportExcel();
  }

  private setLoading(isLoading: boolean): void {
    this.loadingService.setLoading(isLoading);
  }

  private handleApiResponse<T extends IBaseResponse<IProvince>>(
    response: T,
    successMessage: string
  ) {
    if (response?.Success) {
      this.message.success(successMessage);
      this._isOpenPopup = false;
      this._isOpenImportExcelPopup = false;
      this.fetchData();
    } else {
      this.showErrorService.setShowError({
        icon: 'warning',
        message: JSON.stringify(response, null, 2),
        title: response?.ErrorMessage || 'Error',
      });
    }
  }

  private handleApiError(err: any): void {
    this.setLoading(false);
    this.showErrorService.setShowError({
      icon: 'warning',
      message: JSON.stringify(err, null, 2),
      title: err.message || 'Error',
    });
  }

  private getDefaultFormData(): IRequestProvinceCreate {
    return {
      ProvinceCode: '',
      ProvinceName: '',
      FlagActive: true,
    };
  }
}
