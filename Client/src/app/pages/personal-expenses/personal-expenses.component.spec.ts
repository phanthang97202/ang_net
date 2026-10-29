import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { NgForm } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { NZ_ICONS } from 'ng-zorro-antd/icon';
import * as icons from '@ant-design/icons-angular/icons';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PersonalExpensesComponent } from './personal-expenses.component';

// Danh mục thu chi riêng của người dùng (LookupList EXPENSE_CATEGORY)
const category = (Code: string, NameVi: string, NameEn: string, Kind: string, FlagActive = true) =>
  ({ Id: Code, ListCode: 'EXPENSE_CATEGORY', Code, NameVi, NameEn, Color: '#d0764a', Kind, SortOrder: 0, FlagActive, InUse: false });
const CATEGORIES = [
  category('salary', 'Lương', 'Salary', 'income'),
  category('food', 'Ăn uống', 'Food & drinks', 'expense'),
  category('transport', 'Đi lại', 'Transport', 'expense'),
  category('other', 'Khác', 'Other', 'both'),
];
const tx = (Id: string, Type: 'income' | 'expense', Amount: number, Date: string, CategoryCode: string, Category = '') =>
  ({ Id, Type, Amount, Date, Category, CategoryCode, Note: '', Version: 1 });

describe('Personal expenses', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule, TranslateModule.forRoot(), PersonalExpensesComponent], providers: [provideRouter([]), { provide: NZ_ICONS, useValue: Object.values(icons) }] });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  const flushCategories = (items: unknown[] = CATEGORIES) =>
    http.expectOne(req => req.url.endsWith('/LookupList') && req.params.get('listCode') === 'EXPENSE_CATEGORY').flush(items);

  it('shows monthly totals independent of the category filter', () => {
    const fixture = TestBed.createComponent(PersonalExpensesComponent);
    fixture.componentInstance.month = '2026-10'; fixture.detectChanges();
    http.expectOne(req => req.url.endsWith('/PersonalExpenses') && req.params.get('month') === '2026-10').flush([
      tx('1', 'income', 1000000, '2026-10-01', 'salary'),
      tx('2', 'expense', 200000, '2026-10-02', 'food'),
      tx('3', 'expense', 100000, '2026-10-03', 'transport'),
    ]);
    flushCategories();
    const component = fixture.componentInstance;
    component.filter = 'food'; fixture.detectChanges();
    expect(component.filtered.length).toBe(1);
    expect(component.income).toBe(1000000n);
    expect(component.expense).toBe(300000n);
    expect(component.breakdown[0].name).toBe('Ăn uống');
    expect(component.breakdown[0].percent).toBeCloseTo(66.67, 1);
  });

  it('offers only categories matching income / expense and retains a draft on failure', () => {
    const fixture = TestBed.createComponent(PersonalExpensesComponent);
    fixture.detectChanges();
    http.expectOne(req => req.url.endsWith('/PersonalExpenses')).flush([]);
    flushCategories();
    const component = fixture.componentInstance;
    component.openCreate();
    expect(component.categoryOptions.map(item => item.Code)).toEqual(['food', 'transport', 'other']);
    component.draft.CategoryCode = 'food';
    // Đổi sang khoản thu: "Ăn uống" (chỉ dành cho chi) bị bỏ chọn
    component.changeType('income');
    expect(component.categoryOptions.map(item => item.Code)).toEqual(['salary', 'other']);
    expect(component.draft.CategoryCode).toBe('');
    component.draft.CategoryCode = 'salary';
    component.draft.Amount = 50000;
    component.save({ invalid: false } as NgForm);
    const request = http.expectOne(req => req.method === 'POST' && req.url.endsWith('/PersonalExpenses'));
    expect(request.request.body.CategoryCode).toBe('salary');
    request.flush({}, { status: 500, statusText: 'Error' });
    expect(component.draft.Amount).toBe(50000);
    expect(component.formError).toBe('T_EXPENSES_SAVE_ERROR');
  });

  it('shows category names in the current language, falling back to the stored name', () => {
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', { T_EXPENSES_MONTH_TITLE: '{{monthName}} {{year}}' });
    translate.use('en');
    const fixture = TestBed.createComponent(PersonalExpensesComponent);
    fixture.componentInstance.month = '2026-10'; fixture.detectChanges();
    http.expectOne(req => req.url.endsWith('/PersonalExpenses')).flush([]);
    flushCategories([...CATEGORIES, category('cold', 'Cà phê', '', 'expense', false)]);
    const component = fixture.componentInstance;
    expect(component.categoryLabel(tx('1', 'expense', 1, '2026-10-01', 'food'))).toBe('Food & drinks');
    expect(component.categoryLabel(tx('2', 'expense', 1, '2026-10-01', 'cold'))).toBe('Cà phê', 'No English name: use the Vietnamese one');
    expect(component.categoryLabel(tx('3', 'expense', 1, '2026-10-01', 'gone', 'Ngày lễ'))).toBe('Ngày lễ', 'Unknown code: use the stored name');
    expect(component.monthLabel).toBe('October 2026');
  });

  it('loads the transaction month after saving and clears the filter', () => {
    const fixture = TestBed.createComponent(PersonalExpensesComponent);
    fixture.componentInstance.month = '2026-10'; fixture.detectChanges();
    http.expectOne(req => req.url.endsWith('/PersonalExpenses')).flush([]);
    flushCategories();
    const component = fixture.componentInstance;
    component.filter = 'food'; component.openCreate();
    component.draft.Amount = 50000; component.draft.CategoryCode = 'food'; component.draft.Date = '2026-11-01';
    component.save({ invalid: false } as NgForm);
    http.expectOne(req => req.method === 'POST' && req.url.endsWith('/PersonalExpenses')).flush({ ...component.draft, Id: '1', Version: 1 });
    expect(component.month).toBe('2026-11');
    expect(component.filter).toBe('');
    http.expectOne(req => req.method === 'GET' && req.params.get('month') === '2026-11').flush([]);
  });

  it('formats the amount while editing and sends an integer to the API', async () => {
    const fixture = TestBed.createComponent(PersonalExpensesComponent);
    fixture.detectChanges();
    http.expectOne(req => req.url.endsWith('/PersonalExpenses')).flush([]);
    flushCategories();
    const component = fixture.componentInstance;
    component.openCreate(); fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[name="amount"]');
    input.value = '500000'; input.setSelectionRange(6, 6); input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(input.value).toBe('500.000');
    expect(component.draft.Amount).toBe(500000);
    input.value = '5010.000'; input.setSelectionRange(3, 3); input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(input.value).toBe('5.010.000');
    expect(input.selectionStart).toBe(4);
    input.value = '500.000 đ'; input.dispatchEvent(new Event('input', { bubbles: true })); fixture.detectChanges();
    expect(input.value).toBe('500.000');
    component.draft.CategoryCode = 'food'; component.save({ invalid: false } as NgForm);
    const request = http.expectOne(req => req.method === 'POST' && req.url.endsWith('/PersonalExpenses'));
    expect(request.request.body.Amount).toBe(500000);
    request.flush({}, { status: 500, statusText: 'Error' });
    expect(input.value).toBe('500.000');
    input.value = '-500'; input.dispatchEvent(new Event('input', { bubbles: true }));
    component.save({ invalid: false } as NgForm);
    http.expectNone(req => req.method === 'POST');
    component.openEdit(tx('1', 'expense', 1234567, '2026-10-01', 'food'));
    fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges();
    expect(input.value).toBe('1.234.567');
  });
});
