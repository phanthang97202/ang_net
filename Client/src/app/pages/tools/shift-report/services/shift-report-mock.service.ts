import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import {
  ShiftReportResponse,
  ShiftReportListItem,
  PagedResult,
  ShiftReportQueryParams,
  CreateShiftReportDto,
} from './../types/shift-report-type';

@Injectable({
  providedIn: 'root',
})
export class ShiftReportMockService {
  private mockReports: ShiftReportResponse[] = [
    {
      id: 1,
      shiftDate: '2025-10-18',
      shiftType: 'Ca ngày',
      startTime: '07:00:00',
      endTime: '19:00:00',
      receptionistName: 'Huy',
      totalCash: 5577000,
      totalTransfer: 3980000,
      totalExpense: 4000000,
      handoverAmount: 1577000,
      receiverName: 'Minh',
      createdAt: '2025-10-18T19:05:00',
      transactions: [
        {
          id: 1,
          orderNumber: 1,
          roomNumber: '',
          invoiceCode: '',
          customerType: '',
          cashAmount: 2000000,
          transferAmount: undefined,
          prepaidNote: 'khách đối tiền mặt, đã ck 2tr',
          expenseDescription: '',
          expenseAmount: undefined,
        },
        {
          id: 2,
          orderNumber: 2,
          roomNumber: '201',
          invoiceCode: '6786',
          customerType: 'k.ngày/out',
          cashAmount: undefined,
          transferAmount: 800000,
          prepaidNote: '',
          expenseDescription: 'chú hải cảm 2tr',
          expenseAmount: 2000000,
        },
        {
          id: 3,
          orderNumber: 3,
          roomNumber: '502',
          invoiceCode: '6791',
          customerType: 'k.ngày/out',
          cashAmount: undefined,
          transferAmount: undefined,
          prepaidNote: 'đtt ca trước',
          expenseDescription: '',
          expenseAmount: undefined,
        },
        {
          id: 4,
          orderNumber: 4,
          roomNumber: '302',
          invoiceCode: '6797',
          customerType: 'k.đêm/out',
          cashAmount: undefined,
          transferAmount: undefined,
          prepaidNote: 'đtt ca trước',
          expenseDescription: '',
          expenseAmount: undefined,
        },
        {
          id: 5,
          orderNumber: 5,
          roomNumber: '503',
          invoiceCode: '6802',
          customerType: 'k.ngày',
          cashAmount: 590000,
          transferAmount: undefined,
          prepaidNote: '',
          expenseDescription: '',
          expenseAmount: undefined,
        },
        {
          id: 6,
          orderNumber: 6,
          roomNumber: '502',
          invoiceCode: '6803',
          customerType: 'k.ngày',
          cashAmount: 590000,
          transferAmount: undefined,
          prepaidNote: '',
          expenseDescription: '',
          expenseAmount: undefined,
        },
        {
          id: 7,
          orderNumber: 7,
          roomNumber: '603',
          invoiceCode: '6805',
          customerType: 'k.ngày',
          cashAmount: undefined,
          transferAmount: 590000,
          prepaidNote: '',
          expenseDescription: '',
          expenseAmount: undefined,
        },
        {
          id: 8,
          orderNumber: 8,
          roomNumber: '703',
          invoiceCode: '6804',
          customerType: 'k.ngày',
          cashAmount: undefined,
          transferAmount: 590000,
          prepaidNote: '',
          expenseDescription: '',
          expenseAmount: undefined,
        },
        {
          id: 9,
          orderNumber: 9,
          roomNumber: '',
          invoiceCode: '',
          customerType: '',
          cashAmount: undefined,
          transferAmount: 2000000,
          prepaidNote: '',
          expenseDescription: '',
          expenseAmount: 2000000,
        },
      ],
      roomSales: [
        {
          id: 1,
          roomNumber: '503',
          roomCategory: 'KHÁCH NGÀY',
          unitPrice: 590000,
        },
        {
          id: 2,
          roomNumber: '502',
          roomCategory: 'KHÁCH GIỜ',
          unitPrice: 300000,
        },
        {
          id: 3,
          roomNumber: '603',
          roomCategory: 'KHÁCH NGÀY',
          unitPrice: 590000,
        },
        {
          id: 4,
          roomNumber: '703',
          roomCategory: 'KHÁCH NGÀY',
          unitPrice: 590000,
        },
      ],
    },
    {
      id: 2,
      shiftDate: '2025-10-17',
      shiftType: 'Ca đêm',
      startTime: '19:00:00',
      endTime: '07:00:00',
      receptionistName: 'Lan',
      totalCash: 3250000,
      totalTransfer: 2180000,
      totalExpense: 500000,
      handoverAmount: 2750000,
      receiverName: 'Huy',
      createdAt: '2025-10-18T07:10:00',
      transactions: [
        {
          id: 10,
          orderNumber: 1,
          roomNumber: '301',
          invoiceCode: '6780',
          customerType: 'k.đêm',
          cashAmount: 1200000,
          transferAmount: undefined,
          prepaidNote: '',
          expenseDescription: '',
          expenseAmount: undefined,
        },
        {
          id: 11,
          orderNumber: 2,
          roomNumber: '401',
          invoiceCode: '6781',
          customerType: 'k.đêm',
          cashAmount: undefined,
          transferAmount: 1180000,
          prepaidNote: '',
          expenseDescription: '',
          expenseAmount: undefined,
        },
        {
          id: 12,
          orderNumber: 3,
          roomNumber: '501',
          invoiceCode: '6782',
          customerType: 'k.đêm',
          cashAmount: 1250000,
          transferAmount: undefined,
          prepaidNote: '',
          expenseDescription: '',
          expenseAmount: undefined,
        },
        {
          id: 13,
          orderNumber: 4,
          roomNumber: '601',
          invoiceCode: '6783',
          customerType: 'k.đêm',
          cashAmount: undefined,
          transferAmount: 1000000,
          prepaidNote: '',
          expenseDescription: '',
          expenseAmount: undefined,
        },
        {
          id: 14,
          orderNumber: 5,
          roomNumber: '',
          invoiceCode: '',
          customerType: '',
          cashAmount: 800000,
          transferAmount: undefined,
          prepaidNote: '',
          expenseDescription: 'mua đồ ăn sáng',
          expenseAmount: 500000,
        },
      ],
      roomSales: [
        {
          id: 5,
          roomNumber: '301',
          roomCategory: 'KHÁCH ĐÊM',
          unitPrice: 400000,
        },
        {
          id: 6,
          roomNumber: '401',
          roomCategory: 'KHÁCH ĐÊM',
          unitPrice: 380000,
        },
        {
          id: 7,
          roomNumber: '501',
          roomCategory: 'KHÁCH ĐÊM',
          unitPrice: 420000,
        },
        {
          id: 8,
          roomNumber: '601',
          roomCategory: 'KHÁCH ĐÊM',
          unitPrice: 350000,
        },
      ],
    },
    {
      id: 3,
      shiftDate: '2025-10-19',
      shiftType: 'Ca ngày',
      startTime: '07:00:00',
      endTime: '19:00:00',
      receptionistName: 'Minh',
      totalCash: 4820000,
      totalTransfer: 3200000,
      totalExpense: 1200000,
      handoverAmount: 3620000,
      receiverName: '',
      createdAt: '2025-10-19T19:15:00',
      transactions: [
        {
          id: 15,
          orderNumber: 1,
          roomNumber: '201',
          invoiceCode: '6790',
          customerType: 'k.ngày',
          cashAmount: 1500000,
          transferAmount: undefined,
          prepaidNote: '',
          expenseDescription: '',
          expenseAmount: undefined,
        },
        {
          id: 16,
          orderNumber: 2,
          roomNumber: '202',
          invoiceCode: '6791',
          customerType: 'k.ngày',
          cashAmount: undefined,
          transferAmount: 1600000,
          prepaidNote: '',
          expenseDescription: '',
          expenseAmount: undefined,
        },
        {
          id: 17,
          orderNumber: 3,
          roomNumber: '303',
          invoiceCode: '6792',
          customerType: 'k.ngày/out',
          cashAmount: undefined,
          transferAmount: 1600000,
          prepaidNote: 'đã thanh toán booking',
          expenseDescription: '',
          expenseAmount: undefined,
        },
        {
          id: 18,
          orderNumber: 4,
          roomNumber: '404',
          invoiceCode: '6793',
          customerType: 'k.giờ',
          cashAmount: 320000,
          transferAmount: undefined,
          prepaidNote: '',
          expenseDescription: '',
          expenseAmount: undefined,
        },
        {
          id: 19,
          orderNumber: 5,
          roomNumber: '505',
          invoiceCode: '6794',
          customerType: 'k.ngày',
          cashAmount: 3000000,
          transferAmount: undefined,
          prepaidNote: '',
          expenseDescription: 'sửa điều hòa',
          expenseAmount: 1200000,
        },
      ],
      roomSales: [
        {
          id: 9,
          roomNumber: '201',
          roomCategory: 'KHÁCH NGÀY',
          unitPrice: 550000,
        },
        {
          id: 10,
          roomNumber: '202',
          roomCategory: 'KHÁCH NGÀY',
          unitPrice: 580000,
        },
        {
          id: 11,
          roomNumber: '404',
          roomCategory: 'KHÁCH GIỜ',
          unitPrice: 320000,
        },
        {
          id: 12,
          roomNumber: '505',
          roomCategory: 'KHÁCH NGÀY',
          unitPrice: 600000,
        },
      ],
    },
    {
      id: 4,
      shiftDate: '2025-10-16',
      shiftType: 'Ca ngày',
      startTime: '07:00:00',
      endTime: '19:00:00',
      receptionistName: 'Huy',
      totalCash: 6200000,
      totalTransfer: 4500000,
      totalExpense: 2800000,
      handoverAmount: 3400000,
      receiverName: 'Lan',
      createdAt: '2025-10-16T19:20:00',
      transactions: [
        {
          id: 20,
          orderNumber: 1,
          roomNumber: '101',
          invoiceCode: '6770',
          customerType: 'k.ngày',
          cashAmount: 1800000,
          transferAmount: undefined,
          prepaidNote: '',
          expenseDescription: '',
          expenseAmount: undefined,
        },
        {
          id: 21,
          orderNumber: 2,
          roomNumber: '102',
          invoiceCode: '6771',
          customerType: 'k.ngày',
          cashAmount: undefined,
          transferAmount: 1500000,
          prepaidNote: '',
          expenseDescription: '',
          expenseAmount: undefined,
        },
        {
          id: 22,
          orderNumber: 3,
          roomNumber: '203',
          invoiceCode: '6772',
          customerType: 'k.giờ',
          cashAmount: 400000,
          transferAmount: undefined,
          prepaidNote: '',
          expenseDescription: '',
          expenseAmount: undefined,
        },
        {
          id: 23,
          orderNumber: 4,
          roomNumber: '304',
          invoiceCode: '6773',
          customerType: 'k.ngày',
          cashAmount: undefined,
          transferAmount: 3000000,
          prepaidNote: '',
          expenseDescription: '',
          expenseAmount: undefined,
        },
        {
          id: 24,
          orderNumber: 5,
          roomNumber: '',
          invoiceCode: '',
          customerType: '',
          cashAmount: 4000000,
          transferAmount: undefined,
          prepaidNote: '',
          expenseDescription: 'thanh toán tiền điện nước',
          expenseAmount: 2800000,
        },
      ],
      roomSales: [
        {
          id: 13,
          roomNumber: '101',
          roomCategory: 'KHÁCH NGÀY',
          unitPrice: 600000,
        },
        {
          id: 14,
          roomNumber: '102',
          roomCategory: 'KHÁCH NGÀY',
          unitPrice: 550000,
        },
        {
          id: 15,
          roomNumber: '203',
          roomCategory: 'KHÁCH GIỜ',
          unitPrice: 400000,
        },
        {
          id: 16,
          roomNumber: '304',
          roomCategory: 'KHÁCH NGÀY',
          unitPrice: 650000,
        },
      ],
    },
    {
      id: 5,
      shiftDate: '2025-10-15',
      shiftType: 'Ca đêm',
      startTime: '19:00:00',
      endTime: '07:00:00',
      receptionistName: 'Lan',
      totalCash: 2800000,
      totalTransfer: 1900000,
      totalExpense: 300000,
      handoverAmount: 2500000,
      receiverName: 'Minh',
      createdAt: '2025-10-16T07:05:00',
      transactions: [
        {
          id: 25,
          orderNumber: 1,
          roomNumber: '401',
          invoiceCode: '6760',
          customerType: 'k.đêm',
          cashAmount: 900000,
          transferAmount: undefined,
          prepaidNote: '',
          expenseDescription: '',
          expenseAmount: undefined,
        },
        {
          id: 26,
          orderNumber: 2,
          roomNumber: '402',
          invoiceCode: '6761',
          customerType: 'k.đêm',
          cashAmount: undefined,
          transferAmount: 950000,
          prepaidNote: '',
          expenseDescription: '',
          expenseAmount: undefined,
        },
        {
          id: 27,
          orderNumber: 3,
          roomNumber: '501',
          invoiceCode: '6762',
          customerType: 'k.đêm',
          cashAmount: 1000000,
          transferAmount: undefined,
          prepaidNote: '',
          expenseDescription: '',
          expenseAmount: undefined,
        },
        {
          id: 28,
          orderNumber: 4,
          roomNumber: '502',
          invoiceCode: '6763',
          customerType: 'k.đêm',
          cashAmount: undefined,
          transferAmount: 950000,
          prepaidNote: '',
          expenseDescription: '',
          expenseAmount: undefined,
        },
        {
          id: 29,
          orderNumber: 5,
          roomNumber: '',
          invoiceCode: '',
          customerType: '',
          cashAmount: 900000,
          transferAmount: undefined,
          prepaidNote: '',
          expenseDescription: 'mua nước uống',
          expenseAmount: 300000,
        },
      ],
      roomSales: [
        {
          id: 17,
          roomNumber: '401',
          roomCategory: 'KHÁCH ĐÊM',
          unitPrice: 380000,
        },
        {
          id: 18,
          roomNumber: '402',
          roomCategory: 'KHÁCH ĐÊM',
          unitPrice: 400000,
        },
        {
          id: 19,
          roomNumber: '501',
          roomCategory: 'KHÁCH ĐÊM',
          unitPrice: 420000,
        },
        {
          id: 20,
          roomNumber: '502',
          roomCategory: 'KHÁCH ĐÊM',
          unitPrice: 400000,
        },
      ],
    },
  ];

