import { FormBuilder } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NZ_ICONS } from 'ng-zorro-antd/icon';
import { NZ_I18N, en_US } from 'ng-zorro-antd/i18n';
import * as icons from '@ant-design/icons-angular/icons';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { of, Subject } from 'rxjs';
import { AuthService, SysParameterConfigService } from '../../../services';
import { ShiftReportComponent } from './shift-report.component';
import { ShiftReportModule } from './shift-report.module';
import { ShiftReportService } from './services/shift-report.service';
import { AiAssistantService } from './services/ai-assistant.service';
import { ExcelExportService } from './services/excel-report.service';
import { PrintService } from './services/print.service';

describe('Shift report permissions', () => {
  let component: ShiftReportComponent;
  let permissions: Set<string>;
  let loggedIn: boolean;
  let admin: boolean;
  let api: any;
  let modal: any;

  beforeEach(() => {
    permissions = new Set(['shiftreport.view']);
    loggedIn = true;
    admin = false;
    api = jasmine.createSpyObj('ShiftReportService', [
      'getAll',
      'getById',
      'getDrinkStock',
      'create',
      'update',
      'delete',
    ]);
    api.getAll.and.returnValue(of({ Items: [], TotalCount: 0 }));
    api.getDrinkStock.and.returnValue(of([]));
    api.create.and.returnValue(of({ Id: 1 }));
    api.update.and.returnValue(of({ Id: 1 }));
    api.delete.and.returnValue(of(undefined));
    modal = jasmine.createSpyObj('NzModalService', ['confirm']);
    component = new ShiftReportComponent(
      new FormBuilder(),
      api,
      jasmine.createSpyObj('ExcelExportService', ['exportShiftReport']),
      jasmine.createSpyObj('PrintService', ['printShiftReport']),
      jasmine.createSpyObj('NzMessageService', ['warning', 'error', 'success']),
      modal,
      { shiftCreated$: new Subject<void>() } as any,
      {
        isLoggedIn: () => loggedIn,
        isAdminPermission: () => admin,
        hasPermission: (code: string) => admin || permissions.has(code),
      } as any,
      { getJson: () => of([]) } as any
    );
    component.initForm();
  });

  it('lets a viewer load reports but blocks create, edit, delete and direct submission', () => {
    component.loadReports();
    expect(api.getAll).toHaveBeenCalled();
    expect(component.canCreate).toBeFalse();
    expect(component.canUpdate).toBeFalse();
    expect(component.canDelete).toBeFalse();
    component.showCreateModal();
    component.showEditModal(1);
    component.deleteReport(1);
    component.handleSubmit();
    component.editingId = 1;
    component.handleSubmit();
    expect(component.isModalVisible).toBeFalse();
    expect(api.getById).not.toHaveBeenCalled();
    expect(api.create).not.toHaveBeenCalled();
    expect(api.update).not.toHaveBeenCalled();
    expect(api.delete).not.toHaveBeenCalled();
    expect(modal.confirm).not.toHaveBeenCalled();
  });

  it('renders read-only actions for a viewer and shows CRUD buttons only when granted', async () => {
    api.getAll.and.returnValue(
      of({
        Items: [
          {
            Id: 1,
            ShiftDate: '2026-10-08',
            ShiftType: 'Ca ngày',
            ReceptionistName: 'Test',
            TotalCash: 0,
            TotalTransfer: 0,
            HandoverAmount: 0,
          },
        ],
        TotalCount: 1,
      })
    );
    await TestBed.configureTestingModule({
      imports: [
        ShiftReportModule,
        NoopAnimationsModule,
        TranslateModule.forRoot(),
      ],
      providers: [
        provideRouter([]),
        { provide: NZ_ICONS, useValue: Object.values(icons) },
        { provide: NZ_I18N, useValue: en_US },
        { provide: ShiftReportService, useValue: api },
        {
          provide: AiAssistantService,
          useValue: { shiftCreated$: new Subject<void>(), messages: [] },
        },
        { provide: ExcelExportService, useValue: {} },
        { provide: PrintService, useValue: {} },
        { provide: NzMessageService, useValue: { warning: () => undefined } },
        { provide: NzModalService, useValue: modal },
        {
          provide: AuthService,
          useValue: {
            isLoggedIn: () => loggedIn,
            isAdminPermission: () => admin,
            hasPermission: (code: string) => admin || permissions.has(code),
          },
        },
        {
          provide: SysParameterConfigService,
          useValue: { getJson: () => of([]), getText: () => of(null) },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(ShiftReportComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const create = () =>
      Array.from(
        fixture.nativeElement.querySelectorAll(
          'button'
        ) as NodeListOf<HTMLButtonElement>
      ).find(button => button.textContent?.includes('Tạo báo cáo'));
    const action = (title: string) =>
      fixture.nativeElement.querySelector(`button[nz-tooltip="${title}"]`);
    expect(create()).toBeUndefined();
    expect(action('Chỉnh sửa')).toBeNull();
    expect(action('Xóa')).toBeNull();
    expect(action('In báo cáo')).not.toBeNull();
    expect(action('Xuất Excel')).not.toBeNull();
    permissions.add('shiftreport.create');
    permissions.add('shiftreport.update');
    permissions.add('shiftreport.delete');
    fixture.detectChanges();
    expect(create()).toBeDefined();
    expect(action('Chỉnh sửa')).not.toBeNull();
    expect(action('Xóa')).not.toBeNull();
    fixture.destroy();
  });

  it('checks the current operation again when saving or confirming a delete', () => {
    permissions.add('shiftreport.create');
    component.showCreateModal();
    component.reportForm.patchValue({ receptionistName: 'Test' });
    component.handleSubmit();
    expect(api.create).toHaveBeenCalledTimes(1);
    component.editingId = 1;
    component.handleSubmit();
    expect(api.update).not.toHaveBeenCalled();
    permissions.add('shiftreport.update');
    component.handleSubmit();
    expect(api.update).toHaveBeenCalledTimes(1);

    permissions.add('shiftreport.delete');
    component.deleteReport(1);
    const confirm = modal.confirm.calls.mostRecent().args[0].nzOnOk;
    permissions.delete('shiftreport.delete');
    confirm();
    expect(api.delete).not.toHaveBeenCalled();
    permissions.add('shiftreport.delete');
    confirm();
    expect(api.delete).toHaveBeenCalledWith(1);
  });

  it('retains Admin access and rejects an expired session even if claims remain', () => {
    permissions.clear();
    admin = true;
    expect(
      component.canCreate && component.canUpdate && component.canDelete
    ).toBeTrue();
    loggedIn = false;
    expect(
      component.canCreate || component.canUpdate || component.canDelete
    ).toBeFalse();
    component.loadReports();
    component.loadDrinkStock();
    component.printReport(1);
    component.exportToExcel(1);
    expect(api.getAll).not.toHaveBeenCalled();
    expect(api.getDrinkStock).not.toHaveBeenCalled();
    expect(api.getById).not.toHaveBeenCalled();
  });
});
