import { Injectable } from '@angular/core';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { ShiftReportResponse } from './../types/shift-report-type';

@Injectable({
  providedIn: 'root',
})
export class ExcelExportService {
  async exportShiftReport(report: ShiftReportResponse): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Báo cáo ca');

    // ========== STYLING CONSTANTS ==========
    const titleStyle = {
      font: { name: 'Arial', size: 14, bold: true },
      alignment: { horizontal: 'center' as const, vertical: 'middle' as const },
      border: this.getBorder(),
    };

    const subtitleStyle = {
      font: { name: 'Arial', size: 11, bold: true },
      alignment: { horizontal: 'center' as const, vertical: 'middle' as const },
      border: this.getBorder(),
    };

    const headerStyle = {
      font: { name: 'Arial', size: 10, bold: true },
      alignment: {
        horizontal: 'center' as const,
        vertical: 'middle' as const,
        wrapText: true,
      },
      fill: {
        type: 'pattern' as const,
        pattern: 'solid' as const,
        fgColor: { argb: 'FFE7E6E6' },
      },
      border: this.getBorder(),
    };

    const dataStyle = {
      font: { name: 'Arial', size: 10 },
      alignment: { horizontal: 'left' as const, vertical: 'middle' as const },
      border: this.getBorder(),
    };

    const dataStyleCenter = {
      font: { name: 'Arial', size: 10 },
      alignment: { horizontal: 'center' as const, vertical: 'middle' as const },
      border: this.getBorder(),
    };

    const numberStyle = {
      font: { name: 'Arial', size: 10 },
      alignment: { horizontal: 'right' as const, vertical: 'middle' as const },
      border: this.getBorder(),
      numFmt: '#,##0',
    };

    const totalStyle = {
      font: { name: 'Arial', size: 10, bold: true },
      alignment: { horizontal: 'right' as const, vertical: 'middle' as const },
      fill: {
        type: 'pattern' as const,
        pattern: 'solid' as const,
        fgColor: { argb: 'FFFFFF00' },
      },
      border: this.getBorder(),
      numFmt: '#,##0',
    };

    // ========== SET COLUMN WIDTHS ==========
    worksheet.columns = [
      { width: 15 }, // A: Lễ tân
      { width: 6 }, // B: STT
      { width: 10 }, // C: Số phòng
      { width: 10 }, // D: Mã phòng
      { width: 15 }, // E: Loại khách
      { width: 15 }, // F: TT Tiền mặt
      { width: 15 }, // G: Chuyển khoản
      { width: 18 }, // H: Đặt cọc
      { width: 25 }, // I: ND chi tiêu
      { width: 15 }, // J: Tiền chi tiêu
      { width: 18 }, // K: Số tiền bàn giao
    ];

