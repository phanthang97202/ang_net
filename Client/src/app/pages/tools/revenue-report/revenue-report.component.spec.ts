import { of } from 'rxjs';
import { RevenueReportComponent } from './revenue-report.component';

describe('Revenue report permissions', () => {
  it('requires the revenue permission independently of shift report view', () => {
    const api = jasmine.createSpyObj('RevenueReportService', [
      'getRevenueReport',
    ]);
    api.getRevenueReport.and.returnValue(of({ Summary: {} }));
    let permission = 'shiftreport.view';
    let loggedIn = true;
    const component = new RevenueReportComponent(api, {
      isLoggedIn: () => loggedIn,
      hasPermission: (code: string) => code === permission,
    } as any);
    const print = spyOn(window, 'print');
    component.ngOnInit();
    component.printReport();
    expect(api.getRevenueReport).not.toHaveBeenCalled();
    expect(print).not.toHaveBeenCalled();
    permission = 'revenuereport.view';
    component.loadReport();
    component.printReport();
    expect(api.getRevenueReport).toHaveBeenCalledTimes(1);
    expect(print).toHaveBeenCalledTimes(1);
    loggedIn = false;
    component.loadReport();
    component.printReport();
    expect(api.getRevenueReport).toHaveBeenCalledTimes(1);
    expect(print).toHaveBeenCalledTimes(1);
    expect(component.reportData).toBeNull();
  });
});
