import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Subject } from 'rxjs';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AuthService } from '../../../services';
import { AccountSecurityPopupComponent } from './account-security-popup.component';
import { IUser } from '../../../interfaces';
import { NZ_ICONS } from 'ng-zorro-antd/icon';
import { CloseOutline, LoadingOutline } from '@ant-design/icons-angular/icons';

describe('Admin account security confirmation', () => {
  let api: any;
  let response: Subject<any>;
  let component: AccountSecurityPopupComponent;
  let fixture: ComponentFixture<AccountSecurityPopupComponent>;
  beforeEach(() => {
    response = new Subject();
    api = jasmine.createSpyObj('AuthService', [
      'revokeAccountSessions',
      'setAccountLocked',
      'logout',
      'isAdminPermission',
      'isLoggedIn',
      'getAccountInfo',
    ]);
    api.isAdminPermission.and.returnValue(true);
    api.isLoggedIn.and.returnValue(true);
    api.getAccountInfo.and.returnValue({ nameid: 'admin' });
    api.revokeAccountSessions.and.returnValue(response);
    api.setAccountLocked.and.returnValue(response);
    TestBed.configureTestingModule({
      imports: [AccountSecurityPopupComponent, NoopAnimationsModule],
      providers: [
        { provide: AuthService, useValue: api },
        { provide: NZ_ICONS, useValue: [CloseOutline, LoadingOutline] },
        { provide: NzMessageService, useValue: { success: () => undefined } },
      ],
    });
    fixture = TestBed.createComponent(AccountSecurityPopupComponent);
    component = fixture.componentInstance;
    component.user = {
      Id: 'target',
      FullName: 'Test',
      UserName: 'test',
    } as IUser;
  });
  it('renders a safe confirmation, blocks repeat clicks while pending and displays failure', fakeAsync(() => {
    component.user = {
      Id: 'target',
      FullName: '<img src=x onerror=alert(1)>',
      UserName: 'test',
    } as IUser;
    component.action = 'lock';
    component.visible = true;
    fixture.detectChanges();
    tick();
    const modal = document.querySelector('.admin-account-security')!;
    expect(modal.textContent).toContain('chỉ được mở lại bởi Admin');
    expect(modal.textContent).toContain('<img src=x onerror=alert(1)>');
    expect(modal.querySelector('.security-target img')).toBeNull();
    const confirm = modal.querySelector(
      '.ant-modal-footer .ant-btn-primary'
    ) as HTMLButtonElement;
    const cancel = Array.from(
      modal.querySelectorAll<HTMLButtonElement>('.ant-modal-footer button')
    ).find(button => button.textContent?.includes('Hủy'))!;
    expect(api.setAccountLocked).not.toHaveBeenCalled();
    confirm.click();
    fixture.detectChanges();
    expect(cancel.disabled).toBeTrue();
    expect(confirm.classList.contains('ant-btn-loading')).toBeTrue();
    confirm.click();
    expect(api.setAccountLocked).toHaveBeenCalledOnceWith('target', true);
    response.next({ Success: false, ErrorMessage: 'Không thể lưu' });
    response.complete();
    fixture.detectChanges();
    expect(modal.querySelector('[role="alert"]')?.textContent).toContain(
      'Không thể lưu'
    );
    expect(cancel.disabled).toBeFalse();
    fixture.destroy();
    tick(1000);
  }));
  it('requires confirmation, avoids duplicate requests and updates the list after success', () => {
    const saved = spyOn(component.saved, 'emit');
    const closed = spyOn(component.visibleChange, 'emit');
    component.visible = true;
    component.action = 'lock';
    component.ngOnChanges();
    expect(api.setAccountLocked).not.toHaveBeenCalled();
    component.save();
    component.save();
    expect(api.setAccountLocked).toHaveBeenCalledOnceWith('target', true);
    expect(component.saving).toBeTrue();
    component.cancel();
    expect(closed).not.toHaveBeenCalled();
    response.next({ Success: true });
    response.complete();
    expect(saved).toHaveBeenCalledTimes(1);
    expect(closed).toHaveBeenCalledWith(false);
    expect(component.saving).toBeFalse();
  });
  it('blocks non-admin and self-lock, but logs out after revoking the current admin session', () => {
    api.isAdminPermission.and.returnValue(false);
    component.save();
    expect(api.revokeAccountSessions).not.toHaveBeenCalled();
    api.isAdminPermission.and.returnValue(true);
    component.user = { Id: 'admin' } as IUser;
    component.action = 'lock';
    component.save();
    expect(api.setAccountLocked).not.toHaveBeenCalled();
    expect(component.error).toContain('tự khóa');
    component.action = 'revoke';
    component.save();
    response.next({ Success: true });
    response.complete();
    expect(api.logout).toHaveBeenCalledTimes(1);
  });
  it('keeps the confirmation open after failure and lets the admin retry', () => {
    const close = spyOn(component.visibleChange, 'emit');
    component.action = 'unlock';
    component.save();
    response.next({ Success: false, ErrorMessage: 'Thử lại' });
    response.complete();
    expect(component.error).toBe('Thử lại');
    expect(component.saving).toBeFalse();
    expect(close).not.toHaveBeenCalled();
    response = new Subject();
    api.setAccountLocked.and.returnValue(response);
    component.save();
    expect(api.setAccountLocked).toHaveBeenCalledTimes(2);
  });
});