    // ========== TITLE SECTION ==========
    worksheet.mergeCells('A1:K1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'BÁO CÁO THU TIỀN VÀ BÀN GIAO CA';
    titleCell.style = titleStyle;

    worksheet.mergeCells('A2:K2');
    const subtitleCell = worksheet.getCell('A2');
    subtitleCell.value = `CA ${report.shiftType.toUpperCase()} ${this.formatDateTime(report.shiftDate, report.startTime, report.endTime)}`;
    subtitleCell.style = subtitleStyle;

    // Row 3: Empty

    // ========== TRANSACTION TABLE HEADER (Row 4) ==========
    const headerRow = worksheet.getRow(4);
    const headers = [
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
    ];

    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = header;
      cell.style = headerStyle;
    });

    headerRow.height = 30;

    // ========== TRANSACTION DATA ==========
    let currentRow = 5;
    const startTransactionRow = currentRow;

    // Add all transactions
    report.transactions.forEach((txn, index) => {
      const row = worksheet.getRow(currentRow);

      // Only set receptionist name in first row
      if (index === 0) {
        const cell = row.getCell(1);
        cell.value = report.receptionistName;
        cell.style = dataStyleCenter;
      }

      const sttCell = row.getCell(2);
      sttCell.value = index + 1;
      sttCell.style = dataStyleCenter;

      row.getCell(3).value = txn.roomNumber || '';
      row.getCell(3).style = dataStyleCenter;

      row.getCell(4).value = txn.invoiceCode || '';
      row.getCell(4).style = dataStyleCenter;

      row.getCell(5).value = txn.customerType || '';
      row.getCell(5).style = dataStyle;

      const cashCell = row.getCell(6);
      if (txn.cashAmount) {
        cashCell.value = txn.cashAmount;
        cashCell.style = numberStyle;
      } else {
        cashCell.value = '';
        cashCell.style = dataStyle;
      }

      const transferCell = row.getCell(7);
      if (txn.transferAmount) {
        transferCell.value = txn.transferAmount;
        transferCell.style = numberStyle;
      } else {
        transferCell.value = '';
        transferCell.style = dataStyle;
      }

      row.getCell(8).value = txn.prepaidNote || '';
      row.getCell(8).style = dataStyle;

      row.getCell(9).value = txn.expenseDescription || '';
      row.getCell(9).style = dataStyle;

      const expenseCell = row.getCell(10);
      if (txn.expenseAmount) {
        expenseCell.value = txn.expenseAmount;
        expenseCell.style = numberStyle;
      } else {
        expenseCell.value = '';
        expenseCell.style = dataStyle;
      }

      row.getCell(11).value = '';
      row.getCell(11).style = dataStyle;

      currentRow++;
    });

    // Merge receptionist name cells
    if (report.transactions.length > 0) {
      worksheet.mergeCells(`A${startTransactionRow}:A${currentRow - 1}`);
    }

    // ========== TOTAL ROW ==========
    const totalRow = worksheet.getRow(currentRow);

    for (let i = 1; i <= 11; i++) {
      const cell = totalRow.getCell(i);
      cell.style = totalStyle;

      if (i === 6) cell.value = report.totalCash;
      else if (i === 7) cell.value = report.totalTransfer;
      else if (i === 10) cell.value = report.totalExpense;
      else if (i === 11) cell.value = report.handoverAmount;
      else cell.value = '';
    }

    currentRow += 2;

    // ========== ROOM SALES SECTION ==========
    worksheet.mergeCells(`A${currentRow}:G${currentRow}`);
    const roomTitleCell = worksheet.getCell(`A${currentRow}`);
    roomTitleCell.value = `Bàn phòng ngày ${this.formatDate(report.shiftDate)}`;
    roomTitleCell.style = subtitleStyle;

    currentRow += 2;

    const roomHeaderRow1 = currentRow;

    // Room sales header - Row 1
    worksheet.mergeCells(`B${currentRow}:C${currentRow}`);
    worksheet.mergeCells(`D${currentRow}:E${currentRow}`);
    worksheet.mergeCells(`F${currentRow}:G${currentRow}`);

    const roomHeader1 = worksheet.getRow(currentRow);
    roomHeader1.getCell(1).value = 'STT';
    roomHeader1.getCell(1).style = headerStyle;
    roomHeader1.getCell(2).value = 'KHÁCH GIỜ';
    roomHeader1.getCell(2).style = headerStyle;
    roomHeader1.getCell(3).style = headerStyle;
    roomHeader1.getCell(4).value = 'KHÁCH ĐÊM';
    roomHeader1.getCell(4).style = headerStyle;
    roomHeader1.getCell(5).style = headerStyle;
    roomHeader1.getCell(6).value = 'KHÁCH NGÀY';
    roomHeader1.getCell(6).style = headerStyle;
    roomHeader1.getCell(7).style = headerStyle;

    // Add NGƯỜI GIAO on same row
    const signerStyle = {
      font: { name: 'Arial', size: 11, bold: true },
      alignment: { horizontal: 'center' as const, vertical: 'middle' as const },
    };

    const signerDataStyle = {
      font: { name: 'Arial', size: 10 },
      alignment: { horizontal: 'center' as const, vertical: 'middle' as const },
    };

    roomHeader1.getCell(9).value = 'NGƯỜI GIAO';
    roomHeader1.getCell(9).style = signerStyle;

    currentRow++;

    // Room sales header - Row 2
    const roomHeader2 = worksheet.getRow(currentRow);
    roomHeader2.getCell(1).value = '';
    roomHeader2.getCell(1).style = headerStyle;
    roomHeader2.getCell(2).value = 'PHÒNG';
    roomHeader2.getCell(2).style = headerStyle;
    roomHeader2.getCell(3).value = 'ĐƠN GIÁ';
    roomHeader2.getCell(3).style = headerStyle;
    roomHeader2.getCell(4).value = 'PHÒNG';
    roomHeader2.getCell(4).style = headerStyle;
    roomHeader2.getCell(5).value = 'ĐƠN GIÁ';
    roomHeader2.getCell(5).style = headerStyle;
    roomHeader2.getCell(6).value = 'PHÒNG';
    roomHeader2.getCell(6).style = headerStyle;
    roomHeader2.getCell(7).value = 'ĐƠN GIÁ';
    roomHeader2.getCell(7).style = headerStyle;

    // Add receptionist name on same row
    roomHeader2.getCell(9).value = report.receptionistName;
    roomHeader2.getCell(9).style = signerDataStyle;

    currentRow++;

    // Group room sales by category
    const hourlyRooms = report.roomSales.filter(
      r => r.roomCategory === 'KHÁCH GIỜ'
    );
    const nightRooms = report.roomSales.filter(
      r => r.roomCategory === 'KHÁCH ĐÊM'
    );
    const dailyRooms = report.roomSales.filter(
      r => r.roomCategory === 'KHÁCH NGÀY'
    );

    const maxRoomRows = Math.max(
      hourlyRooms.length,
      nightRooms.length,
      dailyRooms.length,
      5
    );

    // Room sales data
    for (let i = 0; i < maxRoomRows; i++) {
      const row = worksheet.getRow(currentRow);

      const sttCell = row.getCell(1);
      sttCell.value = i + 1;
      sttCell.style = dataStyleCenter;

      const hourlyRoomCell = row.getCell(2);
      hourlyRoomCell.value = hourlyRooms[i]?.roomNumber || '';
      hourlyRoomCell.style = dataStyleCenter;

      const hourlyPriceCell = row.getCell(3);
      if (hourlyRooms[i]?.unitPrice) {
        hourlyPriceCell.value = hourlyRooms[i].unitPrice;
        hourlyPriceCell.style = numberStyle;
      } else {
        hourlyPriceCell.value = '';
        hourlyPriceCell.style = dataStyle;
      }

      const nightRoomCell = row.getCell(4);
      nightRoomCell.value = nightRooms[i]?.roomNumber || '';
      nightRoomCell.style = dataStyleCenter;

      const nightPriceCell = row.getCell(5);
      if (nightRooms[i]?.unitPrice) {
        nightPriceCell.value = nightRooms[i].unitPrice;
        nightPriceCell.style = numberStyle;
      } else {
        nightPriceCell.value = '';
        nightPriceCell.style = dataStyle;
      }

      const dailyRoomCell = row.getCell(6);
      dailyRoomCell.value = dailyRooms[i]?.roomNumber || '';
      dailyRoomCell.style = dataStyleCenter;

      const dailyPriceCell = row.getCell(7);
      if (dailyRooms[i]?.unitPrice) {
        dailyPriceCell.value = dailyRooms[i].unitPrice;
        dailyPriceCell.style = numberStyle;
      } else {
        dailyPriceCell.value = '';
        dailyPriceCell.style = dataStyle;
      }

      // Add NGƯỜI NHẬN on first data row
      if (i === 0) {
        row.getCell(9).value = 'NGƯỜI NHẬN';
        row.getCell(9).style = signerStyle;
      } else if (i === 1) {
        row.getCell(9).value = report.receiverName || '';
        row.getCell(9).style = signerDataStyle;
      }

      currentRow++;
    }

    // ========== EXPORT FILE ==========
    const buffer = await workbook.xlsx.writeBuffer();
    const fileName = `BaoCaoCa_${this.formatDate(report.shiftDate)}_${report.shiftType}.xlsx`;
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    saveAs(blob, fileName);
  }

  private getBorder(): any {
    return {
      top: { style: 'thin' as const },
      bottom: { style: 'thin' as const },
      left: { style: 'thin' as const },
      right: { style: 'thin' as const },
    };
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
