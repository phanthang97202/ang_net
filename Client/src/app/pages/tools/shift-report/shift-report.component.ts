import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import {
  CreateShiftReportDto,
  ShiftReportListItem,
} from './types/shift-report-type';
import { ShiftReportMockService } from './services/shift-report-mock.service';
import { ExcelExportService } from './services/excel-report.service';
import { PrintService } from './services/print.service';

@Component({
  selector: 'app-shift-report',
  templateUrl: './shift-report.component.html',
  styleUrls: ['./shift-report.component.scss'],
})
export class ShiftReportComponent implements OnInit {
  reportForm!: FormGroup;
  isLoading = false;
  isModalVisible = false;
  modalTitle = 'Tạo báo cáo ca mới';
  editingId: number | null = null;

  // List view
  reports: ShiftReportListItem[] = [];
  totalRecords = 0;
  pageSize = 10;
  pageIndex = 1;

  // Filter
  searchReceptionist = '';
  searchShiftType = '';
  searchDateRange: Date[] = [];

  shiftTypes = ['Ca ngày', 'Ca đêm'];
  customerTypes = ['k.ngày', 'k.đêm', 'k.ngày/out', 'k.giờ'];
  roomCategories = ['KHÁCH GIỜ', 'KHÁCH ĐÊM', 'KHÁCH NGÀY'];

  constructor(
    private fb: FormBuilder,
    private shiftReportService: ShiftReportMockService, // Đổi từ ShiftReportService -> ShiftReportMockService
    private excelService: ExcelExportService,
    private printService: PrintService,
    private message: NzMessageService,
    private modal: NzModalService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadReports();
  }

  initForm(): void {
    this.reportForm = this.fb.group({
      shiftDate: [new Date(), Validators.required],
      shiftType: ['Ca ngày', Validators.required],
      startTime: ['07:00', Validators.required],
      endTime: ['19:00', Validators.required],
      receptionistName: ['', Validators.required],
      receiverName: [''],
      transactions: this.fb.array([]),
      roomSales: this.fb.array([]),
    });
  }

  get transactions(): FormArray {
    return this.reportForm.get('transactions') as FormArray;
  }

  get roomSales(): FormArray {
    return this.reportForm.get('roomSales') as FormArray;
  }

  createTransactionForm(): FormGroup {
    return this.fb.group({
      orderNumber: [this.transactions.length + 1],
      roomNumber: [''],
      invoiceCode: [''],
      customerType: [''],
      cashAmount: [null],
      transferAmount: [null],
      prepaidNote: [''],
      expenseDescription: [''],
      expenseAmount: [null],
    });
  }

  createRoomSaleForm(): FormGroup {
    return this.fb.group({
      roomNumber: ['', Validators.required],
      roomCategory: ['KHÁCH GIỜ', Validators.required],
      unitPrice: [null, [Validators.required, Validators.min(0)]],
    });
  }

  addTransaction(): void {
    this.transactions.push(this.createTransactionForm());
  }

  removeTransaction(index: number): void {
    this.transactions.removeAt(index);
    // Update order numbers
    this.transactions.controls.forEach((control, i) => {
      control.patchValue({ orderNumber: i + 1 });
    });
  }

  addRoomSale(): void {
    this.roomSales.push(this.createRoomSaleForm());
  }

  removeRoomSale(index: number): void {
    this.roomSales.removeAt(index);
  }

  calculateTotals(): {
    totalCash: number;
    totalTransfer: number;
    totalExpense: number;
    handoverAmount: number;
  } {
    const totalCash = this.transactions.controls.reduce((sum, ctrl) => {
      return sum + (ctrl.value.cashAmount || 0);
    }, 0);

    const totalTransfer = this.transactions.controls.reduce((sum, ctrl) => {
      return sum + (ctrl.value.transferAmount || 0);
    }, 0);

    const totalExpense = this.transactions.controls.reduce((sum, ctrl) => {
      return sum + (ctrl.value.expenseAmount || 0);
    }, 0);

    const handoverAmount = totalCash - totalExpense;

    return { totalCash, totalTransfer, totalExpense, handoverAmount };
  }

  showCreateModal(): void {
    this.modalTitle = 'Tạo báo cáo ca mới';
    this.editingId = null;
    this.reportForm.reset({
      shiftDate: new Date(),
      shiftType: 'Ca ngày',
      startTime: '07:00',
      endTime: '19:00',
      receptionistName: '',
      receiverName: '',
    });
    this.transactions.clear();
    this.roomSales.clear();
    this.addTransaction();
    this.isModalVisible = true;
  }

