import { ExpenseTransaction } from '../../services/personal-expenses.service';
import { buildExpenseReportHtml, summarizeExpenseReport } from './expense-report';

const tx = (Id: string, Type: 'income' | 'expense', Amount: number, Date: string, Category: string, Note = ''): ExpenseTransaction =>
  ({ Id, Type, Amount, Date, Category, Note, Version: 1 });

// Hàm dịch giả: trả về khóa kèm tham số, để test kiểm tra đúng khóa + dữ liệu truyền vào
const t = (key: string, params?: Record<string, unknown>): string => (params ? `${key}${JSON.stringify(params)}` : key);

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

  it('renders period, verdict, totals and category labels through the translator', () => {
    const html = buildExpenseReportHtml('2026-10', items, t, name => (name === 'Nhà ở' ? 'Housing' : name), new Date(2026, 9, 27));
    expect(html).toContain('T_EXPENSES_REPORT_TITLE{&quot;month&quot;:&quot;10/2026&quot;}');
    expect(html).toContain('T_EXPENSES_REPORT_PERIOD{&quot;from&quot;:&quot;01/10/2026&quot;,&quot;to&quot;:&quot;31/10/2026&quot;}');
    expect(html).toContain('T_EXPENSES_REPORT_EXPORTED{&quot;date&quot;:&quot;27/10/2026&quot;}');
    expect(html).toContain('T_EXPENSES_REPORT_MORE_EXPENSE{&quot;amount&quot;:&quot;1.850.000 đ&quot;}');
    expect(html).toContain('T_EXPENSES_TRANSACTION_COUNT{&quot;count&quot;:3}');
    expect(html).toContain('<td>Housing</td>');
    // Chân trang đặt trong chuỗi CSS: dấu " phải được escape
    expect(html).toContain('content: "T_EXPENSES_REPORT_FOOTER{\\"month\\":\\"10/2026\\"}"');
  });

  it('escapes user-entered category and note', () => {
    const html = buildExpenseReportHtml('2026-10', [tx('1', 'expense', 1000, '2026-10-02', '<b>x</b>', '<img src=x onerror=alert(1)>')], t);
    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(html).toContain('&lt;b&gt;x&lt;/b&gt;');
  });
});
