import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NZ_ICONS } from 'ng-zorro-antd/icon';
import * as icons from '@ant-design/icons-angular/icons';
import { of } from 'rxjs';
import {
  ApiService,
  LoadingService,
  ShowErrorService,
} from '../../../../services';
import { IAuditTrail } from '../../../../interfaces';
import { AuditTrailComponent } from './audit-trail-list.component';

describe('Audit log JSON controls', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AuditTrailComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot(),
      ],
      providers: [
        provideRouter([]),
        { provide: NZ_ICONS, useValue: Object.values(icons) },
        {
          provide: ApiService,
          useValue: {
            AuditTrailSearch: () =>
              of({ Success: true, objResult: { DataList: [], ItemCount: 0 } }),
          },
        },
        { provide: LoadingService, useValue: { setLoading: () => undefined } },
        {
          provide: ShowErrorService,
          useValue: { setShowError: () => undefined },
        },
      ],
    });
  });
  it('formats nested JSON on click, restores its original text and never changes the record', fakeAsync(() => {
    const f = TestBed.createComponent(AuditTrailComponent);
    f.detectChanges();
    const raw = JSON.stringify([
      { Key: 'payload', Value: JSON.stringify({ Note: 'Tiền phòng' }) },
    ]);
    const record = {
      OldValues: '{"Old":1}',
      NewValues: raw,
      Level: 'INFORMATION',
      TrailType: 'PUT',
    } as IAuditTrail;
    f.componentInstance.handleOpenDetail(record);
    f.detectChanges();
    tick(150);
    f.detectChanges();
    const button = document.querySelector(
      '[aria-label="Định dạng JSON giá trị sau"]'
    ) as HTMLButtonElement;
    expect(button).not.toBeNull();
    button.click();
    f.detectChanges();
    expect(button.textContent).toContain('Bản gốc');
    expect(
      JSON.parse(
        document.querySelector('pre[aria-label="Giá trị sau"]')!.textContent!
      )[0].Value
    ).toEqual({ Note: 'Tiền phòng' });
    expect(record.NewValues).toBe(raw);
    button.click();
    f.detectChanges();
    expect(
      document.querySelector('pre[aria-label="Giá trị sau"]')!.textContent
    ).toBe(raw);
    f.componentInstance.toggleJsonFormat('OldValues');
    f.componentInstance.handleCloseDetail();
    f.componentInstance.handleOpenDetail({
      ...record,
      OldValues: '',
      NewValues: 'Plain text',
    });
    f.componentInstance.toggleJsonFormat('NewValues');
    expect(f.componentInstance.formattedJson.size).toBe(0);
    expect(f.componentInstance.detailJson.NewValues).toBe('Plain text');
    expect(f.componentInstance.jsonError.NewValues).toContain(
      'không phải JSON'
    );
    f.destroy();
    tick(1000);
  }));
});
