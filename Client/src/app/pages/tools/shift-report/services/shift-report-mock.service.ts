import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import {
  ShiftReportResponse,
  ShiftReportListItem,
  PagedResult,
  ShiftReportQueryParams,
  CreateShiftReportDto,
} from './../types/shift-report-type';
import { format, parseISO } from 'date-fns';

@Injectable({
  providedIn: 'root',
})
export class ShiftReportMockService {
  private mockReports: ShiftReportResponse[] = [
    {
      Id: 1,
      ShiftDate: '2025-10-18',
      ShiftType: 'Ca ngày',
      // StartTime: '07:00:00',
      StartTime: parseISO('2025-10-18T07:00:00').toString(),
      EndTime: parseISO('2025-11-18T19:00:00').toString(),
      ReceptionistName: 'Huy',
      TotalCash: 5577000,
      TotalTransfer: 3980000,
      TotalExpense: 4000000,
      HandoverAmount: 1577000,
      ReceiverName: 'Minh',
      CreatedAt: '2025-10-18T19:05:00',
      Transactions: [
        {
          Id: 1,
          OrderNumber: 1,
          RoomNumber: '',
          InvoiceCode: '',
          CustomerType: '',
          CashAmount: 2000000,
          TransferAmount: undefined,
          PrepaidNote: 'khách đối tiền mặt, đã ck 2tr',
          ExpenseDescription: '',
          ExpenseAmount: undefined,
        },
        {
          Id: 2,
          OrderNumber: 2,
          RoomNumber: '201',
          InvoiceCode: '6786',
          CustomerType: 'k.ngày/out',
          CashAmount: undefined,
          TransferAmount: 800000,
          PrepaidNote: '',
          ExpenseDescription: 'chú hải cảm 2tr',
          ExpenseAmount: 2000000,
        },
        {
          Id: 3,
          OrderNumber: 3,
          RoomNumber: '502',
          InvoiceCode: '6791',
          CustomerType: 'k.ngày/out',
          CashAmount: undefined,
          TransferAmount: undefined,
          PrepaidNote: 'đtt ca trước',
          ExpenseDescription: '',
          ExpenseAmount: undefined,
        },
        {
          Id: 4,
          OrderNumber: 4,
          RoomNumber: '302',
          InvoiceCode: '6797',
          CustomerType: 'k.đêm/out',
          CashAmount: undefined,
          TransferAmount: undefined,
          PrepaidNote: 'đtt ca trước',
          ExpenseDescription: '',
          ExpenseAmount: undefined,
        },
        {
          Id: 5,
          OrderNumber: 5,
          RoomNumber: '503',
          InvoiceCode: '6802',
          CustomerType: 'k.ngày',
          CashAmount: 590000,
          TransferAmount: undefined,
          PrepaidNote: '',
          ExpenseDescription: '',
          ExpenseAmount: undefined,
        },
        {
          Id: 6,
          OrderNumber: 6,
          RoomNumber: '502',
          InvoiceCode: '6803',
          CustomerType: 'k.ngày',
          CashAmount: 590000,
          TransferAmount: undefined,
          PrepaidNote: '',
          ExpenseDescription: '',
          ExpenseAmount: undefined,
        },
        {
          Id: 7,
          OrderNumber: 7,
          RoomNumber: '603',
          InvoiceCode: '6805',
          CustomerType: 'k.ngày',
          CashAmount: undefined,
          TransferAmount: 590000,
          PrepaidNote: '',
          ExpenseDescription: '',
          ExpenseAmount: undefined,
        },
        {
          Id: 8,
          OrderNumber: 8,
          RoomNumber: '703',
          InvoiceCode: '6804',
          CustomerType: 'k.ngày',
          CashAmount: undefined,
          TransferAmount: 590000,
          PrepaidNote: '',
          ExpenseDescription: '',
          ExpenseAmount: undefined,
        },
      ],
      RoomSales: [
        {
          Id: 1,
          RoomNumber: '503',
          RoomCategory: 'KHÁCH NGÀY',
          UnitPrice: 590000,
        },
        {
          Id: 2,
          RoomNumber: '502',
          RoomCategory: 'KHÁCH GIỜ',
          UnitPrice: 300000,
        },
        {
          Id: 3,
          RoomNumber: '603',
          RoomCategory: 'KHÁCH NGÀY',
          UnitPrice: 590000,
        },
        {
          Id: 4,
          RoomNumber: '703',
          RoomCategory: 'KHÁCH NGÀY',
          UnitPrice: 590000,
        },
      ],
    },
    // các mock khác giữ nguyên cấu trúc, chỉ cần đổi field giống mẫu này
  ];

  private nextId = 6;

