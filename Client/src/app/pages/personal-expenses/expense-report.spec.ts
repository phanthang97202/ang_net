import { ExpenseTransaction } from '../../services/personal-expenses.service';
import { buildExpenseReportHtml, summarizeExpenseReport } from './expense-report';

const tx = (Id: string, Type: 'income' | 'expense', Amount: number, Date: string, Category: string, Note = ''): ExpenseTransaction =>
  ({ Id, Type, Amount, Date, Category, Note, Version: 1 });

describe('Expense report', () => {
  // API trả giao dịch mới nhất trước
  const items = [
    tx('3', 'expense', 1_500_000, '2026-10-10', 'Nhà ở', 'Tiền trọ'),
    tx('2', 'expense', 2_000_000, '2026-10-05', 'Sức khỏe'),
    tx('1', 'income', 1_650_000, '2026-10-01', 'Lương'),
  ];

  it('summarizes the whole month with shares and relative bars', () => {
    const data = summarizeExpenseReport(items);
    expect(data.income).toBe(1_650_000n);
    expect(data.expense).toBe(3_500_000n);
    expect(data.categories.map(c => c.name)).toEqual(['Sức khỏe', 'Nhà ở']);
    expect(data.categories[0].bar).toBe(100);
    expect(data.categories[1].share).toBeCloseTo(42.86, 1);
    expect(data.rows.map(r => r.Id)).toEqual(['1', '2', '3']);
  });

  it('renders the A4 report with period, verdict and totals', () => {
    const html = buildExpenseReportHtml('2026-10', items, new Date(2026, 9, 27));
    expect(html).toContain('Báo cáo tháng 10/2026');
    expect(html).toContain('Kỳ báo cáo: 01/10/2026 - 31/10/2026');
    expect(html).toContain('Ngày xuất: 27/10/2026');
    expect(html).toContain('Tổng chi cao hơn tổng thu 1.850.000 đ trong kỳ.');
    expect(html).toContain('3 giao dịch');
  });

  it('escapes user-entered category and note', () => {
    const html = buildExpenseReportHtml('2026-10', [tx('1', 'expense', 1000, '2026-10-02', '<b>x</b>', '<img src=x onerror=alert(1)>')]);
    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(html).toContain('&lt;b&gt;x&lt;/b&gt;');
  });
});
