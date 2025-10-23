import { Injectable } from '@angular/core';
import { ShiftReportResponse } from './../types/shift-report-type';
import { format } from 'date-fns';

@Injectable({
  providedIn: 'root',
})
export class PrintService {
  printShiftReport(report: ShiftReportResponse): void {
    const printWindow = window.open('', '_blank', 'width=1200,height=800');

    if (!printWindow) {
      alert('Vui lòng cho phép popup để in báo cáo');
      return;
    }

    const htmlContent = this.generatePrintHTML(report);

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Wait for content to load then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        // Auto close after print dialog is closed (optional)
        // printWindow.close();
      }, 250);
    };
  }

  private generatePrintHTML(report: ShiftReportResponse): string {
    const transactions = report.Transactions.map(
      (txn, index) => `
      <tr>
        ${index === 0 ? `<td rowspan="${report.Transactions.length}" class="center-cell">${report.ReceptionistName}</td>` : ''}
        <td class="center-cell">${index + 1}</td>
        <td class="center-cell">${txn.RoomNumber || ''}</td>
        <td class="center-cell">${txn.InvoiceCode || ''}</td>
        <td>${txn.CustomerType || ''}</td>
        <td class="number-cell">${txn.CashAmount ? this.formatNumber(txn.CashAmount) : ''}</td>
        <td class="number-cell">${txn.TransferAmount ? this.formatNumber(txn.TransferAmount) : ''}</td>
        <td>${txn.PrepaidNote || ''}</td>
        <td>${txn.ExpenseDescription || ''}</td>
        <td class="number-cell">${txn.ExpenseAmount ? this.formatNumber(txn.ExpenseAmount) : ''}</td>
        <td></td>
      </tr>
    `
    ).join('');

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
    const maxRoomRows = Math.max(
      hourlyRooms.length,
      nightRooms.length,
      dailyRooms.length,
      5
    );

    let roomSalesRows = '';
    for (let i = 0; i < maxRoomRows; i++) {
      roomSalesRows += `
        <tr>
          <td class="center-cell">${i + 1}</td>
          <td class="center-cell">${hourlyRooms[i]?.RoomNumber || ''}</td>
          <td class="number-cell">${hourlyRooms[i]?.UnitPrice ? this.formatNumber(hourlyRooms[i].UnitPrice) : ''}</td>
          <td class="center-cell">${nightRooms[i]?.RoomNumber || ''}</td>
          <td class="number-cell">${nightRooms[i]?.UnitPrice ? this.formatNumber(nightRooms[i].UnitPrice) : ''}</td>
          <td class="center-cell">${dailyRooms[i]?.RoomNumber || ''}</td>
          <td class="number-cell">${dailyRooms[i]?.UnitPrice ? this.formatNumber(dailyRooms[i].UnitPrice) : ''}</td>
        </tr>
      `;
    }

    const _stTime = format(new Date(report.StartTime), 'HH:mm').toString();
    const _eTime = format(new Date(report.EndTime), 'HH:mm').toString();

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Báo cáo ca - ${this.formatDate(report.ShiftDate)}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 15mm;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: Arial, sans-serif;
      font-size: 11pt;
      color: #000;
      background: #fff;
    }
    
    .container {
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .title {
      text-align: center;
      font-size: 16pt;
      font-weight: bold;
      margin-bottom: 5px;
      text-transform: uppercase;
    }
    
    .subtitle {
      text-align: center;
      font-size: 12pt;
      font-weight: bold;
      margin-bottom: 15px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 15px;
    }
    
    th, td {
      border: 1px solid #000;
      padding: 5px;
      vertical-align: middle;
    }
    
    th {
      background-color: #E7E6E6;
      font-weight: bold;
      text-align: center;
      font-size: 10pt;
    }
    
    td {
      font-size: 10pt;
    }
    
    .center-cell {
      text-align: center;
    }
    
    .number-cell {
      text-align: right;
    }
    
    .total-row {
      background-color: #FFFF00;
      font-weight: bold;
    }
    
    .room-sales-container {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-top: 15px;
    }
    
    .room-sales-table {
      width: 60%;
    }
    
    .signature-section {
      width: 35%;
      padding-left: 20px;
    }
    
    .signature-box {
      text-align: center;
      margin-bottom: 15px;
    }
    
    .signature-title {
      font-weight: bold;
      font-size: 11pt;
      margin-bottom: 5px;
    }
    
    .signature-name {
      font-size: 10pt;
    }
    
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Title -->
    <div class="title">BÁO CÁO THU TIỀN VÀ BÀN GIAO CA</div>
    <div class="subtitle">${report.ShiftType.toUpperCase()} ${this.formatDateTime(report.ShiftDate, _stTime, _eTime)}</div>
    
    <!-- Transaction Table -->
    <table>
      <thead>
        <tr>
          <th style="width: 10%;">Lễ tân</th>
          <th style="width: 5%;">STT</th>
          <th style="width: 7%;">Số phòng</th>
          <th style="width: 7%;">Mã phòng</th>
          <th style="width: 10%;">Loại khách</th>
          <th style="width: 10%;">TT Tiền mặt</th>
          <th style="width: 10%;">Chuyển khoản</th>
          <th style="width: 12%;">Đặt cọc TT trước</th>
          <th style="width: 15%;">ND chi tiêu</th>
          <th style="width: 10%;">Tiền chi tiêu</th>
          <th style="width: 10%;">Số tiền bàn giao</th>
        </tr>
      </thead>
      <tbody>
        ${transactions}
        <tr class="total-row">
          <td colspan="5"></td>
          <td class="number-cell">${this.formatNumber(report.TotalCash)}</td>
          <td class="number-cell">${this.formatNumber(report.TotalTransfer)}</td>
          <td></td>
          <td></td>
          <td class="number-cell">${this.formatNumber(report.TotalExpense)}</td>
          <td class="number-cell">${this.formatNumber(report.HandoverAmount)}</td>
        </tr>
      </tbody>
    </table>
    
    <!-- Room Sales and Signature -->
    <div class="room-sales-container">
      <!-- Room Sales Table -->
      <div class="room-sales-table">
        <div class="subtitle" style="text-align: left; margin-bottom: 10px;">
          Bán phòng ${report.ShiftType.toLowerCase()}
        </div>
        
        <table>
          <thead>
            <tr>
              <th rowspan="2" style="width: 10%;">STT</th>
              <th colspan="2">KHÁCH GIỜ</th>
              <th colspan="2">KHÁCH ĐÊM</th>
              <th colspan="2">KHÁCH NGÀY</th>
            </tr>
            <tr>
              <th style="width: 15%;">PHÒNG</th>
              <th style="width: 15%;">ĐƠN GIÁ</th>
              <th style="width: 15%;">PHÒNG</th>
              <th style="width: 15%;">ĐƠN GIÁ</th>
              <th style="width: 15%;">PHÒNG</th>
              <th style="width: 15%;">ĐƠN GIÁ</th>
            </tr>
          </thead>
          <tbody>
            ${roomSalesRows}
          </tbody>
        </table>
      </div>
      
      <!-- Signature Section -->
      <div class="signature-section">
        <div class="signature-box">
          <div class="signature-title">NGƯỜI GIAO</div>
          <div class="signature-name">${report.ReceptionistName}</div>
        </div>
        
        <div class="signature-box">
          <div class="signature-title">NGƯỜI NHẬN</div>
          <div class="signature-name">${report.ReceiverName || ''}</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
    `;
  }

  private formatNumber(num: number): string {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
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
