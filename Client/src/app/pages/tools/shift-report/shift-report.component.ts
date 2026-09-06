import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { Subscription } from 'rxjs';
import {
  CreateShiftReportDto,
  ShiftReportListItem,
  ShiftRoomPrice,
} from './types/shift-report-type';
// import { ShiftReportMockService } from './services/shift-report-mock.service';
import { ExcelExportService } from './services/excel-report.service';
import { PrintService } from './services/print.service';
import { ShiftReportService } from './services/shift-report.service';
import { AiAssistantService } from './services/ai-assistant.service';
import {
  AuthService,
  SysParameterConfigService,
  SYS_PARAM_CODE,
} from '../../../services';
import { format, startOfDay, addDays, setHours, startOfMonth } from 'date-fns';

@Component({
  selector: 'app-shift-report',
  templateUrl: './shift-report.component.html',
  styleUrls: ['./shift-report.component.scss'],
})
export class ShiftReportComponent implements OnInit, OnDestroy {
  reportForm!: FormGroup;
  isLoading = false;
  isModalVisible = false;
  modalTitle = 'Tạo báo cáo ca mới';
  editingId: number | null = null;

  isAiAssistantVisible = false;
  isAdmin = false;
  private aiShiftCreatedSub!: Subscription;

  // List view
  reports: ShiftReportListItem[] = [];
  totalRecords = 0;
  pageSize = 10;
  pageIndex = 1;

  // Filter
  searchReceptionist = '';
  searchShiftType = '';
  searchDateRange: Date[] = [
    startOfMonth(new Date()), // ngày đầu tháng
    new Date(), // ngày hiện tại
  ];

  shiftTypes = ['Ca ngày', 'Ca đêm'];
  receiptors = ['Thăng', 'Huy', 'Long', 'Chi', 'Chú Hải', 'Cô Ly', 'Cô Liễu'];

  customerTypes = [
    'k.ngày',
    'k.ngày/out',
    'k.đêm',
    'k.đêm/out',
    'k.giờ',
    'k.giờ/out',
  ];
  roomCategories = ['KHÁCH GIỜ', 'KHÁCH ĐÊM', 'KHÁCH NGÀY'];

  // Bảng giá phòng lấy từ tham số hệ thống SHIFT_ROOM_PRICES, dùng để tự điền
  // đơn giá sang bảng "Bán phòng ngày". Rỗng = chưa cấu hình -> vẫn đổ dòng
  // sang nhưng để trống giá cho người dùng tự nhập.
  private roomPrices: ShiftRoomPrice[] = [];

  constructor(
    private fb: FormBuilder,
    private shiftReportService: ShiftReportService, // Đổi từ ShiftReportService -> ShiftReportMockService
    private excelService: ExcelExportService,
    private printService: PrintService,
    private message: NzMessageService,
    private modal: NzModalService,
    private aiAssistantService: AiAssistantService,
    private authService: AuthService,
    private config: SysParameterConfigService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadReports();
    this.isAdmin = this.authService.isAdminPermission();

    this.aiShiftCreatedSub = this.aiAssistantService.shiftCreated$.subscribe(
      () => this.loadReports()
    );

    this.config
      .getJson<ShiftRoomPrice[]>(SYS_PARAM_CODE.SHIFT_ROOM_PRICES)
      .subscribe(data => {
        this.roomPrices = Array.isArray(data) ? data : [];
      });

    // Gợi ý lại Giờ bắt đầu/kết thúc mỗi khi đổi Loại ca lúc đang TẠO MỚI - chỉ
    // là gợi ý, người dùng vẫn tự sửa lại được sau đó. Không áp dụng lúc SỬA để
    // tránh ghi đè giờ thật đã lưu của báo cáo khi người dùng chỉ đổi Loại ca.
    this.reportForm
      .get('shiftType')
      ?.valueChanges.subscribe((shiftType: string) => {
        if (this.editingId !== null) return;
        const shiftDate = this.reportForm.get('shiftDate')?.value ?? new Date();
        const { start, end } = this.getSuggestedTimeRange(shiftType, shiftDate);
        this.reportForm.patchValue(
          { startTime: start, endTime: end },
          { emitEvent: false }
        );
      });
  }

  // Ca ngày: 07h -> 19h cùng ngày. Ca đêm: 19h ngày đó -> 07h ngày hôm sau.
  private getSuggestedTimeRange(
    shiftType: string,
    baseDate: Date
  ): { start: Date; end: Date } {
    const day = startOfDay(baseDate);
    if (shiftType === 'Ca đêm') {
      return { start: setHours(day, 19), end: setHours(addDays(day, 1), 7) };
    }
    return { start: setHours(day, 7), end: setHours(day, 19) };
  }

