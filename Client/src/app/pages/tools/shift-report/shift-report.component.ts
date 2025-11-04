import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import {
  CreateShiftReportDto,
  ShiftReportListItem,
} from './types/shift-report-type';
// import { ShiftReportMockService } from './services/shift-report-mock.service';
import { ExcelExportService } from './services/excel-report.service';
import { PrintService } from './services/print.service';
import { ShiftReportService } from './services/shift-report.service';
import { format } from 'date-fns';

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
  receiptors = ['Thăng', 'Huy', 'Long'];

  customerTypes = [
    'k.ngày',
    'k.ngày/out',
    'k.đêm',
    'k.đêm/out',
    'k.giờ',
    'k.giờ/out',
  ];
  roomCategories = ['KHÁCH GIỜ', 'KHÁCH ĐÊM', 'KHÁCH NGÀY'];

  constructor(
    private fb: FormBuilder,
    private shiftReportService: ShiftReportService, // Đổi từ ShiftReportService -> ShiftReportMockService
    private excelService: ExcelExportService,
    private printService: PrintService,
    private message: NzMessageService,
    private modal: NzModalService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadReports();
  }

  // Responsive modal properties
  get modalWidth(): string {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width < 576) return '100%'; // Mobile
      if (width < 768) return '95%'; // Small tablet
      if (width < 992) return '90%'; // Tablet
      return '98%'; // Desktop
    }
    return '98%';
  }

  get modalStyle(): any {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width < 576) {
        return { top: '0', height: '100vh', padding: '0' };
      }
      return { top: '5px', height: '95vh' };
    }
    return { top: '5px', height: '95vh' };
  }

  get modalBodyStyle(): any {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width < 576) {
        return {
          'max-height': 'calc(100vh - 110px)',
          'overflow-y': 'auto',
          padding: '16px 12px',
        };
      }
      return {
        'max-height': 'calc(95vh - 110px)',
        'overflow-y': 'auto',
      };
    }
    return { 'max-height': 'calc(95vh - 110px)', 'overflow-y': 'auto' };
  }
  // ====================

  initForm(): void {
    this.reportForm = this.fb.group({
      shiftDate: [new Date(), Validators.required],
      shiftType: ['Ca ngày', Validators.required],
      startTime: [new Date(), Validators.required],
      endTime: [new Date(), Validators.required],
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
      isUseExpenseForReportRevenue: true,
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
      startTime: new Date(),
      endTime: new Date(),
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
        console.log(
          '🚀 ~ ShiftReportComponent ~ showEditModal ~ report:',
          report
        );
        // debugger;
        this.reportForm.patchValue({
          shiftDate: new Date(report.ShiftDate),
          shiftType: report.ShiftType,
          startTime: report.StartTime,
          endTime: report.EndTime,
          receptionistName: report.ReceptionistName,
          receiverName: report.ReceiverName,
        });

        this.transactions.clear();
        report.Transactions.forEach(txn => {
          this.transactions.push(
            this.fb.group({
              orderNumber: [txn.OrderNumber || null],
              roomNumber: [txn.RoomNumber || ''],
              invoiceCode: [txn.InvoiceCode || ''],
              customerType: [txn.CustomerType || ''],
              cashAmount: [txn.CashAmount || null],
              transferAmount: [txn.TransferAmount || null],
              prepaidNote: [txn.PrepaidNote || ''],
              expenseDescription: [txn.ExpenseDescription || ''],
              expenseAmount: [txn.ExpenseAmount || null],
              isUseExpenseForReportRevenue: [txn.IsUseExpenseForReportRevenue],
            })
          );
        });

        this.roomSales.clear();
        report.RoomSales.forEach(sale => {
          this.roomSales.push(
            this.fb.group({
              roomNumber: [sale.RoomNumber || '', Validators.required],
              roomCategory: [
                sale.RoomCategory || 'KHÁCH GIỜ',
                Validators.required,
              ],
              unitPrice: [
                sale.UnitPrice || null,
                [Validators.required, Validators.min(0)],
              ],
            })
          );
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
      // ShiftDate: this.formatDate(formValue.shiftDate),
      ShiftDate: format(formValue.shiftDate, 'yyyy-MM-dd'),
      ShiftType: formValue.shiftType,
      StartTime: formValue.startTime,
      EndTime: formValue.endTime,
      ReceptionistName: formValue.receptionistName,
      ReceiverName: formValue.receiverName,
      Transactions: formValue.transactions.map((i: any) => {
        return {
          CashAmount: i.cashAmount || null,
          CustomerType: i.customerType ?? '', // fix prevent null => error be
          ExpenseAmount: i.expenseAmount,
          ExpenseDescription: i.expenseDescription,
          InvoiceCode: i.invoiceCode,
          OrderNumber: i.orderNumber,
          PrepaidNote: i.prepaidNote,
          RoomNumber: i.roomNumber,
          TransferAmount: i.transferAmount || null,
          IsUseExpenseForReportRevenue: i.isUseExpenseForReportRevenue,
        };
      }),

      RoomSales: formValue.roomSales,
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
    // debugger;

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
        // debugger;

        this.reports = result.Items;
        this.totalRecords = result.TotalCount;
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

  formatter = (value: number): string =>
    value ? value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '';

  parser = (value: string): string =>
    value ? Number(value.toString().replace(/\./g, '')).toString() : '0';

  formatCurrency(value: number): string {
    if (value == null || isNaN(value)) return '0';
    // return (+value.toLocaleString('vi-VN') * 1000).toString();
    return value.toLocaleString('en-Us');
  }
}
