import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzTableModule } from 'ng-zorro-antd/table';
import { AuthService } from '../../../../services/auth.service';
import { ShowErrorService } from '../../../../services/show-error.service';
import { LoadingService } from '../../../../services/loading-service.service';
import { delay } from 'rxjs';
import { ApiService } from '../../../../services/api.service';
import { IProvince } from '../../../../interfaces/province';
import { SaveProvincePopupComponent } from '../save-province-popup/save-province-popup.component';
import { NzButtonModule } from 'ng-zorro-antd/button';

@Component({
  selector: 'app-mst-province',
  standalone: true,
  imports: [
    NzTableModule,
    NzBreadCrumbModule,
    CommonModule,
    SaveProvincePopupComponent,
    NzButtonModule,
  ],
  templateUrl: './mst-province-list.component.html',
  styleUrl: './mst-province-list.component.scss',
})
export class MstProvinceComponent {
  api = inject(ApiService);
  showErrorService = inject(ShowErrorService);
  loadingService = inject(LoadingService);
  dataSource: IProvince[] = [];

  titlePopup: string = '';
  formDataSource: Partial<IProvince> = {
    ProvinceCode: '',
    ProvinceName: '',
    FlagActive: true,
  };

  ngOnInit() {
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
}