  // Gợi ý Loại ca theo giờ thực tại thời điểm mở modal tạo mới: 6h-18h là ca
  // ngày, còn lại là ca đêm.
  private getSuggestedShiftType(): string {
    const hour = new Date().getHours();
    return hour >= 6 && hour < 18 ? 'Ca ngày' : 'Ca đêm';
  }

  ngOnDestroy(): void {
    this.aiShiftCreatedSub?.unsubscribe();
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
    this.syncRoomSalesFromTransactions();
  }

  // ── Tự điền bảng "Bán phòng ngày" từ giao dịch trong ca ────────────────
  // Loại khách kèm "/out" không tính vào bán phòng (theo quy ước nghiệp vụ),
  // nên trả về null để bỏ qua giao dịch đó.
  private mapCustomerTypeToRoomCategory(customerType: string): string | null {
    switch (customerType) {
      case 'k.ngày':
        return 'KHÁCH NGÀY';
      case 'k.đêm':
        return 'KHÁCH ĐÊM';
      case 'k.giờ':
        return 'KHÁCH GIỜ';
      default:
        return null;
    }
  }

  // Giá để trống khi phòng chưa khai báo trong SHIFT_ROOM_PRICES - người dùng
  // tự điền, hơn là âm thầm bỏ sót dòng.
  private lookupUnitPrice(
    roomNumber: string,
    roomCategory: string
  ): number | null {
    const room = this.roomPrices.find(
      r => String(r.roomNumber).trim() === String(roomNumber).trim()
    );
    if (!room) return null;

    switch (roomCategory) {
      case 'KHÁCH NGÀY':
        return room.dayPrice ?? null;
      case 'KHÁCH ĐÊM':
        return room.nightPrice ?? null;
      case 'KHÁCH GIỜ':
        return room.hourPrice ?? null;
      default:
        return null;
    }
  }

  // Dựng lại toàn bộ bảng 2 từ bảng 1. Chạy lại mỗi khi giao dịch đổi số phòng
  // hoặc loại khách, nên đơn giá đã sửa tay ở bảng 2 sẽ bị tính lại theo bảng
  // giá - đánh đổi có chủ ý để hành vi luôn đoán được.
  syncRoomSalesFromTransactions(): void {
    const rows = this.transactions.controls
      .map(ctrl => {
        const { roomNumber, customerType } = ctrl.value;
        const roomCategory = this.mapCustomerTypeToRoomCategory(customerType);
        if (!roomNumber || !roomCategory) return null;
        return {
          roomNumber: String(roomNumber).trim(),
          roomCategory,
          unitPrice: this.lookupUnitPrice(roomNumber, roomCategory),
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);

    this.roomSales.clear();
    rows.forEach(row => {
      this.roomSales.push(
        this.fb.group({
          roomNumber: [row.roomNumber, Validators.required],
          roomCategory: [row.roomCategory, Validators.required],
          unitPrice: [row.unitPrice, [Validators.required, Validators.min(0)]],
        })
      );
    });

    // nz-table xử lý [nzData] bất đồng bộ qua stream nội bộ: ngay sau khi
    // FormArray đổi, nzData đã thấy dòng mới nhưng mảng render của bảng vẫn
    // rỗng nên tbody không hiện gì. Ép Angular chạy thêm 1 vòng phát hiện thay
    // đổi để bảng kịp dựng lại dòng.
    this.cdr.detectChanges();
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

    const today = new Date();
    const suggestedShiftType = this.getSuggestedShiftType();
    const { start, end } = this.getSuggestedTimeRange(suggestedShiftType, today);

    this.reportForm.reset({
      shiftDate: today,
      shiftType: suggestedShiftType,
      startTime: start,
      endTime: end,
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

  showAiAssistant(): void {
    if (!this.isAdmin) {
      this.message.warning('Bạn cần đăng nhập với quyền Admin để dùng trợ lý AI');
      return;
    }
    this.isAiAssistantVisible = true;
  }

  handleAiAssistantCancel(): void {
    this.isAiAssistantVisible = false;
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
      // format() của date-fns lấy theo giờ địa phương. Dùng toISOString() ở đây
      // sẽ quy về UTC, mà nửa đêm giờ VN (GMT+7) là 17:00 hôm trước, nên cả
      // khoảng ngày bị lùi lại 1 ngày.
      params.fromDate = format(this.searchDateRange[0], 'yyyy-MM-dd');
      params.toDate = format(this.searchDateRange[1], 'yyyy-MM-dd');
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
    this.searchDateRange = [
      startOfMonth(new Date()), // ngày đầu tháng
      new Date(), // ngày hiện tại
    ];
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
