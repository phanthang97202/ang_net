import { Component, inject, OnInit } from '@angular/core';
import {
  ShowErrorService,
  LoadingService,
  ApiService,
} from '../../../../services';
import { IDetailNews } from '../../../../interfaces';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NonNullableFormBuilder } from '@angular/forms';
import {
  AntdModule,
  REUSE_COMPONENT_MODULES,
  REUSE_PIPE_MODULE,
} from '../../../../modules';
import { Router } from '@angular/router';
import { NzTableQueryParams } from 'ng-zorro-antd/table';
@Component({
  selector: 'app-blog-list',
  standalone: true,
  imports: [AntdModule, ...REUSE_COMPONENT_MODULES, ...REUSE_PIPE_MODULE],
  templateUrl: './blog-list.component.html',
  styleUrls: ['./blog-list.component.scss'],
})
export class BlogListComponent implements OnInit {
  private api = inject(ApiService);
  private showErrorService = inject(ShowErrorService);
  private router = inject(Router);
  private message = inject(NzMessageService);
  private loadingService = inject(LoadingService);

  dataSource: IDetailNews[] = [];
  pageIndex = 1;
  pageSize = 10;
  total = 0;
  tableLoading = false;

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

  onQueryParamsChange(params: NzTableQueryParams): void {
    this.pageIndex = params.pageIndex;
    this.pageSize = params.pageSize;
    this.fetchData();
  }

  private fetchData(): void {
    this.tableLoading = true;
    this.setLoading(true);
    this.api
      .SearchNews(this.pageIndex - 1, this.pageSize, '', '', '', false)
      .subscribe({
        next: response => {
          if (response?.Success) {
            this.dataSource = response.objResult?.DataList || [];
            this.total = response.objResult?.ItemCount || 0;
          } else {
            this.showErrorService.setShowError({
              icon: 'warning',
              message: JSON.stringify(response, null, 2),
              title: response?.ErrorMessage || 'Error',
            });
          }
        },
        error: err => this.handleApiError(err),
        complete: () => {
          this.tableLoading = false;
          this.setLoading(false);
        },
      });
  }

  handleDetail(data: IDetailNews): void {
    this.router.navigate([`/dashboard/blog/edit`, data.NewsId]);
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

  handleOpenCreate(): void {
    this.router.navigate(['/dashboard/blog/create']);
  }

  handleDelete(data: IDetailNews): void {
    this.deleteData(data.NewsId);
  }

  private setLoading(isLoading: boolean): void {
    this.loadingService.setLoading(isLoading);
  }

  private handleApiError(err: any): void {
    this.tableLoading = false;
    this.setLoading(false);
    this.showErrorService.setShowError({
      icon: 'warning',
      message: JSON.stringify(err, null, 2),
      title: err.message || 'Error',
    });
  }
}
