import { ExpenseTransaction } from '../../services/personal-expenses.service';

/*
  Báo cáo thu chi một tháng, dạng trang A4 để in / "Lưu dưới dạng PDF".
  Cùng cách với báo cáo ca (shift-report/print.service.ts): dựng HTML rồi mở cửa
  sổ in của trình duyệt - không cần thư viện PDF, tiếng Việt hiển thị đúng font hệ thống.

  Cửa sổ in cùng origin với trang, nên MỌI chuỗi người dùng nhập (danh mục, ghi
  chú) phải đi qua escape() để không chèn được HTML/script.

  Chữ trên báo cáo lấy qua hàm dịch t (TranslateService.instant) nên báo cáo theo
  ngôn ngữ đang chọn. Số tiền giữ định dạng VND (1.650.000 đ) ở cả hai ngôn ngữ.
*/

export type ReportTranslate = (key: string, params?: Record<string, unknown>) => string;

const money = (value: number | bigint): string => `${new Intl.NumberFormat('vi-VN').format(value)} đ`;
const percent = (value: number): string => `${new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value)}%`;
const day = (iso: string): string => iso.slice(0, 10).split('-').reverse().join('/');
const pad = (value: number): string => String(value).padStart(2, '0');
// Chuỗi đặt trong content: "..." của CSS (chân trang @page)
const cssString = (value: string): string => `"${value.replace(/[\\"]/g, c => '\\' + c).replace(/\n/g, ' ')}"`;

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

export interface ExpenseReportData {
  income: bigint;
  expense: bigint;
  categories: { name: string; amount: bigint; share: number; bar: number }[];
  rows: ExpenseTransaction[];
}

/** Tổng hợp số liệu của cả tháng (không theo bộ lọc danh mục đang chọn trên màn hình). */
export function summarizeExpenseReport(transactions: ExpenseTransaction[]): ExpenseReportData {
  let income = 0n;
  let expense = 0n;
  const groups = new Map<string, bigint>();
  for (const item of transactions) {
    const amount = BigInt(item.Amount);
    if (item.Type === 'income') income += amount;
    else {
      expense += amount;
      groups.set(item.Category, (groups.get(item.Category) ?? 0n) + amount);
    }
  }
  const sorted = [...groups].sort((a, b) => (a[1] === b[1] ? 0 : a[1] > b[1] ? -1 : 1));
  const largest = sorted.length ? Number(sorted[0][1]) : 0;
  return {
    income,
    expense,
    // share: tỷ trọng trên tổng chi; bar: độ dài thanh so với danh mục chi nhiều nhất
    categories: sorted.map(([name, amount]) => ({
      name,
      amount,
      share: expense ? (Number(amount) * 100) / Number(expense) : 0,
      bar: largest ? (Number(amount) * 100) / largest : 0,
    })),
    // API trả mới nhất trước; báo cáo đọc theo thời gian nên đảo lại
    rows: [...transactions].reverse(),
  };
}