  getAll(
    params?: ShiftReportQueryParams
  ): Observable<PagedResult<ShiftReportListItem>> {
    let filteredReports = [...this.mockReports];

    // Apply filters
    if (params?.ReceptionistName) {
      filteredReports = filteredReports.filter(r =>
        r.ReceptionistName.toLowerCase().includes(
          params.ReceptionistName!.toLowerCase()
        )
      );
    }

    if (params?.ShiftType) {
      filteredReports = filteredReports.filter(
        r => r.ShiftType === params.ShiftType
      );
    }

    if (params?.FromDate) {
      filteredReports = filteredReports.filter(
        r => r.ShiftDate >= params.FromDate!
      );
    }

    if (params?.ToDate) {
      filteredReports = filteredReports.filter(
        r => r.ShiftDate <= params.ToDate!
      );
    }

    // Sort by date descending
    filteredReports.sort(
      (a, b) =>
        new Date(b.ShiftDate).getTime() - new Date(a.ShiftDate).getTime()
    );

    // Pagination
    const pageNumber = params?.PageNumber || 1;
    const pageSize = params?.PageSize || 10;
    const startIndex = (pageNumber - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    const items = filteredReports.slice(startIndex, endIndex).map(r => ({
      Id: r.Id,
      ShiftDate: r.ShiftDate,
      ShiftType: r.ShiftType,
      ReceptionistName: r.ReceptionistName,
      TotalCash: r.TotalCash,
      TotalTransfer: r.TotalTransfer,
      HandoverAmount: r.HandoverAmount,
      CreatedAt: r.CreatedAt,
    }));

    const result: PagedResult<ShiftReportListItem> = {
      Items: items,
      TotalCount: filteredReports.length,
      PageNumber: pageNumber,
      PageSize: pageSize,
      TotalPages: Math.ceil(filteredReports.length / pageSize),
      HasPrevious: pageNumber > 1,
      HasNext: pageNumber < Math.ceil(filteredReports.length / pageSize),
    };

    return of(result).pipe(delay(500));
  }

  getById(id: number): Observable<ShiftReportResponse> {
    const report = this.mockReports.find(r => r.Id === id);
    if (!report) throw new Error(`Report with ID ${id} not found`);
    return of(report).pipe(delay(300));
  }

  create(dto: CreateShiftReportDto): Observable<ShiftReportResponse> {
    const newReport: ShiftReportResponse = {
      Id: this.nextId++,
      ShiftDate: dto.ShiftDate,
      ShiftType: dto.ShiftType,
      StartTime: dto.StartTime,
      EndTime: dto.EndTime,
      ReceptionistName: dto.ReceptionistName,
      ReceiverName: dto.ReceiverName,
      TotalCash: dto.Transactions.reduce(
        (sum, t) => sum + (t.CashAmount || 0),
        0
      ),
      TotalTransfer: dto.Transactions.reduce(
        (sum, t) => sum + (t.TransferAmount || 0),
        0
      ),
      TotalExpense: dto.Transactions.reduce(
        (sum, t) => sum + (t.ExpenseAmount || 0),
        0
      ),
      HandoverAmount: 0,
      CreatedAt: new Date().toISOString(),
      Transactions: dto.Transactions.map((t, i) => ({ ...t, Id: i + 1 })),
      RoomSales: dto.RoomSales.map((s, i) => ({ ...s, Id: i + 1 })),
    };
    newReport.HandoverAmount = newReport.TotalCash - newReport.TotalExpense;

    this.mockReports.unshift(newReport);
    return of(newReport).pipe(delay(500));
  }

  update(
    id: number,
    dto: CreateShiftReportDto
  ): Observable<ShiftReportResponse> {
    const index = this.mockReports.findIndex(r => r.Id === id);
    if (index === -1) throw new Error(`Report with ID ${id} not found`);

    const updatedReport: ShiftReportResponse = {
      ...this.mockReports[index],
      ShiftDate: dto.ShiftDate,
      ShiftType: dto.ShiftType,
      StartTime: dto.StartTime,
      EndTime: dto.EndTime,
      ReceptionistName: dto.ReceptionistName,
      ReceiverName: dto.ReceiverName,
      TotalCash: dto.Transactions.reduce(
        (sum, t) => sum + (t.CashAmount || 0),
        0
      ),
      TotalTransfer: dto.Transactions.reduce(
        (sum, t) => sum + (t.TransferAmount || 0),
        0
      ),
      TotalExpense: dto.Transactions.reduce(
        (sum, t) => sum + (t.ExpenseAmount || 0),
        0
      ),
      UpdatedAt: new Date().toISOString(),
      Transactions: dto.Transactions,
      RoomSales: dto.RoomSales,
    };
    updatedReport.HandoverAmount =
      updatedReport.TotalCash - updatedReport.TotalExpense;

    this.mockReports[index] = updatedReport;
    return of(updatedReport).pipe(delay(500));
  }

  delete(id: number): Observable<void> {
    const index = this.mockReports.findIndex(r => r.Id === id);
    if (index === -1) throw new Error(`Report with ID ${id} not found`);
    this.mockReports.splice(index, 1);
    return of(void 0).pipe(delay(300));
  }

  getSummary(fromDate?: string, toDate?: string): Observable<any> {
    let filteredReports = [...this.mockReports];
    if (fromDate)
      filteredReports = filteredReports.filter(r => r.ShiftDate >= fromDate);
    if (toDate)
      filteredReports = filteredReports.filter(r => r.ShiftDate <= toDate);

    const summary = {
      TotalReports: filteredReports.length,
      TotalCash: filteredReports.reduce((sum, r) => sum + r.TotalCash, 0),
      TotalTransfer: filteredReports.reduce(
        (sum, r) => sum + r.TotalTransfer,
        0
      ),
      TotalHandover: filteredReports.reduce(
        (sum, r) => sum + r.HandoverAmount,
        0
      ),
    };

    return of(summary).pipe(delay(300));
  }
}
