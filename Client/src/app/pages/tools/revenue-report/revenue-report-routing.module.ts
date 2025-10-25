import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RevenueReportComponent } from './revenue-report.component';

const routes: Routes = [
  {
    path: '',
    component: RevenueReportComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RevenueReportRoutingModule {}
