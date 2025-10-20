import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ShiftReportComponent } from './shift-report.component';

const routes: Routes = [
  {
    path: '',
    component: ShiftReportComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ShiftReportRoutingModule {}
