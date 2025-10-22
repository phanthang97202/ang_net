import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
  CreateShiftReportDto,
  PagedResult,
  ShiftReportListItem,
  ShiftReportQueryParams,
  ShiftReportResponse,
} from '../types/shift-report-type';

@Injectable({
  providedIn: 'root',
})
export class ShiftReportService {
  private apiUrl = `${environment.apiUrl}ShiftReport`;

  constructor(private http: HttpClient) {}

  getAll(
    params?: ShiftReportQueryParams
  ): Observable<PagedResult<ShiftReportListItem>> {
    let httpParams = new HttpParams();

    if (params) {
      if (params.fromDate)
        httpParams = httpParams.set('fromDate', params.fromDate);
      if (params.toDate) httpParams = httpParams.set('toDate', params.toDate);
      if (params.receptionistName)
        httpParams = httpParams.set(
          'ReceptionistName',
          params.receptionistName
        );
      if (params.shiftType)
        httpParams = httpParams.set('shiftType', params.shiftType);
      if (params.pageNumber)
        httpParams = httpParams.set('pageNumber', params.pageNumber.toString());
      if (params.pageSize)
        httpParams = httpParams.set('pageSize', params.pageSize.toString());
    }

    return this.http.get<PagedResult<ShiftReportListItem>>(
      `${this.apiUrl}/GetAll`,
      {
        params: httpParams,
      }
    );
  }

  getById(id: number): Observable<ShiftReportResponse> {
    return this.http.get<ShiftReportResponse>(`${this.apiUrl}/GetById/${id}`);
  }

  create(dto: CreateShiftReportDto): Observable<ShiftReportResponse> {
    return this.http.post<ShiftReportResponse>(`${this.apiUrl}/Create`, dto);
  }

  update(
    id: number,
    dto: CreateShiftReportDto
  ): Observable<ShiftReportResponse> {
    return this.http.put<ShiftReportResponse>(`${this.apiUrl}/update/${id}`, {
      ...dto,
      id,
    });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/delete/${id}`);
  }

  getSummary(fromDate?: string, toDate?: string): Observable<any> {
    let httpParams = new HttpParams();
    if (fromDate) httpParams = httpParams.set('fromDate', fromDate);
    if (toDate) httpParams = httpParams.set('toDate', toDate);

    return this.http.get(`${this.apiUrl}/getsummary`, { params: httpParams });
  }
}
