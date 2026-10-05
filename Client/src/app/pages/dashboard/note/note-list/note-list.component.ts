import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, NonNullableFormBuilder } from '@angular/forms';
import { NzMessageService } from 'ng-zorro-antd/message';
import { INote } from '../../../../interfaces';
import {
  ApiService,
  AuthService,
  ShowErrorService,
} from '../../../../services';
import {
  AntdModule,
  REUSE_COMPONENT_MODULES,
  REUSE_PIPE_MODULE,
} from '../../../../modules';

type TStatusFilter = '' | 'active' | 'inactive';
type NoteRow = INote & { Preview: string };

@Component({
  selector: 'app-note-list',
  standalone: true,
  imports: [
    AntdModule,
    FormsModule,
    ...REUSE_COMPONENT_MODULES,
    ...REUSE_PIPE_MODULE,
  ],
  templateUrl: './note-list.component.html',
  styleUrl: './note-list.component.scss',
})
export class NoteListComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly authService = inject(AuthService);
  private readonly showErrorService = inject(ShowErrorService);
  private readonly message = inject(NzMessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(NonNullableFormBuilder);

  dataSource: NoteRow[] = [];
  isLoading = false;
  pageIndex = 1;
  pageSize = 20;
  itemCount = 0;

  readonly canUpdate = this.authService.hasPermission('blog.update');
  readonly canDelete = this.authService.hasPermission('blog.delete');

  readonly searchForm = this.fb.group({
    Keyword: this.fb.control(''),
    Status: this.fb.control<TStatusFilter>(''),
  });

  ngOnInit(): void {
    this.fetchData();
  }

  handleSearch(): void {
    this.pageIndex = 1;
    this.fetchData();
  }

  handleResetSearch(): void {
    this.searchForm.reset({ Keyword: '', Status: '' });
    this.pageIndex = 1;
    this.fetchData();
  }

  onPageIndexChange(index: number): void {
    this.pageIndex = index;
    this.fetchData();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.pageIndex = 1;
    this.fetchData();
  }

  handleToggleActive(note: NoteRow, flagActive: boolean): void {
    this.isLoading = true;
    this.api
      .NoteToggleActive(note.NoteId, flagActive)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          if (response?.Success) {
            this.message.success(
              flagActive ? 'Đã hiển thị ghi chú.' : 'Đã ẩn ghi chú.'
            );
          } else {
            this.message.error(
              response?.ErrorMessage || 'Không thể đổi trạng thái ghi chú.'
            );
          }
          this.fetchData();
        },
        error: error => this.handleError(error),
      });
  }

  handleDelete(note: NoteRow): void {
    this.isLoading = true;
    this.api
      .NoteDelete(note.NoteId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          if (!response?.Success) {
            this.message.error(
              response?.ErrorMessage || 'Không thể xóa ghi chú.'
            );
            this.fetchData();
            return;
          }

          this.message.success('Đã xóa ghi chú.');
          if (this.dataSource.length === 1 && this.pageIndex > 1) {
            this.pageIndex -= 1;
          }
          this.fetchData();
        },
        error: error => this.handleError(error),
      });
  }

  private fetchData(): void {
    const { Keyword, Status } = this.searchForm.getRawValue();
    const onlyActive =
      Status === '' ? undefined : Status === 'active' ? true : false;

    this.isLoading = true;
    this.api
      .NoteAdminSearch(
        this.pageIndex - 1,
        this.pageSize,
        Keyword,
        onlyActive
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          this.isLoading = false;
          if (!response?.Success) {
            this.message.error(
              response?.ErrorMessage || 'Không thể tải danh sách ghi chú.'
            );
            return;
          }

          this.dataSource = (response.objResult?.DataList || []).map(note => ({
            ...note,
            Preview: this.plainText(note.ContentBody),
          }));
          this.itemCount = response.objResult?.ItemCount || 0;
        },
        error: error => this.handleError(error),
      });
  }

  private plainText(html: string): string {
    const element = document.createElement('div');
    element.innerHTML = html || '';
    return (element.textContent || '').replace(/\s+/g, ' ').trim();
  }

  private handleError(error: unknown): void {
    this.isLoading = false;
    const title =
      error && typeof error === 'object' && 'message' in error
        ? String(error.message)
        : 'Error';
    this.showErrorService.setShowError({
      icon: 'warning',
      message: JSON.stringify(error, null, 2),
      title,
    });
  }
}
