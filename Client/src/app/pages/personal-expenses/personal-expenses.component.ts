import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, NgForm } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { addMonths, format, parseISO } from 'date-fns';
import { Subscription } from 'rxjs';
import { ExpenseRequest, ExpenseTransaction, PersonalExpensesService } from '../../services/personal-expenses.service';
import { buildExpenseReportHtml } from './expense-report';

@Component({ selector: 'app-personal-expenses', standalone: true, imports: [CommonModule, FormsModule, NzIconModule], templateUrl: './personal-expenses.component.html', styleUrl: './personal-expenses.component.scss' })
export class PersonalExpensesComponent implements OnInit {
  @ViewChild('editor') editor?: ElementRef<HTMLDialogElement>;
  private readonly api = inject(PersonalExpensesService);
  private readonly destroy = inject(DestroyRef);
  private request?: Subscription;
  month = format(new Date(), 'yyyy-MM');
  transactions: ExpenseTransaction[] = [];
  categories: string[] = [];
  filter = '';
  loading = false;
  loadError = '';
  categoryError = '';
  formError = '';
  exportError = '';
  saving = false;
  addingCategory = false;
  newCategory = '';
  editing = false;
  draft: ExpenseTransaction = this.empty();

  ngOnInit(): void { this.load(); this.loadCategories(); }
  get income(): bigint { return this.transactions.filter(x => x.Type === 'income').reduce((sum, x) => sum + BigInt(x.Amount), 0n); }
  get expense(): bigint { return this.transactions.filter(x => x.Type === 'expense').reduce((sum, x) => sum + BigInt(x.Amount), 0n); }
  get filtered(): ExpenseTransaction[] { return this.filter ? this.transactions.filter(x => x.Category === this.filter) : this.transactions; }
  get breakdown(): { name: string; amount: bigint; percent: number }[] {
    const groups = new Map<string, bigint>();
    for (const item of this.transactions) if (item.Type === 'expense') groups.set(item.Category, (groups.get(item.Category) || 0n) + BigInt(item.Amount));
    const total = this.expense;
    return [...groups].map(([name, amount]) => ({ name, amount, percent: total ? Number(amount) * 100 / Number(total) : 0 })).sort((a, b) => a.amount === b.amount ? 0 : a.amount > b.amount ? -1 : 1);
  }
  get monthLabel(): string { const [year, month] = this.month.split('-'); return `Tháng ${Number(month)}, ${year}`; }
  money(value: number | bigint): string { return `${new Intl.NumberFormat('vi-VN').format(value)} đ`; }
  changeMonth(delta: number): void { this.month = format(addMonths(parseISO(`${this.month}-01`), delta), 'yyyy-MM'); this.filter = ''; this.load(); }
  load(): void {
    this.request?.unsubscribe(); this.loading = true; this.loadError = ''; this.transactions = [];
    this.request = this.api.list(this.month).pipe(takeUntilDestroyed(this.destroy)).subscribe({
      next: items => { this.transactions = items; this.loading = false; },
      error: () => { this.loading = false; this.loadError = 'Không thể tải thu chi. Vui lòng thử lại.'; },
    });
  }
  loadCategories(): void {
    this.api.categories().pipe(takeUntilDestroyed(this.destroy)).subscribe({
      next: categories => { this.categories = categories; this.categoryError = ''; },
      error: () => { this.categoryError = 'Không thể tải danh mục. Vui lòng thử lại.'; },
    });
  }
  /** Mở báo cáo A4 của cả tháng (không theo bộ lọc) trong cửa sổ in; người dùng chọn "Lưu dưới dạng PDF". */
  exportPdf(): void {
    if (this.loading || this.loadError) return;
    const report = window.open('', '_blank', 'width=900,height=1000');
    if (!report) { this.exportError = 'Trình duyệt đã chặn cửa sổ báo cáo. Hãy cho phép popup rồi thử lại.'; return; }
    this.exportError = '';
    report.document.write(buildExpenseReportHtml(this.month, this.transactions));
    report.document.close();
    report.focus();
    // Đợi font tải xong để bản PDF không bị nhảy chữ
    report.document.fonts.ready.then(() => report.print());
  }
  openCreate(): void { this.editing = false; this.formError = ''; this.newCategory = ''; this.draft = this.empty(); this.editor?.nativeElement.showModal(); }
  openEdit(item: ExpenseTransaction): void { this.editing = true; this.formError = ''; this.newCategory = ''; this.draft = { ...item }; this.editor?.nativeElement.showModal(); }
  close(): void { if (!this.saving && !this.addingCategory) this.editor?.nativeElement.close(); }
  addCategory(): void {
    const name = this.newCategory.trim();
    if (!name || this.addingCategory) return;
    this.addingCategory = true; this.formError = '';
    this.api.addCategory(name).pipe(takeUntilDestroyed(this.destroy)).subscribe({
      next: result => { this.categories = [...this.categories, result.Name]; this.draft.Category = result.Name; this.newCategory = ''; this.addingCategory = false; },
      error: (e: HttpErrorResponse) => { this.addingCategory = false; this.formError = e.status === 409 ? 'Danh mục này đã tồn tại.' : 'Không thể thêm danh mục. Vui lòng thử lại.'; },
    });
  }
  save(form: NgForm): void {
    if (this.saving || this.addingCategory) return;
    if (form.invalid || !this.draft.Category || !Number.isSafeInteger(this.draft.Amount) || this.draft.Amount < 1 || this.draft.Amount > 1_000_000_000_000) { this.formError = 'Vui lòng nhập số tiền nguyên hợp lệ, ngày và danh mục.'; return; }
    const { Id, ...data } = this.draft;
    this.saving = true; this.formError = '';
    const request = this.editing ? this.api.update(Id, data as ExpenseRequest) : this.api.create(data as ExpenseRequest);
    request.pipe(takeUntilDestroyed(this.destroy)).subscribe({
      next: saved => { this.saving = false; this.editor?.nativeElement.close(); this.month = saved.Date.slice(0, 7); this.filter = ''; this.load(); },
      error: (e: HttpErrorResponse) => { this.saving = false; this.formError = e.status === 409 ? 'Giao dịch đã thay đổi. Đóng và tải lại trước khi sửa.' : 'Không thể lưu. Nội dung vẫn được giữ để thử lại.'; },
    });
  }
  remove(): void {
    if (this.saving || !this.editing || !window.confirm('Xóa giao dịch này?')) return;
    this.saving = true; this.formError = '';
    this.api.delete(this.draft.Id, this.draft.Version).pipe(takeUntilDestroyed(this.destroy)).subscribe({
      next: () => { this.saving = false; this.editor?.nativeElement.close(); this.load(); },
      error: (e: HttpErrorResponse) => { this.saving = false; this.formError = e.status === 409 ? 'Giao dịch đã thay đổi. Đóng và tải lại trước khi xóa.' : 'Không thể xóa giao dịch. Vui lòng thử lại.'; },
    });
  }
  private empty(): ExpenseTransaction {
    const today = format(new Date(), 'yyyy-MM-dd');
    return { Id: '', Type: 'expense', Amount: 0, Date: today.startsWith(this.month) ? today : `${this.month}-01`, Category: '', Note: '', Version: 0 };
  }
}
