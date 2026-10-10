import * as ExcelJS from 'exceljs';
import { DrinkStock, ShiftReportResponse } from '../types/shift-report-type';
import { ExcelExportService } from './excel-report.service';
import { PrintService } from './print.service';

describe('Shift report drink payment exports', () => {
  const report: ShiftReportResponse = {
    Id: 1,
    ShiftDate: '2026-10-10',
    ShiftType: 'Ca ngày',
    StartTime: '2026-10-10T07:00:00',
    EndTime: '2026-10-10T19:00:00',
    ReceptionistName: 'Huy',
    ReceiverName: 'Thắng',
    HandoverNote: 'Bàn giao <đủ> & đúng\nKiểm tra két tiền',
    TotalCash: 3000000,
    TotalTransfer: 500000,
    TotalExpense: 100000,
    HandoverAmount: 2965000,
    CreatedAt: '2026-10-10',
    Transactions: [
      {
        OrderNumber: 1,
        CashAmount: 3000000,
        TransferAmount: 500000,
        ExpenseAmount: 100000,
        IsUseExpenseForReportRevenue: true,
      },
    ],
    RoomSales: [],
    DrinkSales: [
      {
        ProductCode: 'cola',
        ProductName: 'Coca Cola',
        Unit: 'lon',
        Quantity: 2,
        UnitPrice: 20000,
        PaymentMethod: 'Tiền mặt',
      },
      {
        ProductCode: 'cola',
        ProductName: 'Coca Cola',
        Unit: 'lon',
        Quantity: 1,
        UnitPrice: 22000,
        PaymentMethod: 'Chuyển khoản',
      },
      {
        ProductCode: 'cola',
        ProductName: 'Coca Cola',
        Unit: 'lon',
        Quantity: 1,
        UnitPrice: 18000,
        PaymentMethod: 'Chuyển khoản',
      },
      {
        ProductCode: 'removed',
        ProductName: 'Sản phẩm cũ',
        Unit: 'lon',
        Quantity: 1,
        UnitPrice: 25000,
        PaymentMethod: 'Tiền mặt',
      },
    ],
  };
  const stocks: DrinkStock[] = [
    {
      ProductCode: 'cola',
      ProductName: 'Coca Cola',
      Unit: 'lon',
      UnitPrice: 20000,
      StockIn: 20,
      SoldQuantity: 4,
      Remaining: 16,
    },
    {
      ProductCode: 'bull',
      ProductName: 'Bò húc',
      Unit: 'lon',
      UnitPrice: 25000,
      StockIn: 15,
      SoldQuantity: 0,
      Remaining: 15,
    },
  ];
  const expectedRows = [
    ['Coca Cola', 4, 20000, 40000, 40000, 80000, 16],
    ['Bò húc', 0, 25000, 0, 0, 0, 15],
    ['Sản phẩm cũ', 1, 25000, 25000, 0, 25000, ''],
    ['TỔNG', '', '', 65000, 40000, 105000, ''],
  ];
  const headers = [
    'Sản phẩm',
    'SL bán',
    'Giá',
    'Tiền mặt',
    'Chuyển khoản',
    'Thành tiền',
    'Còn lại',
  ];

  it('prints separate payments and totals while preserving stock and historical products', () => {
    const html = (new PrintService() as any).generatePrintHTML(report, stocks);
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const table = doc.querySelector('.drink-sales-table table')!;
    expect(doc.querySelector('.handover-note-content')?.textContent).toBe(
      report.HandoverNote
    );
    expect(doc.querySelector('.total-row')?.textContent).toContain('3,000,000');
    expect(doc.querySelector('.total-row')?.textContent).toContain('500,000');
    expect(doc.querySelector('.total-row')?.textContent).toContain('2,965,000');
    expect(
      Array.from(table.querySelectorAll('th'), cell => cell.textContent?.trim())
    ).toEqual(headers);
    const rows = Array.from(table.querySelectorAll('tbody tr'), row =>
      Array.from(row.querySelectorAll('td'), cell => cell.textContent?.trim())
    );
    expect(rows).toEqual(
      expectedRows.map(row =>
        row.map(value =>
          typeof value === 'number' ? value.toLocaleString('en-US') : value
        )
      )
    );
  });

  it('writes numeric payment columns and totals into a readable Excel workbook', async () => {
    let workbook!: ExcelJS.Workbook;
    let serialize!: () => ReturnType<ExcelJS.Workbook['xlsx']['writeBuffer']>;
    const originalAddWorksheet = ExcelJS.Workbook.prototype.addWorksheet;
    const worksheetSpy = spyOn(
      ExcelJS.Workbook.prototype,
      'addWorksheet'
    ).and.callFake(function (this: ExcelJS.Workbook, name, options) {
      workbook = this;
      const sheet = originalAddWorksheet.call(this, name, options);
      serialize = this.xlsx.writeBuffer.bind(this.xlsx);
      // Capture the generated workbook without downloading a file in the test.
      spyOn(this.xlsx, 'writeBuffer').and.rejectWith('skip download');
      return sheet;
    });
    await expectAsync(
      new ExcelExportService().exportShiftReport(report, stocks)
    ).toBeRejectedWith('skip download');
    expect(workbook).toBeDefined();
    worksheetSpy.and.callThrough();
    const loaded = new ExcelJS.Workbook();
    await loaded.xlsx.load(await serialize());
    const sheet = loaded.worksheets[0];
    expect(sheet.getCell('F6').value).toBe(3000000);
    expect(sheet.getCell('G6').value).toBe(500000);
    expect(sheet.getCell('K6').value).toBe(2965000);
    const values: ExcelJS.CellValue[] = [];
    sheet.eachRow(row => row.eachCell(cell => values.push(cell.value)));
    expect(values).toContain(report.HandoverNote!);
    expect(values).toContain(report.ReceiverName!);
    let headerRow = 0;
    sheet.eachRow(row => {
      if (row.getCell(1).value === 'Sản phẩm') headerRow = row.number;
    });
    expect(headerRow).toBeGreaterThan(0);
    expect(
      Array.from(
        { length: 7 },
        (_, i) => sheet.getRow(headerRow).getCell(i + 1).value
      )
    ).toEqual(headers);
    expectedRows.forEach((expected, i) => {
      const row = sheet.getRow(headerRow + 1 + i);
      expect(
        Array.from({ length: 7 }, (_, col) => row.getCell(col + 1).value)
      ).toEqual(expected);
      for (const col of [4, 5, 6])
        expect(row.getCell(col).numFmt).toBe('#,##0');
    });
  });
});
