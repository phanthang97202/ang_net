import { Component, inject, OnInit } from '@angular/core';
import {
  ShowErrorService,
  LoadingService,
  ApiService,
} from '../../../../services';
import {
  ISysParameter,
  IRequestSysParameterCreate,
  IResponseSysParameterCreate,
  IBaseResponse,
} from '../../../../interfaces';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NonNullableFormBuilder } from '@angular/forms';
import { TTitlePopup } from '../type';
import {
  AntdModule,
  REUSE_COMPONENT_MODULES,
  REUSE_PIPE_MODULE,
} from '../../../../modules';
import { SaveSysParameterPopupComponent } from '../save-sys-parameter-popup/save-sys-parameter-popup.component';

@Component({
  selector: 'app-sys-parameter',
  standalone: true,
  imports: [
    AntdModule,
    ...REUSE_COMPONENT_MODULES,
    ...REUSE_PIPE_MODULE,
    SaveSysParameterPopupComponent,
  ],
  templateUrl: './sys-parameter-list.component.html',
  styleUrls: ['./sys-parameter-list.component.scss'],
})
export class SysParameterComponent implements OnInit {
  private api = inject(ApiService);
  private showErrorService = inject(ShowErrorService);
  private message = inject(NzMessageService);
  private loadingService = inject(LoadingService);
  private fb = inject(NonNullableFormBuilder);

  dataSource: ISysParameter[] = [];
  categoryOptions: string[] = [];
  titlePopup: TTitlePopup = '';
  formDataSource: IRequestSysParameterCreate = this.getDefaultFormData();
  _isOpenPopup = false;

  searchForm = this.fb.group({
    Keyword: this.fb.control(''),
    Category: this.fb.control(''),
  });

  listButtonsHeader = [
    {
      text: 'Create',
      iconType: 'plus',
      onClick: () => this.handleOpenCreate(),
    },
  ];

  ngOnInit(): void {
    this.fetchData();
  }

  private fetchData(): void {
    const raw = this.searchForm.getRawValue();
    // nz-select nzAllowClear có thể set null -> ép về '' để không gửi "null"
    const keyword = raw.Keyword || '';
    const category = raw.Category || '';
    this.setLoading(true);
    this.api
      .SysParameterSearch({
        pageIndex: 0,
        pageSize: 100,
        keyword,
        category,
      })
      .subscribe({
        next: response => {
          if (response?.Success) {
            this.dataSource = response.objResult?.DataList || [];
            // Chỉ dựng lại danh sách category từ lần tải không lọc, để bộ lọc
            // giữ đủ lựa chọn kể cả khi đang lọc theo một category.
            if (!category) {
              this.categoryOptions = Array.from(
                new Set(this.dataSource.map(x => x.Category).filter(Boolean))
              ).sort();
            }
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

  private createData(formValue: IRequestSysParameterCreate): void {
    this.setLoading(true);
    this.api.SysParameterCreate(formValue).subscribe({
      next: response =>
        this.handleApiResponse<IResponseSysParameterCreate>(
          response,
          'Create successfully'
        ),
      error: err => this.handleApiError(err),
      complete: () => this.setLoading(false),
    });
  }

  private updateData(formValue: IRequestSysParameterCreate): void {
    this.setLoading(true);
    this.api.SysParameterUpdate(formValue).subscribe({
      next: response =>
        this.handleApiResponse<IResponseSysParameterCreate>(
          response,
          'Update successfully'
        ),
      error: err => this.handleApiError(err),
      complete: () => this.setLoading(false),
    });
  }

  private deleteData(key: string): void {
    this.setLoading(true);
    this.api.SysParameterDelete(key).subscribe({
      next: () => {
        this.message.success('Delete successfully');
        this.fetchData();
      },
      error: err => this.handleApiError(err),
      complete: () => this.setLoading(false),
    });
  }

  handleSearch(): void {
    this.fetchData();
  }

  handleResetSearch(): void {
    this.searchForm.reset({ Keyword: '', Category: '' });
    this.fetchData();
  }

  handleOpenCreate(): void {
    this._isOpenPopup = true;
    this.titlePopup = 'Create';
    this.formDataSource = this.getDefaultFormData();
  }

  handleDetail(data: ISysParameter): void {
    this._isOpenPopup = true;
    this.titlePopup = 'Update';
    this.formDataSource = { ...data };
  }

  handleDelete(data: ISysParameter): void {
    this.deleteData(data.ParameterCode);
  }

  handleSaveForm(formValue: IRequestSysParameterCreate): void {
    if (this.titlePopup === 'Create') {
      this.createData(formValue);
    } else {
      this.updateData(formValue);
    }
  }

  private setLoading(isLoading: boolean): void {
    this.loadingService.setLoading(isLoading);
  }

  private handleApiResponse<T extends IBaseResponse<ISysParameter>>(
    response: T,
    successMessage: string
  ) {
    if (response?.Success) {
      this.message.success(successMessage);
      this._isOpenPopup = false;
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

  private getDefaultFormData(): IRequestSysParameterCreate {
    return {
      ParameterCode: '',
      ParameterNameVi: '',
      ParameterNameEn: '',
      ParameterValueVi: '',
      ParameterValueEn: '',
      DefaultValueVi: '',
      DefaultValueEn: '',
      DataType: 'string',
      Category: '',
      DescriptionVi: '',
      DescriptionEn: '',
      SortOrder: 0,
      FlagActive: true,
    };
  }
}
