import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
  RevenueReportQueryParams,
  RevenueReportResponse,
} from '../types/revenue-report-type';

@Injectable({
  providedIn: 'root',
})
export class RevenueReportService {
  private apiUrl = `${environment.apiUrl}/api/RevenueReports`;

  constructor(private http: HttpClient) {}

  getRevenueReport(
    params?: RevenueReportQueryParams
  ): Observable<RevenueReportResponse> {
    let httpParams = new HttpParams();

    if (params) {
      if (params.fromDate)
        httpParams = httpParams.set('fromDate', params.fromDate);
      if (params.toDate) httpParams = httpParams.set('toDate', params.toDate);
      if (params.receptionistName)
        httpParams = httpParams.set(
          'receptionistName',
          params.receptionistName
        );
      if (params.shiftType)
        httpParams = httpParams.set('shiftType', params.shiftType);
      if (params.roomNumber)
        httpParams = httpParams.set('roomNumber', params.roomNumber);
    }

    return this.http.get<RevenueReportResponse>(this.apiUrl, {
      params: httpParams,
    });
  }
}
