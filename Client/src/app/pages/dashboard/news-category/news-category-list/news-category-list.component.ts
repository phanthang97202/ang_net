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

/** Một dòng trong bảng cây: danh mục kèm độ sâu để thụt lề và số mục con. */
interface INewsCategoryTreeRow extends INewsCategoryAdmin {
  Depth: number;
  ChildCount: number;
}

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
  /** Dữ liệu hiển thị: con nằm ngay dưới cha thay vì trộn lẫn như danh sách phẳng. */
  treeRows: INewsCategoryTreeRow[] = [];
  titlePopup: TTitlePopup = '';
  formDataSource: IRequestNewsCategoryCreate = this.getDefaultFormData();
  _isOpenPopup = false;

  searchForm = this.fb.group({
    Keyword: this.fb.control(''),
  });

  listButtonsHeader = [
    {
      text: 'Tạo danh mục',
      iconType: 'plus',
      onClick: () => this.handleOpenCreate(),
    },
  ];

  ngOnInit(): void {
    this.fetchData();
  }

  /**
   * Xếp danh sách phẳng thành thứ tự cây: mỗi danh mục đứng ngay sau cha của nó,
   * trong cùng một cấp thì sắp theo NewsCategoryIndex rồi tới tên.
   */
  private buildTreeRows(list: INewsCategoryAdmin[]): INewsCategoryTreeRow[] {
    const ids = new Set(list.map(x => x.NewsCategoryId));
    const childrenOf = new Map<string, INewsCategoryAdmin[]>();

    for (const item of list) {
      // Cha không nằm trong kết quả (ví dụ đang lọc theo từ khóa) hoặc tự trỏ
      // vào chính mình thì coi như danh mục gốc, nếu không nó biến mất khỏi bảng.
      const parentId =
        item.NewsCategoryParentId &&
        item.NewsCategoryParentId !== item.NewsCategoryId &&
        ids.has(item.NewsCategoryParentId)
          ? item.NewsCategoryParentId
          : '';
      const bucket = childrenOf.get(parentId);
      if (bucket) {
        bucket.push(item);
      } else {
        childrenOf.set(parentId, [item]);
      }
    }

    childrenOf.forEach(items =>
      items.sort(
        (a, b) =>
          (a.NewsCategoryIndex || 0) - (b.NewsCategoryIndex || 0) ||
          (a.NewsCategoryName || '').localeCompare(b.NewsCategoryName || '')
      )
    );

    const rows: INewsCategoryTreeRow[] = [];
    const visited = new Set<string>();

    const walk = (parentId: string, depth: number): void => {
      for (const item of childrenOf.get(parentId) || []) {
        if (visited.has(item.NewsCategoryId)) continue;
        visited.add(item.NewsCategoryId);
        const children = childrenOf.get(item.NewsCategoryId) || [];
        rows.push({ ...item, Depth: depth, ChildCount: children.length });
        walk(item.NewsCategoryId, depth + 1);
      }
    };
    walk('', 0);

    // Danh mục rơi vào vòng lặp cha-con vẫn phải hiện ra thì mới sửa được.
    for (const item of list) {
      if (!visited.has(item.NewsCategoryId)) {
        rows.push({ ...item, Depth: 0, ChildCount: 0 });
      }
    }

    return rows;
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
            this.treeRows = this.buildTreeRows(this.dataSource);
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
          this.message.success('Đã xóa danh mục');
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
      NewsCategoryNameEn: '',
      NewsCategoryLogo: '',
      NewsCategoryIndex: 0,
      IsGlobal: false,
      FlagActive: true,
    };
  }
}
