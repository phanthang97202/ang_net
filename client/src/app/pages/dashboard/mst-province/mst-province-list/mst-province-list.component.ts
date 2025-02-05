import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzTableModule } from 'ng-zorro-antd/table';
import { ShowErrorService } from '../../../../services/show-error.service';
import { LoadingService } from '../../../../services/loading-service.service';
import { ApiService } from '../../../../services/api.service';
import {
  IProvince,
  IRequestProvinceCreate,
  IResponseProvinceCreate,
} from '../../../../interfaces/province';
import { SaveProvincePopupComponent } from '../save-province-popup/save-province-popup.component';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { TTitlePopup } from '../type';
import { ImportExcelPopup } from '../../../../components/import-excel-popup/import-excel-popup.component';
import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { BreadcrumbComponent } from '../../../../components/breadcrumb/breadcrumb.component';
import { IBaseResponse } from '../../../../interfaces/common';
import { ButtonCommonComponent } from '../../../../component-ui-common/button-common/button-common.component';
import { NzUploadFile } from 'ng-zorro-antd/upload';
import { Checker } from '../../../../helpers/validator/checker';
import { TagStatusComponent } from '../../../../components/tag-status/tag-status.component';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { IconCommonComponent } from '../../../../component-ui-common/icon-common/icon-common.component';
import { SidebarSearchComponent } from '../../../../components/sidebar-search/sidebar-search.component';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
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
    ImportExcelPopup,
    NzPageHeaderModule,
    NzSpaceModule,
    BreadcrumbComponent,
    ButtonCommonComponent,
    TagStatusComponent,
    NzLayoutModule,
    IconCommonComponent,
    SidebarSearchComponent,
    NzFormModule,
    ReactiveFormsModule,
    NzInputModule,
  ],
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