export function buildExpenseReportHtml(
  month: string,
  transactions: ExpenseTransaction[],
  t: ReportTranslate,
  categoryLabel: (name: string) => string = name => name,
  exportedAt = new Date()
): string {
  const [year, monthNumber] = month.split('-').map(Number);
  const monthLabel = `${pad(monthNumber)}/${year}`;
  const lastDay = new Date(year, monthNumber, 0).getDate();
  const data = summarizeExpenseReport(transactions);
  const balance = data.income - data.expense;
  const gap = balance < 0n ? -balance : balance;
  const verdict = t(
    balance < 0n ? 'T_EXPENSES_REPORT_MORE_EXPENSE' : balance > 0n ? 'T_EXPENSES_REPORT_MORE_INCOME' : 'T_EXPENSES_REPORT_EVEN',
    { amount: money(gap) }
  );

  const categoryRows = data.categories.length
    ? data.categories.map(c => `
        <div class="category">
          <strong>${escapeHtml(categoryLabel(c.name))}</strong>
          <span class="bar"><span style="width:${c.bar.toFixed(2)}%"></span></span>
          <span class="num">${money(c.amount)}</span>
          <span class="share">${percent(c.share)}</span>
        </div>`).join('')
    : `<p class="empty">${escapeHtml(t('T_EXPENSES_NO_SPENDING'))}</p>`;

  const transactionRows = data.rows.length
    ? data.rows.map(row => `
        <tr>
          <td>${day(row.Date)}</td>
          <td>${escapeHtml(categoryLabel(row.Category))}</td>
          <td class="note">${escapeHtml(row.Note) || '<span class="muted">—</span>'}</td>
          <td class="num income">${row.Type === 'income' ? money(row.Amount) : '<span class="muted">-</span>'}</td>
          <td class="num expense">${row.Type === 'expense' ? money(row.Amount) : '<span class="muted">-</span>'}</td>
        </tr>`).join('')
    : `<tr><td colspan="5" class="empty">${escapeHtml(t('T_EXPENSES_EMPTY_MONTH'))}</td></tr>`;

  const exportedLabel = `${pad(exportedAt.getDate())}/${pad(exportedAt.getMonth() + 1)}/${exportedAt.getFullYear()}`;
  // Chữ cố định của báo cáo: escape dù là bản dịch của mình, cho chắc
  const text = (key: string, params?: Record<string, unknown>): string => escapeHtml(t(key, params));

  return `<!doctype html>
<html lang="${escapeHtml(t('T_EXPENSES_REPORT_LANG'))}">
<head>
<meta charset="utf-8" />
<title>${text('T_EXPENSES_REPORT_FILENAME', { month: pad(monthNumber), year })}</title>
<style>
  @page {
    size: A4;
    margin: 16mm 15mm 18mm;
    @bottom-left { content: ${cssString(t('T_EXPENSES_REPORT_FOOTER', { month: monthLabel }))}; font: 700 7.5pt 'Segoe UI', Roboto, Arial, sans-serif; color: #7b7f99; letter-spacing: .04em; }
    @bottom-right { content: ${cssString(t('T_EXPENSES_REPORT_PAGE') + ' ')} counter(page) " / " counter(pages); font: 7.5pt 'Segoe UI', Roboto, Arial, sans-serif; color: #7b7f99; }
  }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  html { background: #fff; }
  body { margin: 0; color: #1d1d35; font: 9.5pt/1.45 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
  .sheet { max-width: 180mm; margin: 0 auto; }
  @media screen { body { background: #eef0f6; } .sheet { margin: 24px auto; padding: 16mm 15mm; background: #fff; box-shadow: 0 8px 30px rgba(0,0,0,.08); } }

  header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
  .brand { display: flex; align-items: center; gap: 12px; }
  .logo { display: grid; width: 38px; height: 38px; place-items: center; border-radius: 9px; background: #5b4ee8; color: #fff; font-size: 17pt; font-weight: 700; }
  .eyebrow { margin: 0; color: #5b4ee8; font-size: 8pt; font-weight: 700; letter-spacing: .06em; }
  h1 { margin: 2px 0 0; font-size: 18pt; line-height: 1.15; }
  .unit { color: #7b7f99; font-size: 8pt; text-align: right; }
  .period { display: flex; justify-content: space-between; margin: 14px 0 0; padding-bottom: 10px; border-bottom: 1px solid #e4e6ef; color: #7b7f99; font-size: 8pt; }

  section { margin-top: 18px; }
  .section-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 10px; }
  h2 { margin: 0; font-size: 9pt; font-weight: 700; letter-spacing: .03em; text-transform: uppercase; }
  .hint { color: #7b7f99; font-size: 7.5pt; }

  .cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 9px; }
  .card { padding: 12px 14px; border: 1px solid; border-radius: 9px; }
  .card span { display: block; color: #6b6f88; font-size: 7.5pt; font-weight: 600; }
  .card strong { display: block; margin-top: 4px; font-size: 13pt; }
  .card.in { border-color: #d5ebe4; background: #f2f9f6; } .card.in strong { color: #1e8a6c; }
  .card.out { border-color: #f4dcdf; background: #fdf4f5; } .card.out strong { color: #cf4b5e; }
  .card.diff { border-color: #e2defb; background: #f5f3ff; } .card.diff strong { color: #5b4ee8; }
  .verdict { margin: 9px 0 0; color: #6b6f88; font-size: 8pt; }

  .category { display: grid; grid-template-columns: 30% 1fr 25mm 13mm; align-items: center; gap: 10px; padding: 6px 0; break-inside: avoid; }
  .category strong { font-size: 8.5pt; }
  .bar { display: block; height: 5px; border-radius: 5px; background: #ebe9fb; overflow: hidden; }
  .bar span { display: block; height: 100%; border-radius: inherit; background: #5b4ee8; }
  .share { color: #7b7f99; text-align: right; }

  table { width: 100%; border-collapse: collapse; font-size: 8pt; }
  thead th { padding: 8px; background: #f4f5f9; color: #6b6f88; font-weight: 600; text-align: left; }
  thead th:first-child { border-radius: 7px 0 0 7px; } thead th:last-child { border-radius: 0 7px 7px 0; }
  tbody td { padding: 8px; border-bottom: 1px solid #eceef4; vertical-align: top; }
  tr { break-inside: avoid; }
  .num { text-align: right; white-space: nowrap; }
  .income { color: #1e8a6c; font-weight: 700; } .expense { color: #cf4b5e; font-weight: 700; }
  .note { overflow-wrap: anywhere; }
  .muted { color: #a3a6ba; font-weight: 400; }
  /* Mặc định tfoot lặp lại ở mọi trang in; dòng tổng chỉ nên có ở cuối bảng */
  tfoot { display: table-row-group; }
  tfoot td { padding: 9px 8px; font-weight: 700; }
  .empty { color: #7b7f99; text-align: center; }

  .footnote { margin-top: 18px; color: #7b7f99; font-size: 7.5pt; }
</style>
</head>
<body>
<main class="sheet">
  <header>
    <div class="brand">
      <span class="logo">₫</span>
      <div>
        <p class="eyebrow">${text('T_EXPENSES_REPORT_EYEBROW')}</p>
        <h1>${text('T_EXPENSES_REPORT_TITLE', { month: monthLabel })}</h1>
      </div>
    </div>
    <div class="unit">${text('T_EXPENSES_REPORT_UNIT')}</div>
  </header>
  <div class="period">
    <span>${text('T_EXPENSES_REPORT_PERIOD', { from: `01/${monthLabel}`, to: `${pad(lastDay)}/${monthLabel}` })}</span>
    <span>${text('T_EXPENSES_REPORT_EXPORTED', { date: exportedLabel })}</span>
  </div>

  <section>
    <div class="section-head"><h2>${text('T_EXPENSES_REPORT_OVERVIEW')}</h2></div>
    <div class="cards">
      <div class="card in"><span>${text('T_EXPENSES_TOTAL_INCOME')}</span><strong>${money(data.income)}</strong></div>
      <div class="card out"><span>${text('T_EXPENSES_TOTAL_EXPENSE')}</span><strong>${money(data.expense)}</strong></div>
      <div class="card diff"><span>${text('T_EXPENSES_BALANCE')}</span><strong>${money(balance)}</strong></div>
    </div>
    <p class="verdict">${escapeHtml(verdict)}</p>
  </section>

  <section>
    <div class="section-head"><h2>${text('T_EXPENSES_BY_CATEGORY')}</h2><span class="hint">${text('T_EXPENSES_REPORT_SHARE_HINT')}</span></div>
    ${categoryRows}
  </section>

  <section>
    <div class="section-head"><h2>${text('T_EXPENSES_REPORT_DETAILS')}</h2><span class="hint">${text('T_EXPENSES_TRANSACTION_COUNT', { count: data.rows.length })}</span></div>
    <table>
      <thead><tr><th style="width:17mm">${text('T_EXPENSES_REPORT_COL_DATE')}</th><th style="width:30mm">${text('T_EXPENSES_REPORT_COL_CATEGORY')}</th><th>${text('T_EXPENSES_REPORT_COL_NOTE')}</th><th class="num" style="width:26mm">${text('T_EXPENSES_REPORT_COL_INCOME')}</th><th class="num" style="width:26mm">${text('T_EXPENSES_REPORT_COL_EXPENSE')}</th></tr></thead>
      <tbody>${transactionRows}</tbody>
      ${data.rows.length ? `<tfoot><tr><td colspan="3">${text('T_EXPENSES_REPORT_TOTAL')}</td><td class="num income">${money(data.income)}</td><td class="num expense">${money(data.expense)}</td></tr></tfoot>` : ''}
    </table>
  </section>

  <p class="footnote">${text('T_EXPENSES_REPORT_FOOTNOTE')}</p>
</main>
</body>
</html>`;
}
