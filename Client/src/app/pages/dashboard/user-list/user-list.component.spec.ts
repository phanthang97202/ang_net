import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NZ_ICONS } from 'ng-zorro-antd/icon';
import { NZ_I18N, en_US } from 'ng-zorro-antd/i18n';
import * as icons from '@ant-design/icons-angular/icons';
import { of } from 'rxjs';
import {
  AuthService,
  LoadingService,
  ShowErrorService,
} from '../../../services';
import { UserListComponent } from './user-list.component';

describe('User list account security actions', () => {
  let admin: boolean;
  beforeEach(() => {
    admin = true;
    TestBed.configureTestingModule({
      imports: [
        UserListComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot(),
      ],
      providers: [
        provideRouter([]),
        { provide: NZ_ICONS, useValue: Object.values(icons) },
        { provide: NZ_I18N, useValue: en_US },
        {
          provide: AuthService,
          useValue: {
            isAdminPermission: () => admin,
            isLoggedIn: () => true,
            getAccountInfo: () => ({ nameid: 'admin' }),
            getAllUsers: () =>
              of({
                DataList: [
                  {
                    Id: 'admin',
                    FullName: 'Admin',
                    UserName: 'admin',
                    Roles: ['Admin'],
                    FlagActive: true,
                    HasPassword: true,
                  },
                  {
                    Id: 'locked',
                    FullName: 'Locked',
                    UserName: 'locked',
                    Roles: ['User'],
                    FlagActive: false,
                    HasPassword: true,
                  },
                ],
              }),
          },
        },
        { provide: LoadingService, useValue: { setLoading: () => undefined } },
        { provide: ShowErrorService, useValue: {} },
      ],
    });
  });
  it('shows locked status and unlock confirmation while disabling the current admin lock', fakeAsync(() => {
    const fixture = TestBed.createComponent(UserListComponent);
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll(
      '[aria-label="Bảo mật tài khoản"]'
    ) as NodeListOf<HTMLButtonElement>;
    expect(buttons.length).toBe(2);
    expect(fixture.nativeElement.textContent).toContain('Đã khóa');
    expect(buttons[0].querySelector('svg')).not.toBeNull();
    buttons[0].click();
    tick(200);
    fixture.detectChanges();
    const lock = Array.from(
      document.querySelectorAll('.ant-dropdown-menu-item')
    ).find(el => el.textContent?.includes('Khóa tài khoản'))!;
    expect(
      lock.classList.contains('ant-dropdown-menu-item-disabled')
    ).toBeTrue();
    buttons[0].click();
    tick(200);
    buttons[1].click();
    tick(200);
    fixture.detectChanges();
    const unlock = Array.from(
      document.querySelectorAll('.ant-dropdown-menu-item')
    ).find(el => el.textContent?.includes('Mở khóa tài khoản')) as HTMLElement;
    expect(unlock).toBeTruthy();
    unlock.click();
    fixture.detectChanges();
    tick();
    expect(fixture.componentInstance.securityUser?.Id).toBe('locked');
    expect(
      document.querySelector('.admin-account-security')?.textContent
    ).toContain('Mở khóa tài khoản');
    fixture.destroy();
    tick(1000);
  }));
  it('hides security actions for non-admin users and rejects direct attempts to open them', fakeAsync(() => {
    admin = false;
    const fixture = TestBed.createComponent(UserListComponent);
    fixture.detectChanges();
    tick();
    expect(
      fixture.nativeElement.querySelector('[aria-label="Bảo mật tài khoản"]')
    ).toBeNull();
    fixture.componentInstance.openSecurity(
      fixture.componentInstance.lstUsers[1],
      'unlock'
    );
    expect(fixture.componentInstance.securityVisible).toBeFalse();
    fixture.destroy();
    tick(1000);
  }));
});