  private nextId = 6;

  getAll(
    params?: ShiftReportQueryParams
  ): Observable<PagedResult<ShiftReportListItem>> {
    let filteredReports = [...this.mockReports];

    // Apply filters
    if (params?.receptionistName) {
      filteredReports = filteredReports.filter(r =>
        r.receptionistName
          .toLowerCase()
          .includes(params.receptionistName!.toLowerCase())
      );
    }

    if (params?.shiftType) {
      filteredReports = filteredReports.filter(
        r => r.shiftType === params.shiftType
      );
    }

    if (params?.fromDate) {
      filteredReports = filteredReports.filter(
        r => r.shiftDate >= params.fromDate!
      );
    }

    if (params?.toDate) {
      filteredReports = filteredReports.filter(
        r => r.shiftDate <= params.toDate!
      );
    }

    // Sort by date descending
    filteredReports.sort(
      (a, b) =>
        new Date(b.shiftDate).getTime() - new Date(a.shiftDate).getTime()
    );

    // Pagination
    const pageNumber = params?.pageNumber || 1;
    const pageSize = params?.pageSize || 10;
    const startIndex = (pageNumber - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    const items = filteredReports.slice(startIndex, endIndex).map(r => ({
      id: r.id,
      shiftDate: r.shiftDate,
      shiftType: r.shiftType,
      receptionistName: r.receptionistName,
      totalCash: r.totalCash,
      totalTransfer: r.totalTransfer,
      handoverAmount: r.handoverAmount,
      createdAt: r.createdAt,
    }));

    const result: PagedResult<ShiftReportListItem> = {
      items,
      totalCount: filteredReports.length,
      pageNumber,
      pageSize,
      totalPages: Math.ceil(filteredReports.length / pageSize),
      hasPrevious: pageNumber > 1,
      hasNext: pageNumber < Math.ceil(filteredReports.length / pageSize),
    };

    return of(result).pipe(delay(500)); // Simulate network delay
  }

  getById(id: number): Observable<ShiftReportResponse> {
    const report = this.mockReports.find(r => r.id === id);
    if (!report) {
      throw new Error(`Report with ID ${id} not found`);
    }
    return of(report).pipe(delay(300));
  }

  create(dto: CreateShiftReportDto): Observable<ShiftReportResponse> {
    const newReport: ShiftReportResponse = {
      id: this.nextId++,
      shiftDate: dto.shiftDate,
      shiftType: dto.shiftType,
      startTime: dto.startTime,
      endTime: dto.endTime,
      receptionistName: dto.receptionistName,
      receiverName: dto.receiverName,
      totalCash: dto.transactions.reduce(
        (sum, t) => sum + (t.cashAmount || 0),
        0
      ),
      totalTransfer: dto.transactions.reduce(
        (sum, t) => sum + (t.transferAmount || 0),
        0
      ),
      totalExpense: dto.transactions.reduce(
        (sum, t) => sum + (t.expenseAmount || 0),
        0
      ),
      handoverAmount: 0,
      createdAt: new Date().toISOString(),
      transactions: dto.transactions.map((t, i) => ({ ...t, id: i + 1 })),
      roomSales: dto.roomSales.map((s, i) => ({ ...s, id: i + 1 })),
    };
    newReport.handoverAmount = newReport.totalCash - newReport.totalExpense;

    this.mockReports.unshift(newReport);
    return of(newReport).pipe(delay(500));
  }

  update(
    id: number,
    dto: CreateShiftReportDto
  ): Observable<ShiftReportResponse> {
    const index = this.mockReports.findIndex(r => r.id === id);
    if (index === -1) {
      throw new Error(`Report with ID ${id} not found`);
    }

    const updatedReport: ShiftReportResponse = {
      ...this.mockReports[index],
      shiftDate: dto.shiftDate,
      shiftType: dto.shiftType,
      startTime: dto.startTime,
      endTime: dto.endTime,
      receptionistName: dto.receptionistName,
      receiverName: dto.receiverName,
      totalCash: dto.transactions.reduce(
        (sum, t) => sum + (t.cashAmount || 0),
        0
      ),
      totalTransfer: dto.transactions.reduce(
        (sum, t) => sum + (t.transferAmount || 0),
        0
      ),
      totalExpense: dto.transactions.reduce(
        (sum, t) => sum + (t.expenseAmount || 0),
        0
      ),
      updatedAt: new Date().toISOString(),
      transactions: dto.transactions,
      roomSales: dto.roomSales,
    };
    updatedReport.handoverAmount =
      updatedReport.totalCash - updatedReport.totalExpense;

    this.mockReports[index] = updatedReport;
    return of(updatedReport).pipe(delay(500));
  }

  delete(id: number): Observable<void> {
    const index = this.mockReports.findIndex(r => r.id === id);
    if (index === -1) {
      throw new Error(`Report with ID ${id} not found`);
    }
    this.mockReports.splice(index, 1);
    return of(void 0).pipe(delay(300));
  }

  getSummary(fromDate?: string, toDate?: string): Observable<any> {
    let filteredReports = [...this.mockReports];

    if (fromDate) {
      filteredReports = filteredReports.filter(r => r.shiftDate >= fromDate);
    }

    if (toDate) {
      filteredReports = filteredReports.filter(r => r.shiftDate <= toDate);
    }

    const summary = {
      totalReports: filteredReports.length,
      totalCash: filteredReports.reduce((sum, r) => sum + r.totalCash, 0),
      totalTransfer: filteredReports.reduce(
        (sum, r) => sum + r.totalTransfer,
        0
      ),
      totalHandover: filteredReports.reduce(
        (sum, r) => sum + r.handoverAmount,
        0
      ),
    };

    return of(summary).pipe(delay(300));
  }
}
