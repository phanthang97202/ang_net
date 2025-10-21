import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { ShiftReportResponse } from './../types/shift-report-type';

@Injectable({
  providedIn: 'root',
})
export class ExcelExportService {
  exportShiftReport(report: ShiftReportResponse): void {
    const wb = XLSX.utils.book_new();

    // Create main data array
    const data: any[][] = [];

    // Title
    data.push(['BÁO CÁO THU TIỀN VÀ BÀN GIAO CA']);
    data.push([
      `CA ${report.ShiftType.toUpperCase()} ${this.formatDateTime(report.ShiftDate, report.StartTime, report.EndTime)}`,
    ]);
    data.push([]);

    // Header row
    data.push([
      'Lễ tân',
      'STT',
      'Số phòng',
      'Mã phòng',
      'Loại khách',
      'TT Tiền mặt',
      'Chuyển khoản',
      'Đặt cọc TT trước',
      'ND chi tiêu',
      'Tiền chi tiêu',
      'Số tiền bàn giao',
    ]);

    // First row with receptionist name and opening balance
    const firstTransaction = report.Transactions[0] || {};
    data.push([
      report.ReceptionistName,
      firstTransaction.OrderNumber || '',
      firstTransaction.RoomNumber || '',
      firstTransaction.InvoiceCode || '',
      firstTransaction.CustomerType || '',
      firstTransaction.CashAmount || '',
      firstTransaction.TransferAmount || '',
      firstTransaction.PrepaidNote || '',
      firstTransaction.ExpenseDescription || '',
      firstTransaction.ExpenseAmount || '',
      '',
    ]);

    // Rest of transactions
    for (let i = 1; i < report.Transactions.length; i++) {
      const txn = report.Transactions[i];
      data.push([
        '',
        txn.OrderNumber,
        txn.RoomNumber || '',
        txn.InvoiceCode || '',
        txn.CustomerType || '',
        txn.CashAmount || '',
        txn.TransferAmount || '',
        txn.PrepaidNote || '',
        txn.ExpenseDescription || '',
        txn.ExpenseAmount || '',
        '',
      ]);
    }

    // Total row
    data.push([
      '',
      '',
      '',
      '',
      '',
      report.TotalCash,
      report.TotalTransfer,
      '',
      '',
      report.TotalExpense,
      report.HandoverAmount,
    ]);

    data.push([]);
    data.push([`Bàn phòng ngày ${this.formatDate(report.ShiftDate)}`]);
    data.push([]);

    // Room sales table header
    data.push(['STT', 'KHÁCH GIỜ', '', 'KHÁCH ĐÊM', '', 'KHÁCH NGÀY', '']);
    data.push(['', 'PHÒNG', 'ĐƠN GIÁ', 'PHÒNG', 'ĐƠN GIÁ', 'PHÒNG', 'ĐƠN GIÁ']);

    // Group room sales by category
    const hourlyRooms = report.RoomSales.filter(
      r => r.RoomCategory === 'KHÁCH GIỜ'
    );
    const nightRooms = report.RoomSales.filter(
      r => r.RoomCategory === 'KHÁCH ĐÊM'
    );
    const dailyRooms = report.RoomSales.filter(
      r => r.RoomCategory === 'KHÁCH NGÀY'
    );

    const maxRows = Math.max(
      hourlyRooms.length,
      nightRooms.length,
      dailyRooms.length
    );

    for (let i = 0; i < maxRows; i++) {
      data.push([
        i + 1,
        hourlyRooms[i]?.RoomNumber || '',
        hourlyRooms[i]?.UnitPrice || '',
        nightRooms[i]?.RoomNumber || '',
        nightRooms[i]?.UnitPrice || '',
        dailyRooms[i]?.RoomNumber || '',
        dailyRooms[i]?.UnitPrice || '',
      ]);
    }

    data.push([]);
    data.push(['NGƯỜI GIAO']);
    data.push([report.ReceptionistName]);
    data.push([]);
    data.push(['NGƯỜI NHẬN']);
    data.push([report.ReceiverName || '']);

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Set column widths
    ws['!cols'] = [
      { wch: 15 }, // Lễ tân
      { wch: 8 }, // STT
      { wch: 12 }, // Số phòng
      { wch: 12 }, // Mã phòng
      { wch: 15 }, // Loại khách
      { wch: 15 }, // TT Tiền mặt
      { wch: 15 }, // Chuyển khoản
      { wch: 20 }, // Đặt cọc
      { wch: 25 }, // ND chi tiêu
      { wch: 15 }, // Tiền chi tiêu
      { wch: 18 }, // Số tiền bàn giao
    ];

    // Merge cells for title
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 10 } }, // Title
      { s: { r: 1, c: 0 }, e: { r: 1, c: 10 } }, // Subtitle
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Báo cáo ca');

    // Generate filename
    const fileName = `BaoCaoCa_${this.formatDate(report.ShiftDate)}_${report.ShiftType}.xlsx`;

    // Save file
    XLSX.writeFile(wb, fileName);
  }

  private formatDateTime(
    date: string,
    startTime: string,
    endTime: string
  ): string {
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();

    // Format time from HH:mm:ss to HH:mm
    const start = startTime.substring(0, 5);
    const end = endTime.substring(0, 5);

    return `${day}.${month}.${year} ${start} - ${end}`;
  }

  private formatDate(date: string): string {
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }
}
