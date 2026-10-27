import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { NgForm } from '@angular/forms';
import { NZ_ICONS } from 'ng-zorro-antd/icon';
import * as icons from '@ant-design/icons-angular/icons';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PersonalExpensesComponent } from './personal-expenses.component';

describe('Personal expenses', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule, TranslateModule.forRoot(), PersonalExpensesComponent], providers: [{ provide: NZ_ICONS, useValue: Object.values(icons) }] });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('shows monthly totals independent of the category filter', () => {
    const fixture = TestBed.createComponent(PersonalExpensesComponent);
    fixture.componentInstance.month = '2026-10'; fixture.detectChanges();
    http.expectOne(req => req.url.endsWith('/PersonalExpenses') && req.params.get('month') === '2026-10').flush([
      { Id: '1', Type: 'income', Amount: 1000000, Date: '2026-10-01', Category: 'Lương', Note: '', Version: 1 },
      { Id: '2', Type: 'expense', Amount: 200000, Date: '2026-10-02', Category: 'Ăn uống', Note: '', Version: 1 },
      { Id: '3', Type: 'expense', Amount: 100000, Date: '2026-10-03', Category: 'Đi lại', Note: '', Version: 1 },
    ]);
    http.expectOne(req => req.url.endsWith('/categories')).flush(['Lương', 'Ăn uống', 'Đi lại']);
    const component = fixture.componentInstance;
    component.filter = 'Ăn uống'; fixture.detectChanges();
    expect(component.filtered.length).toBe(1);
    expect(component.income).toBe(1000000n);
    expect(component.expense).toBe(300000n);
    expect(component.breakdown[0].name).toBe('Ăn uống');
    expect(component.breakdown[0].percent).toBeCloseTo(66.67, 1);
  });

  it('saves a custom category and retains a transaction draft on failure', () => {
    const fixture = TestBed.createComponent(PersonalExpensesComponent);
    fixture.detectChanges();
    http.expectOne(req => req.url.endsWith('/PersonalExpenses')).flush([]);
    http.expectOne(req => req.url.endsWith('/categories')).flush(['Khác']);
    const component = fixture.componentInstance;
    component.openCreate(); component.newCategory = 'Cà phê'; component.addCategory();
    http.expectOne(req => req.method === 'POST' && req.url.endsWith('/categories')).flush({ Name: 'Cà phê' });
    expect(component.draft.Category).toBe('Cà phê');
    component.draft.Amount = 50000;
    component.save({ invalid: false } as NgForm);
    http.expectOne(req => req.method === 'POST' && req.url.endsWith('/PersonalExpenses')).flush({}, { status: 500, statusText: 'Error' });
    expect(component.draft.Amount).toBe(50000);
    expect(component.formError).toBe('T_EXPENSES_SAVE_ERROR');
  });

  it('translates built-in categories but keeps custom names and stored values', () => {
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', { T_EXPENSES_CAT_FOOD: 'Food & drinks', T_EXPENSES_MONTH_TITLE: '{{monthName}} {{year}}' });
    translate.use('en');
    const component = TestBed.createComponent(PersonalExpensesComponent).componentInstance;
    component.month = '2026-10';
    expect(component.categoryLabel('Ăn uống')).toBe('Food & drinks');
    expect(component.categoryLabel('Cà phê')).toBe('Cà phê');
    expect(component.monthLabel).toBe('October 2026');
  });

  it('loads the transaction month after saving and clears the filter', () => {
    const fixture = TestBed.createComponent(PersonalExpensesComponent);
    fixture.componentInstance.month = '2026-10'; fixture.detectChanges();
    http.expectOne(req => req.url.endsWith('/PersonalExpenses')).flush([]);
    http.expectOne(req => req.url.endsWith('/categories')).flush(['Ăn uống']);
    const component = fixture.componentInstance;
    component.filter = 'Ăn uống'; component.openCreate();
    component.draft.Amount = 50000; component.draft.Category = 'Ăn uống'; component.draft.Date = '2026-11-01';
    component.save({ invalid: false } as NgForm);
    http.expectOne(req => req.method === 'POST' && req.url.endsWith('/PersonalExpenses')).flush({ ...component.draft, Id: '1', Version: 1 });
    expect(component.month).toBe('2026-11');
    expect(component.filter).toBe('');
    http.expectOne(req => req.method === 'GET' && req.params.get('month') === '2026-11').flush([]);
  });
});