  showEditModal(id: number): void {
    this.modalTitle = 'Chỉnh sửa báo cáo ca';
    this.editingId = id;
    this.isLoading = true;

    this.shiftReportService.getById(id).subscribe({
      next: report => {
        this.reportForm.patchValue({
          shiftDate: new Date(report.shiftDate),
          shiftType: report.shiftType,
          startTime: report.startTime,
          endTime: report.endTime,
          receptionistName: report.receptionistName,
          receiverName: report.receiverName,
        });

        this.transactions.clear();
        report.transactions.forEach(txn => {
          this.transactions.push(this.fb.group(txn));
        });

        this.roomSales.clear();
        report.roomSales.forEach(sale => {
          this.roomSales.push(this.fb.group(sale));
        });

        this.isLoading = false;
        this.isModalVisible = true;
      },
      error: error => {
        this.message.error('Không thể tải dữ liệu báo cáo');
        this.isLoading = false;
        console.error(error);
      },
    });
  }

  handleCancel(): void {
    this.isModalVisible = false;
  }

  handleSubmit(): void {
    if (this.reportForm.invalid) {
      Object.values(this.reportForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      this.message.warning('Vui lòng điền đầy đủ thông tin');
      return;
    }

    this.isLoading = true;
    const formValue = this.reportForm.value;

    const dto: CreateShiftReportDto = {
      shiftDate: this.formatDate(formValue.shiftDate),
      shiftType: formValue.shiftType,
      startTime: formValue.startTime,
      endTime: formValue.endTime,
      receptionistName: formValue.receptionistName,
      receiverName: formValue.receiverName,
      transactions: formValue.transactions,
      roomSales: formValue.roomSales,
    };

    const request = this.editingId
      ? this.shiftReportService.update(this.editingId, dto)
      : this.shiftReportService.create(dto);

    request.subscribe({
      next: () => {
        this.message.success(
          this.editingId ? 'Cập nhật thành công' : 'Tạo mới thành công'
        );
        this.isModalVisible = false;
        this.isLoading = false;
        this.loadReports();
      },
      error: error => {
        this.message.error('Có lỗi xảy ra');
        this.isLoading = false;
        console.error(error);
      },
    });
  }

  loadReports(): void {
    this.isLoading = true;

    const params: any = {
      pageNumber: this.pageIndex,
      pageSize: this.pageSize,
    };

    if (this.searchReceptionist) {
      params.receptionistName = this.searchReceptionist;
    }

    if (this.searchShiftType) {
      params.shiftType = this.searchShiftType;
    }

    if (this.searchDateRange && this.searchDateRange.length === 2) {
      params.fromDate = this.formatDate(this.searchDateRange[0]);
      params.toDate = this.formatDate(this.searchDateRange[1]);
    }

    this.shiftReportService.getAll(params).subscribe({
      next: result => {
        this.reports = result.items;
        this.totalRecords = result.totalCount;
        this.isLoading = false;
      },
      error: error => {
        this.message.error('Không thể tải danh sách báo cáo');
        this.isLoading = false;
        console.error(error);
      },
    });
  }

  onPageChange(page: number): void {
    this.pageIndex = page;
    this.loadReports();
  }

  onSearch(): void {
    this.pageIndex = 1;
    this.loadReports();
  }

  resetSearch(): void {
    this.searchReceptionist = '';
    this.searchShiftType = '';
    this.searchDateRange = [];
    this.pageIndex = 1;
    this.loadReports();
  }

  exportToExcel(id: number): void {
    this.isLoading = true;
    this.shiftReportService.getById(id).subscribe({
      next: report => {
        this.excelService.exportShiftReport(report);
        this.message.success('Xuất Excel thành công');
        this.isLoading = false;
      },
      error: error => {
        this.message.error('Không thể xuất Excel');
        this.isLoading = false;
        console.error(error);
      },
    });
  }

  printReport(id: number): void {
    this.isLoading = true;
    this.shiftReportService.getById(id).subscribe({
      next: report => {
        this.printService.printShiftReport(report);
        this.message.success('Đang mở cửa sổ in...');
        this.isLoading = false;
      },
      error: error => {
        this.message.error('Không thể in báo cáo');
        this.isLoading = false;
        console.error(error);
      },
    });
  }

  deleteReport(id: number): void {
    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: 'Bạn có chắc chắn muốn xóa báo cáo này?',
      nzOkText: 'Xóa',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.shiftReportService.delete(id).subscribe({
          next: () => {
            this.message.success('Xóa thành công');
            this.loadReports();
          },
          error: error => {
            this.message.error('Không thể xóa báo cáo');
            console.error(error);
          },
        });
      },
    });
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
