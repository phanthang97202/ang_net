import { Component, inject, OnInit } from '@angular/core';
import {
  ShowErrorService,
  LoadingService,
  ApiService,
} from '../../../../services';
import { IAuditTrail } from '../../../../interfaces';
import {
  AntdModule,
  REUSE_COMPONENT_MODULES,
  REUSE_PIPE_MODULE,
} from '../../../../modules';
import { TagStatusComponent } from '../../../../components';
@Component({
  selector: 'app-mst-province',
  standalone: true,
  imports: [
    AntdModule,
    ...REUSE_COMPONENT_MODULES,
    ...REUSE_PIPE_MODULE,
    TagStatusComponent,
  ],
  templateUrl: './audit-trail-list.component.html',
  // styleUrls: ['./audit-trail-list.component.scss'],
})
export class AuditTrailComponent implements OnInit {
  private api = inject(ApiService);
  private showErrorService = inject(ShowErrorService);
  private loadingService = inject(LoadingService);

  dataSource: IAuditTrail[] = [];

  ngOnInit(): void {
    this.fetchData();
  }

  private fetchData(): void {
    this.setLoading(true);
    this.api.GetAllActiveAuditTrail().subscribe({
      next: response => {
        if (response?.Success) {
          const dtList = response.DataList;
          this.dataSource = dtList || [];
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

  private handleApiError(err: any): void {
    this.setLoading(false);
    this.showErrorService.setShowError({
      icon: 'warning',
      message: JSON.stringify(err, null, 2),
      title: err.message || 'Error',
    });
  }
}
