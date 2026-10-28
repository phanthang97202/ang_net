import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { environment } from '../../environments/environment';

/** Các danh sách chọn của người dùng, lưu chung bảng LookupList ở server. */
export type LookupListCode = 'CALENDAR_CATEGORY' | 'CALENDAR_STATUS' | 'EXPENSE_CATEGORY';
/** Chỉ danh mục thu chi: dùng cho khoản thu, khoản chi hay cả hai. */
export type LookupKind = '' | 'income' | 'expense' | 'both';

export interface LookupItem {
  Id: string;
  ListCode: LookupListCode;
  /** Giá trị được lưu vào sự kiện / giao dịch; đổi tên không đổi mã */
  Code: string;
  NameVi: string;
  NameEn: string;
  Color: string;
  Kind: LookupKind;
  SortOrder: number;
  FlagActive: boolean;
  /** Đang có dữ liệu dùng (chỉ có khi lấy kèm mục đã ẩn): xóa sẽ thành ẩn */
  InUse: boolean;
}

export interface LookupItemRequest {
  NameVi: string;
  NameEn: string;
  Color: string;
  Kind: LookupKind;
  FlagActive: boolean;
}

/** Quyền module cần có để dùng từng danh sách (khớp LookupListCodes.Permission ở server). */
export const LOOKUP_LIST_PERMISSIONS: Record<LookupListCode, string> = {
  CALENDAR_CATEGORY: 'calendar.use',
  CALENDAR_STATUS: 'calendar.use',
  EXPENSE_CATEGORY: 'expenses.use',
};

@Injectable({ providedIn: 'root' })
export class LookupListService {
  private readonly http = inject(HttpClient);
  private readonly translate = inject(TranslateService);
  private readonly url = `${environment.apiUrl}LookupList`;

  list(listCode: LookupListCode, includeInactive = false) {
    return this.http.get<LookupItem[]>(this.url, {
      params: new HttpParams().set('listCode', listCode).set('includeInactive', includeInactive),
    });
  }
  create(listCode: LookupListCode, data: LookupItemRequest) {
    return this.http.post<LookupItem>(this.url, data, { params: new HttpParams().set('listCode', listCode) });
  }
  update(id: string, data: LookupItemRequest) {
    return this.http.put<LookupItem>(`${this.url}/${encodeURIComponent(id)}`, data);
  }
  /** Chưa dùng thì xóa hẳn, đã có dữ liệu dùng thì server chỉ ẩn. */
  delete(id: string) {
    return this.http.delete<{ Result: 'deleted' | 'hidden' }>(`${this.url}/${encodeURIComponent(id)}`);
  }
  move(id: string, direction: 'up' | 'down') {
    return this.http.post<void>(`${this.url}/${encodeURIComponent(id)}/move`, { Direction: direction });
  }

  /** Tên theo ngôn ngữ đang chọn, thiếu thì lấy thứ tiếng còn lại. */
  name(item: Pick<LookupItem, 'NameVi' | 'NameEn'> | null | undefined): string {
    if (!item) return '';
    return this.translate.currentLang === 'en' ? item.NameEn || item.NameVi : item.NameVi || item.NameEn;
  }
}
