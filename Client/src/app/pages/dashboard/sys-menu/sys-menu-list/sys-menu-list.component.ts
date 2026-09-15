import { Component, inject, OnInit } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import {
  ApiService,
  LoadingService,
  ShowErrorService,
} from '../../../../services';
import { ISysMenuSave, ISysMenuTree } from '../../../../interfaces';
import {
  AntdModule,
  REUSE_COMPONENT_MODULES,
  REUSE_PIPE_MODULE,
} from '../../../../modules';
// AntdModule chỉ có ReactiveFormsModule, và không export NzEmpty. Bảng này dùng
// [ngModel] cho switch bật/tắt (không nằm trong form nào) nên cần FormsModule.
import { FormsModule } from '@angular/forms';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { SaveSysMenuPopupComponent } from '../save-sys-menu-popup/save-sys-menu-popup.component';

/** Một dòng trong bảng phẳng, kèm cấp để thụt lề. */
interface MenuRow extends ISysMenuTree {
  level: number;
  parentId: string;
}

@Component({
  selector: 'app-sys-menu',
  standalone: true,
  imports: [
    AntdModule,
    ...REUSE_COMPONENT_MODULES,
    ...REUSE_PIPE_MODULE,
    FormsModule,
    NzEmptyModule,
    SaveSysMenuPopupComponent,
  ],
  templateUrl: './sys-menu-list.component.html',
  styleUrls: ['./sys-menu-list.component.scss'],
})
export class SysMenuComponent implements OnInit {
  private api = inject(ApiService);
  private showErrorService = inject(ShowErrorService);
  private message = inject(NzMessageService);
  private loadingService = inject(LoadingService);

  // Cây gốc giữ nguyên để popup dựng danh sách menu cha; bảng thì vẽ từ dạng phẳng.
  tree: ISysMenuTree[] = [];
  rows: MenuRow[] = [];

  titlePopup: 'Create' | 'Update' = 'Create';
  formDataSource: ISysMenuSave = this.getDefaultFormData();
  _isOpenPopup = false;

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

  /** Menu cấp 1 - chỉ những mục này được làm cha (navbar chỉ vẽ 2 cấp). */
  get parentOptions(): ISysMenuTree[] {
    return this.tree;
  }

  handleOpenCreate(): void {
    this._isOpenPopup = true;
    this.titlePopup = 'Create';
    this.formDataSource = this.getDefaultFormData();
  }

  handleDetail(row: MenuRow): void {
    this._isOpenPopup = true;
    this.titlePopup = 'Update';
    this.formDataSource = {
      MenuId: row.MenuId,
      ParentId: row.parentId,
      TitleVi: row.TitleVi,
      TitleEn: row.TitleEn,
      Path: row.Path,
      Icon: row.Icon,
      SortOrder: row.SortOrder,
      FlagActive: row.FlagActive,
    };
  }

  handleSaveForm(formValue: ISysMenuSave): void {
    if (this.titlePopup === 'Create') {
      this.createData(formValue);
    } else {
      this.updateData(formValue);
    }
  }

  handleToggleActive(row: MenuRow, flagActive: boolean): void {
    this.setLoading(true);
    this.api.SysMenuToggleActive(row.MenuId, flagActive).subscribe({
      next: response => {
        if (response?.Success) {
          this.message.success(flagActive ? 'Đã bật menu' : 'Đã tắt menu');
          this.fetchData();
        } else {
          this.handleApiFail(response);
          // Gọi lại để trả switch về đúng trạng thái thật dưới DB.
          this.fetchData();
        }
      },
      error: err => this.handleApiError(err),
      complete: () => this.setLoading(false),
    });
  }

  handleDelete(row: MenuRow): void {
    this.setLoading(true);
    this.api.SysMenuDelete(row.MenuId).subscribe({
      next: response => {
        if (response?.Success) {
          this.message.success('Delete successfully');
          this.fetchData();
        } else {
          this.handleApiFail(response);
        }
      },
      error: err => this.handleApiError(err),
      complete: () => this.setLoading(false),
    });
  }

  /** Số menu con, để cảnh báo trước khi xóa menu cha (backend xóa cascade). */
  childCountOf(row: MenuRow): number {
    if (row.level > 0) return 0;
    return this.tree.find(m => m.MenuId === row.MenuId)?.Children.length || 0;
  }

  private fetchData(): void {
    this.setLoading(true);
    this.api.SysMenuGetAll().subscribe({
      next: response => {
        if (response?.Success) {
          this.tree = response.DataList || [];
          this.rows = this.flatten(this.tree);
        } else {
          this.handleApiFail(response);
        }
      },
      error: err => this.handleApiError(err),
      complete: () => this.setLoading(false),
    });
  }

  // Bảng phẳng thay vì bảng cây của ng-zorro: menu chỉ 2 cấp nên thụt lề một
  // bậc là đủ, mà lại giữ được một hàng nút thao tác thống nhất cho mọi dòng.
  private flatten(tree: ISysMenuTree[]): MenuRow[] {
    const rows: MenuRow[] = [];
    for (const parent of tree) {
      rows.push({ ...parent, level: 0, parentId: '' });
      for (const child of parent.Children || []) {
        rows.push({ ...child, level: 1, parentId: parent.MenuId });
      }
    }
    return rows;
  }

  private createData(formValue: ISysMenuSave): void {
    this.setLoading(true);
    this.api.SysMenuCreate(formValue).subscribe({
      next: response => this.handleSaveResponse(response, 'Create successfully'),
      error: err => this.handleApiError(err),
      complete: () => this.setLoading(false),
    });
  }

  private updateData(formValue: ISysMenuSave): void {
    this.setLoading(true);
    this.api.SysMenuUpdate(formValue).subscribe({
      next: response => this.handleSaveResponse(response, 'Update successfully'),
      error: err => this.handleApiError(err),
      complete: () => this.setLoading(false),
    });
  }

  private handleSaveResponse(
    response: { Success?: boolean; ErrorMessage?: string },
    successMessage: string
  ): void {
    if (response?.Success) {
      this.message.success(successMessage);
      this._isOpenPopup = false;
      this.fetchData();
    } else {
      this.handleApiFail(response);
    }
  }

  private handleApiFail(response: {
    Success?: boolean;
    ErrorMessage?: string;
  }): void {
    this.showErrorService.setShowError({
      icon: 'warning',
      message: JSON.stringify(response, null, 2),
      title: response?.ErrorMessage || 'Error',
    });
  }

  private setLoading(isLoading: boolean): void {
    this.loadingService.setLoading(isLoading);
  }

  private handleApiError(err: { message?: string }): void {
    this.setLoading(false);
    this.showErrorService.setShowError({
      icon: 'warning',
      message: JSON.stringify(err, null, 2),
      title: err.message || 'Error',
    });
  }

  private getDefaultFormData(): ISysMenuSave {
    return {
      MenuId: '',
      ParentId: '',
      TitleVi: '',
      TitleEn: '',
      Path: '',
      Icon: '',
      SortOrder: 0,
      FlagActive: true,
    };
  }
}
