import { ExpenseTransaction } from '../../services/personal-expenses.service';

/*
  Báo cáo thu chi một tháng, dạng trang A4 để in / "Lưu dưới dạng PDF".
  Cùng cách với báo cáo ca (shift-report/print.service.ts): dựng HTML rồi mở cửa
  sổ in của trình duyệt - không cần thư viện PDF, tiếng Việt hiển thị đúng font hệ thống.

  Cửa sổ in cùng origin với trang, nên MỌI chuỗi người dùng nhập (danh mục, ghi
  chú) phải đi qua escape() để không chèn được HTML/script.
*/

const money = (value: number | bigint): string => `${new Intl.NumberFormat('vi-VN').format(value)} đ`;
const percent = (value: number): string => `${new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value)}%`;
const day = (iso: string): string => iso.slice(0, 10).split('-').reverse().join('/');
const pad = (value: number): string => String(value).padStart(2, '0');

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

export function buildExpenseReportHtml(month: string, transactions: ExpenseTransaction[], exportedAt = new Date()): string {
  const [year, monthNumber] = month.split('-').map(Number);
  const monthLabel = `${pad(monthNumber)}/${year}`;
  const lastDay = new Date(year, monthNumber, 0).getDate();
  const data = summarizeExpenseReport(transactions);
  const balance = data.income - data.expense;
  const gap = balance < 0n ? -balance : balance;
  const verdict =
    balance < 0n ? `Tổng chi cao hơn tổng thu ${money(gap)} trong kỳ.`
    : balance > 0n ? `Tổng thu cao hơn tổng chi ${money(gap)} trong kỳ.`
    : 'Tổng thu và tổng chi cân bằng trong kỳ.';

  const categoryRows = data.categories.length
    ? data.categories.map(c => `
        <div class="category">
          <strong>${escapeHtml(c.name)}</strong>
          <span class="bar"><span style="width:${c.bar.toFixed(2)}%"></span></span>
          <span class="num">${money(c.amount)}</span>
          <span class="share">${percent(c.share)}</span>
        </div>`).join('')
    : '<p class="empty">Chưa có khoản chi trong tháng.</p>';

  const transactionRows = data.rows.length
    ? data.rows.map(t => `
        <tr>
          <td>${day(t.Date)}</td>
          <td>${escapeHtml(t.Category)}</td>
          <td class="note">${escapeHtml(t.Note) || '<span class="muted">—</span>'}</td>
          <td class="num income">${t.Type === 'income' ? money(t.Amount) : '<span class="muted">-</span>'}</td>
          <td class="num expense">${t.Type === 'expense' ? money(t.Amount) : '<span class="muted">-</span>'}</td>
        </tr>`).join('')
    : '<tr><td colspan="5" class="empty">Chưa có giao dịch trong tháng.</td></tr>';

  const exportedLabel = `${pad(exportedAt.getDate())}/${pad(exportedAt.getMonth() + 1)}/${exportedAt.getFullYear()}`;

  return `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8" />
<title>Bao-cao-thu-chi-thang-${pad(monthNumber)}-${year}</title>
<style>
  @page {
    size: A4;
    margin: 16mm 15mm 18mm;
    @bottom-left { content: "BÁO CÁO THU CHI  ·  THÁNG ${monthLabel}"; font: 700 7.5pt 'Segoe UI', Roboto, Arial, sans-serif; color: #7b7f99; letter-spacing: .04em; }
    @bottom-right { content: "Trang " counter(page) " / " counter(pages); font: 7.5pt 'Segoe UI', Roboto, Arial, sans-serif; color: #7b7f99; }
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
        <p class="eyebrow">THU CHI CÁ NHÂN</p>
        <h1>Báo cáo tháng ${monthLabel}</h1>
      </div>
    </div>
    <div class="unit">Đơn vị: VNĐ</div>
  </header>
  <div class="period">
    <span>Kỳ báo cáo: 01/${monthLabel} - ${pad(lastDay)}/${monthLabel}</span>
    <span>Ngày xuất: ${exportedLabel}</span>
  </div>

  <section>
    <div class="section-head"><h2>Tổng quan trong tháng</h2></div>
    <div class="cards">
      <div class="card in"><span>Tổng thu</span><strong>${money(data.income)}</strong></div>
      <div class="card out"><span>Tổng chi</span><strong>${money(data.expense)}</strong></div>
      <div class="card diff"><span>Chênh lệch</span><strong>${money(balance)}</strong></div>
    </div>
    <p class="verdict">${verdict}</p>
  </section>

  <section>
    <div class="section-head"><h2>Chi tiêu theo danh mục</h2><span class="hint">Tỷ trọng trên tổng chi</span></div>
    ${categoryRows}
  </section>

  <section>
    <div class="section-head"><h2>Chi tiết giao dịch</h2><span class="hint">${data.rows.length} giao dịch</span></div>
    <table>
      <thead><tr><th style="width:17mm">Ngày</th><th style="width:30mm">Danh mục</th><th>Nội dung</th><th class="num" style="width:26mm">Thu</th><th class="num" style="width:26mm">Chi</th></tr></thead>
      <tbody>${transactionRows}</tbody>
      ${data.rows.length ? `<tfoot><tr><td colspan="3">Tổng cộng</td><td class="num income">${money(data.income)}</td><td class="num expense">${money(data.expense)}</td></tr></tfoot>` : ''}
    </table>
  </section>

  <p class="footnote">Chênh lệch = Tổng thu - Tổng chi; không thể hiện số dư đầu kỳ.</p>
</main>
</body>
</html>`;
}
