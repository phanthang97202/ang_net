import { Component, inject, OnInit } from '@angular/core';
import { NonNullableFormBuilder } from '@angular/forms';
import { NzMessageService } from 'ng-zorro-antd/message';
import {
  ApiService,
  LoadingService,
  ShowErrorService,
} from '../../../../services';
import {
  IBaseResponse,
  INewsCategoryAdmin,
  IRequestNewsCategoryCreate,
  IResponseNewsCategoryCreate,
} from '../../../../interfaces';
import {
  AntdModule,
  REUSE_COMPONENT_MODULES,
  REUSE_PIPE_MODULE,
} from '../../../../modules';
import { TTitlePopup } from '../type';
import { SaveNewsCategoryPopupComponent } from '../save-news-category-popup/save-news-category-popup.component';

@Component({
  selector: 'app-news-category',
  standalone: true,
  imports: [
    AntdModule,
    ...REUSE_COMPONENT_MODULES,
    ...REUSE_PIPE_MODULE,
    SaveNewsCategoryPopupComponent,
  ],
  templateUrl: './news-category-list.component.html',
  styleUrls: ['./news-category-list.component.scss'],
})
export class NewsCategoryComponent implements OnInit {
  private api = inject(ApiService);
  private showErrorService = inject(ShowErrorService);
  private message = inject(NzMessageService);
  private loadingService = inject(LoadingService);
  private fb = inject(NonNullableFormBuilder);

  dataSource: INewsCategoryAdmin[] = [];
  titlePopup: TTitlePopup = '';
  formDataSource: IRequestNewsCategoryCreate = this.getDefaultFormData();
  _isOpenPopup = false;

  searchForm = this.fb.group({
    Keyword: this.fb.control(''),
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

  /** Tên danh mục cha để hiển thị trong bảng, tra từ chính danh sách đang có */
  parentName(parentId: string): string {
    if (!parentId) {
      return '';
    }
    return (
      this.dataSource.find(x => x.NewsCategoryId === parentId)
        ?.NewsCategoryName || parentId
    );
  }

  handleSearch(): void {
    this.fetchData();
  }

  handleResetSearch(): void {
    this.searchForm.reset({ Keyword: '' });
    this.fetchData();
  }

  handleOpenCreate(): void {
    this._isOpenPopup = true;
    this.titlePopup = 'Create';
    this.formDataSource = this.getDefaultFormData();
  }

  handleDetail(data: INewsCategoryAdmin): void {
    this._isOpenPopup = true;
    this.titlePopup = 'Update';
    this.formDataSource = { ...data };
  }

  handleDelete(data: INewsCategoryAdmin): void {
    this.deleteData(data.NewsCategoryId);
  }

  handleSaveForm(formValue: IRequestNewsCategoryCreate): void {
    if (this.titlePopup === 'Create') {
      this.createData(formValue);
    } else {
      this.updateData(formValue);
    }
  }

  private fetchData(): void {
    const keyword = this.searchForm.getRawValue().Keyword || '';
    this.setLoading(true);
    this.api
      .NewsCategorySearch({ pageIndex: 0, pageSize: 100, keyword })
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

  private createData(formValue: IRequestNewsCategoryCreate): void {
    this.setLoading(true);
    this.api.NewsCategoryCreate(formValue).subscribe({
      next: response =>
        this.handleApiResponse<IResponseNewsCategoryCreate>(
          response,
          'Create successfully'
        ),
      error: err => this.handleApiError(err),
      complete: () => this.setLoading(false),
    });
  }

  private updateData(formValue: IRequestNewsCategoryCreate): void {
    this.setLoading(true);
    this.api.NewsCategoryUpdate(formValue).subscribe({
      next: response =>
        this.handleApiResponse<IResponseNewsCategoryCreate>(
          response,
          'Update successfully'
        ),
      error: err => this.handleApiError(err),
      complete: () => this.setLoading(false),
    });
  }

  private deleteData(newsCategoryId: string): void {
    this.setLoading(true);
    this.api.NewsCategoryDelete(newsCategoryId).subscribe({
      next: response => {
        // Backend trả HTTP 200 kèm Success=false khi danh mục còn bài viết
        if (response?.Success) {
          this.message.success('Delete successfully');
          this.fetchData();
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

  private setLoading(isLoading: boolean): void {
    this.loadingService.setLoading(isLoading);
  }

  private handleApiResponse<T extends IBaseResponse<INewsCategoryAdmin>>(
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

  private handleApiError(err: { message?: string }): void {
    this.setLoading(false);
    this.showErrorService.setShowError({
      icon: 'warning',
      message: JSON.stringify(err, null, 2),
      title: err.message || 'Error',
    });
  }

  private getDefaultFormData(): IRequestNewsCategoryCreate {
    return {
      NewsCategoryId: '',
      NewsCategoryParentId: '',
      NewsCategoryName: '',
      NewsCategoryIndex: 0,
      IsGlobal: false,
      FlagActive: true,
    };
  }
}
