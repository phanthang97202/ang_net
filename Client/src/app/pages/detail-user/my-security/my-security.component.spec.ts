import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NZ_ICONS } from 'ng-zorro-antd/icon';
import { LockOutline, LogoutOutline } from '@ant-design/icons-angular/icons';
import { Subject, throwError } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { MySecurityComponent } from './my-security.component';

describe('Profile security', () => {
  let auth: any;
  beforeEach(() => {
    auth = {
      isLoggedIn: () => true,
      isAdminPermission: () => false,
      protectOwnAccount: jasmine.createSpy(),
      logout: jasmine.createSpy(),
    };
    TestBed.configureTestingModule({
      imports: [
        MySecurityComponent,
        TranslateModule.forRoot(),
        NoopAnimationsModule,
      ],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: NZ_ICONS, useValue: [LockOutline, LogoutOutline] },
        {
          provide: NzMessageService,
          useValue: { success: jasmine.createSpy() },
        },
      ],
    });
  });

  it('waits for confirmation, cancels without mutation and logs out only after success', fakeAsync(() => {
    const response = new Subject<any>();
    auth.protectOwnAccount.and.returnValue(response);
    const f = TestBed.createComponent(MySecurityComponent);
    f.detectChanges();
    const open = () => {
      f.nativeElement.querySelector('.security__card button').click();
      f.detectChanges();
      tick(150);
    };
    open();
    expect(auth.protectOwnAccount).not.toHaveBeenCalled();
    (
      document.querySelector(
        '.profile-security-modal .ant-modal-footer button'
      ) as HTMLButtonElement
    ).click();
    f.detectChanges();
    tick(150);
    expect(f.componentInstance.action).toBeNull();
    open();
    (
      document.querySelector(
        '.profile-security-modal .ant-modal-footer .ant-btn-primary'
      ) as HTMLButtonElement
    ).click();
    f.detectChanges();
    tick();
    expect(auth.protectOwnAccount).toHaveBeenCalledOnceWith(false);
    expect(auth.logout).not.toHaveBeenCalled();
    f.componentInstance.save();
    expect(auth.protectOwnAccount).toHaveBeenCalledTimes(1);
    response.next({ Success: true });
    response.complete();
    tick();
    f.detectChanges();
    expect(auth.logout).toHaveBeenCalledTimes(1);
    expect(f.componentInstance.action).toBeNull();
    f.destroy();
    tick(1000);
  }));

  it('keeps a failed lock confirmation open for retry and never logs out on failure', fakeAsync(() => {
    auth.protectOwnAccount.and.returnValue(
      throwError(() => ({ error: { ErrorMessage: 'Try later' } }))
    );
    const f = TestBed.createComponent(MySecurityComponent);
    f.detectChanges();
    f.nativeElement.querySelector('.security__lock').click();
    f.detectChanges();
    tick(150);
    f.componentInstance.save();
    f.detectChanges();
    tick();
    expect(auth.protectOwnAccount).toHaveBeenCalledOnceWith(true);
    expect(auth.logout).not.toHaveBeenCalled();
    expect(f.componentInstance.action).toBe('lock');
    expect(f.componentInstance.saving).toBeFalse();
    expect(
      document.querySelector('.profile-security-modal [role="alert"]')
        ?.textContent
    ).toContain('Try later');
    f.componentInstance.cancel();
    f.destroy();
    tick(1000);
  }));

  it('preserves the admin self-lock safeguard but allows revoking own sessions', fakeAsync(() => {
    auth.isAdminPermission = () => true;
    const f = TestBed.createComponent(MySecurityComponent);
    f.detectChanges();
    expect(
      f.nativeElement.querySelector('.security__lock').disabled
    ).toBeTrue();
    f.componentInstance.confirm('lock');
    expect(f.componentInstance.action).toBeNull();
    f.componentInstance.confirm('revoke');
    expect(f.componentInstance.action).toBe('revoke');
    expect(auth.protectOwnAccount).not.toHaveBeenCalled();
    f.destroy();
    tick(1000);
  }));
});
