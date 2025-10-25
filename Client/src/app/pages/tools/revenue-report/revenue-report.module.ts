import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

// Ant Design Modules
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzSpinModule } from 'ng-zorro-antd/spin';

import { RevenueReportComponent } from './revenue-report.component';
import { RevenueReportRoutingModule } from './revenue-report-routing.module';

@NgModule({
  declarations: [RevenueReportComponent],
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    RevenueReportRoutingModule,

    // Ant Design
    NzCardModule,
    NzTableModule,
    NzButtonModule,
    NzInputModule,
    NzSelectModule,
    NzDatePickerModule,
    NzIconModule,
    NzGridModule,
    NzDividerModule,
    NzTagModule,
    NzStatisticModule,
    NzTabsModule,
    NzEmptyModule,
    NzSpinModule,
  ],
})
export class RevenueReportModule {}
