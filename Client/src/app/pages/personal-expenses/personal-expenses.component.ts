import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, NgForm } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { addMonths, format, parseISO } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ExpenseRequest, ExpenseTransaction, PersonalExpensesService } from '../../services/personal-expenses.service';
import { LookupItem, LookupListService } from '../../services/lookup-list.service';
import { buildExpenseReportHtml } from './expense-report';

// Danh mục là danh sách riêng của từng người (LookupList, quản lý ở trang cá nhân -
// tab Danh mục). Giao dịch lưu CategoryCode; cột Category chỉ là bản chụp tên lúc lưu.
@Component({ selector: 'app-personal-expenses', standalone: true, imports: [CommonModule, FormsModule, NzIconModule, TranslateModule, RouterLink], templateUrl: './personal-expenses.component.html', styleUrl: './personal-expenses.component.scss' })
export class PersonalExpensesComponent implements OnInit {
  @ViewChild('editor') editor?: ElementRef<HTMLDialogElement>;
  private readonly api = inject(PersonalExpensesService);
  private readonly destroy = inject(DestroyRef);
  private readonly translate = inject(TranslateService);
  private readonly lookups = inject(LookupListService);
  private request?: Subscription;
  readonly manageCategoriesLink = { tab: 'lookups', list: 'EXPENSE_CATEGORY' };
  month = format(new Date(), 'yyyy-MM');
  transactions: ExpenseTransaction[] = [];
  /** Cả mục đã ẩn, để giao dịch cũ vẫn hiện đúng tên, màu */
  categoryItems: LookupItem[] = [];
  filter = '';
  loading = false;
  loadError = '';
  categoryError = '';
  formError = '';
  exportError = '';
  saving = false;
  editing = false;
  draft: ExpenseTransaction = this.empty();
  amountText = '';

