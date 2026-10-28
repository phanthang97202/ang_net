import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';

export interface ExpenseTransaction { Id: string; Type: 'income' | 'expense'; Amount: number; Date: string;
  /** Bản chụp tên danh mục lúc lưu; danh mục thật là CategoryCode (LookupList EXPENSE_CATEGORY) */
  Category: string; CategoryCode: string; Note: string; Version: number; }
export type ExpenseRequest = Omit<ExpenseTransaction, 'Id'>;

@Injectable({ providedIn: 'root' })
export class PersonalExpensesService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}PersonalExpenses`;
  list(month: string) { return this.http.get<ExpenseTransaction[]>(this.url, { params: new HttpParams().set('month', month) }); }
  create(data: ExpenseRequest) { return this.http.post<ExpenseTransaction>(this.url, data); }
  update(id: string, data: ExpenseRequest) { return this.http.put<ExpenseTransaction>(`${this.url}/${encodeURIComponent(id)}`, data); }
  delete(id: string, version: number) { return this.http.delete<void>(`${this.url}/${encodeURIComponent(id)}`, { params: new HttpParams().set('version', version) }); }
}
