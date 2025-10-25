import { Component, OnInit } from '@angular/core';
import {
  RevenueReportQueryParams,
  RevenueReportResponse,
} from './types/revenue-report-type';
import { RevenueReportService } from './services/revenue-report.service';

@Component({
  selector: 'app-revenue-report',
  templateUrl: './revenue-report.component.html',
  styleUrls: ['./revenue-report.component.scss'],
})
export class RevenueReportComponent implements OnInit {
  isLoading = false;
  reportData: RevenueReportResponse | null = null;

  // Filters
  filterDateRange: Date[] = [];
  filterReceptionist = '';
  filterShiftType = '';
  filterRoomNumber = '';

  shiftTypes = ['Ca ngày', 'Ca đêm'];

  // Chart options
  chartViewDate: [number, number] = [800, 400];
  chartViewShiftType: [number, number] = [400, 300];
  chartViewReceptionist: [number, number] = [600, 400];

  constructor(private revenueReportService: RevenueReportService) {}

  ngOnInit(): void {
    // Load report with default: current month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    this.filterDateRange = [firstDay, lastDay];

    this.loadReport();
  }

  loadReport(): void {
    this.isLoading = true;

    const params: RevenueReportQueryParams = {};

    if (this.filterDateRange && this.filterDateRange.length === 2) {
      params.fromDate = this.formatDate(this.filterDateRange[0]);
      params.toDate = this.formatDate(this.filterDateRange[1]);
    }

    if (this.filterReceptionist) {
      params.receptionistName = this.filterReceptionist;
    }

    if (this.filterShiftType) {
      params.shiftType = this.filterShiftType;
    }

    if (this.filterRoomNumber) {
      params.roomNumber = this.filterRoomNumber;
    }

    this.revenueReportService.getRevenueReport(params).subscribe({
      next: data => {
        this.reportData = data;
        this.isLoading = false;
      },
      error: error => {
        console.error('Error loading revenue report:', error);
        this.isLoading = false;
      },
    });
  }

  resetFilters(): void {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    this.filterDateRange = [firstDay, lastDay];
    this.filterReceptionist = '';
    this.filterShiftType = '';
    this.filterRoomNumber = '';
    this.loadReport();
  }

  // Chart data for revenue by date
  get chartDataByDate(): any[] {
    if (!this.reportData?.revenueByDate) return [];

    return this.reportData.revenueByDate.map(item => ({
      name: this.formatDateDisplay(item.date),
      series: [
        { name: 'Tiền mặt', value: item.totalCash },
        { name: 'Chuyển khoản', value: item.totalTransfer },
        { name: 'Chi tiêu', value: item.totalExpense },
      ],
    }));
  }

  // Chart data for revenue by shift type
  get chartDataByShiftType(): any[] {
    if (!this.reportData?.revenueByShiftType) return [];

    return this.reportData.revenueByShiftType.map(item => ({
      name: item.shiftType,
      value: item.totalRevenue,
    }));
  }

  // Chart data for revenue by receptionist
  get chartDataByReceptionist(): any[] {
    if (!this.reportData?.revenueByReceptionist) return [];

    return this.reportData.revenueByReceptionist.map(item => ({
      name: item.receptionistName,
      value: item.totalRevenue,
    }));
  }

  exportToExcel(): void {
    // TODO: Implement Excel export for revenue report
    console.log('Export revenue report to Excel');
  }

  printReport(): void {
    window.print();
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private formatDateDisplay(dateStr: string): string {
    const date = new Date(dateStr);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
  }
}