  ngOnInit(): void { this.load(); this.loadCategories(); }
  get income(): bigint { return this.transactions.filter(x => x.Type === 'income').reduce((sum, x) => sum + BigInt(x.Amount), 0n); }
  get expense(): bigint { return this.transactions.filter(x => x.Type === 'expense').reduce((sum, x) => sum + BigInt(x.Amount), 0n); }
  get filtered(): ExpenseTransaction[] { return this.filter ? this.transactions.filter(x => this.codeOf(x) === this.filter) : this.transactions; }
  /** Bộ lọc: danh mục đang bật, cộng danh mục đã ẩn nhưng có giao dịch trong tháng. */
  get filterOptions(): LookupItem[] {
    const used = new Set(this.transactions.map(x => this.codeOf(x)));
    return this.categoryItems.filter(item => item.FlagActive || used.has(item.Code));
  }
  /** Dropdown trong form: đúng loại Thu/Chi đang chọn, kèm danh mục hiện tại nếu đã bị ẩn. */
  get categoryOptions(): LookupItem[] {
    return this.categoryItems.filter(item =>
      (item.FlagActive || item.Code === this.draft.CategoryCode) && (item.Kind === 'both' || item.Kind === this.draft.Type));
  }
  get breakdown(): { code: string; name: string; color: string; amount: bigint; percent: number }[] {
    const groups = new Map<string, { name: string; amount: bigint }>();
    for (const item of this.transactions) {
      if (item.Type !== 'expense') continue;
      const code = this.codeOf(item);
      const group = groups.get(code) ?? { name: this.categoryLabel(item), amount: 0n };
      group.amount += BigInt(item.Amount);
      groups.set(code, group);
    }
    const total = this.expense;
    return [...groups].map(([code, group]) => ({ code, name: group.name, color: this.categoryColor(code), amount: group.amount, percent: total ? Number(group.amount) * 100 / Number(total) : 0 }))
      .sort((a, b) => a.amount === b.amount ? 0 : a.amount > b.amount ? -1 : 1);
  }
  get monthLabel(): string {
    const [year, month] = this.month.split('-');
    return this.translate.instant('T_EXPENSES_MONTH_TITLE', { month: Number(month), monthName: format(parseISO(`${this.month}-01`), 'LLLL', { locale: enUS }), year });
  }
  /** Tên danh mục theo ngôn ngữ đang chọn; không tìm thấy mã thì dùng tên đã chụp lúc lưu. */
  categoryLabel(item: Pick<ExpenseTransaction, 'CategoryCode' | 'Category'>): string {
    return this.lookups.name(this.categoryItems.find(x => x.Code === item.CategoryCode)) || item.Category || item.CategoryCode;
  }
  itemLabel(item: LookupItem): string { return this.lookups.name(item); }
  categoryColor(code: string): string { return this.categoryItems.find(x => x.Code === code)?.Color ?? ''; }
  /** Đổi Thu/Chi thì bỏ danh mục không còn hợp loại. */
  changeType(type: 'income' | 'expense'): void {
    this.draft.Type = type;
    if (!this.categoryOptions.some(item => item.Code === this.draft.CategoryCode)) this.draft.CategoryCode = '';
  }
  money(value: number | bigint): string { return `${new Intl.NumberFormat('vi-VN').format(value)} đ`; }
  changeMonth(delta: number): void { this.month = format(addMonths(parseISO(`${this.month}-01`), delta), 'yyyy-MM'); this.filter = ''; this.load(); }
  load(): void {
    this.request?.unsubscribe(); this.loading = true; this.loadError = ''; this.transactions = [];
    this.request = this.api.list(this.month).pipe(takeUntilDestroyed(this.destroy)).subscribe({
      next: items => { this.transactions = items; this.loading = false; },
      error: () => { this.loading = false; this.loadError = 'T_EXPENSES_LOAD_ERROR'; },
    });
  }
  loadCategories(): void {
    this.lookups.list('EXPENSE_CATEGORY', true).pipe(takeUntilDestroyed(this.destroy)).subscribe({
      next: items => { this.categoryItems = items; this.categoryError = ''; },
      error: () => { this.categoryError = 'T_EXPENSES_CATEGORIES_ERROR'; },
    });
  }
  /** Mở báo cáo A4 của cả tháng (không theo bộ lọc) trong cửa sổ in; người dùng chọn "Lưu dưới dạng PDF". */
  exportPdf(): void {
    if (this.loading || this.loadError) return;
    const report = window.open('', '_blank', 'width=900,height=1000');
    if (!report) { this.exportError = 'T_EXPENSES_POPUP_BLOCKED'; return; }
    this.exportError = '';
    // Báo cáo nhận sẵn tên danh mục theo ngôn ngữ đang chọn
    const rows = this.transactions.map(item => ({ ...item, Category: this.categoryLabel(item) }));
    report.document.write(buildExpenseReportHtml(this.month, rows, (key, params) => this.translate.instant(key, params)));
    report.document.close();
    report.focus();
    // Đợi font tải xong để bản PDF không bị nhảy chữ
    report.document.fonts.ready.then(() => report.print());
  }
  openCreate(): void { this.editing = false; this.formError = ''; this.draft = this.empty(); this.amountText = ''; this.editor?.nativeElement.showModal(); }
  openEdit(item: ExpenseTransaction): void { this.editing = true; this.formError = ''; this.draft = { ...item }; this.amountText = this.formatAmount(String(item.Amount)); this.editor?.nativeElement.showModal(); }
  onAmountInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const raw = input.value;
    if (!/^[\d.\s]*(?:đ)?\s*$/i.test(raw)) {
      this.amountText = raw; this.draft.Amount = NaN; return;
    }
    const caret = input.selectionStart ?? raw.length;
    const digitsBeforeCaret = (raw.slice(0, caret).match(/\d/g) || []).length;
    const digits = raw.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
    const formatted = this.formatAmount(digits);
    this.amountText = formatted;
    this.draft.Amount = digits ? Number(digits) : 0;
    input.value = formatted;
    let index = 0, count = 0;
    while (index < formatted.length && count < digitsBeforeCaret) {
      if (/\d/.test(formatted[index])) count++;
      index++;
    }
    input.setSelectionRange(index, index);
  }
  private formatAmount(digits: string): string { return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  close(): void { if (!this.saving) this.editor?.nativeElement.close(); }
  save(form: NgForm): void {
    if (this.saving) return;
    if (form.invalid || !this.draft.CategoryCode || !Number.isSafeInteger(this.draft.Amount) || this.draft.Amount < 1 || this.draft.Amount > 1_000_000_000_000) { this.formError = 'T_EXPENSES_FORM_INVALID'; return; }
    const { Id, ...data } = this.draft;
    this.saving = true; this.formError = '';
    const request = this.editing ? this.api.update(Id, data as ExpenseRequest) : this.api.create(data as ExpenseRequest);
    request.pipe(takeUntilDestroyed(this.destroy)).subscribe({
      next: saved => { this.saving = false; this.editor?.nativeElement.close(); this.month = saved.Date.slice(0, 7); this.filter = ''; this.load(); },
      error: (e: HttpErrorResponse) => { this.saving = false; this.formError = e.status === 409 ? 'T_EXPENSES_SAVE_CONFLICT' : 'T_EXPENSES_SAVE_ERROR'; },
    });
  }
  remove(): void {
    if (this.saving || !this.editing || !window.confirm(this.translate.instant('T_EXPENSES_DELETE_CONFIRM'))) return;
    this.saving = true; this.formError = '';
    this.api.delete(this.draft.Id, this.draft.Version).pipe(takeUntilDestroyed(this.destroy)).subscribe({
      next: () => { this.saving = false; this.editor?.nativeElement.close(); this.load(); },
      error: (e: HttpErrorResponse) => { this.saving = false; this.formError = e.status === 409 ? 'T_EXPENSES_DELETE_CONFLICT' : 'T_EXPENSES_DELETE_ERROR'; },
    });
  }
  private empty(): ExpenseTransaction {
    const today = format(new Date(), 'yyyy-MM-dd');
    return { Id: '', Type: 'expense', Amount: 0, Date: today.startsWith(this.month) ? today : `${this.month}-01`, Category: '', CategoryCode: '', Note: '', Version: 0 };
  }
  // Giao dịch rất cũ chưa có mã thì nhóm theo tên đã lưu
  private codeOf(item: ExpenseTransaction): string { return item.CategoryCode || item.Category; }
}
