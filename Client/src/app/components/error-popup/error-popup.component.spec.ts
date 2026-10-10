import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { NZ_ICONS } from 'ng-zorro-antd/icon';
import { CloseOutline, WarningOutline } from '@ant-design/icons-angular/icons';
import { ShowErrorService } from '../../services/show-error.service';
import { ErrorPopupComponent } from './error-popup.component';

describe('API error popup', () => {
  let errors: { clearError: jasmine.Spy };
  beforeEach(() => {
    errors = { clearError: jasmine.createSpy() };
    TestBed.configureTestingModule({
      imports: [
        ErrorPopupComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot(),
      ],
      providers: [
        { provide: ShowErrorService, useValue: errors },
        { provide: NZ_ICONS, useValue: [CloseOutline, WarningOutline] },
      ],
    });
  });

  it('renders API text safely in the blog dialog, including an initial error without an ID', fakeAsync(() => {
    const f = TestBed.createComponent(ErrorPopupComponent);
    const message = '<img src=x onerror=alert(1)>\nThông tin không hợp lệ';
    f.componentRef.setInput('errorInfo', { title: 'Lỗi API', message });
    f.detectChanges();
    tick(150);
    const modal = document.querySelector('.blog-api-error-modal')!;
    expect(modal).not.toBeNull();
    expect(modal.querySelector('pre')?.textContent).toBe(message);
    expect(modal.querySelector('pre img')).toBeNull();
    expect(modal.querySelector('h3')?.textContent).toBe('Lỗi API');
    (modal.querySelector('.api-error-close') as HTMLButtonElement).click();
    tick(150);
    expect(errors.clearError).toHaveBeenCalledTimes(1);
    expect(document.querySelector('.blog-api-error-modal')).toBeNull();
    f.destroy();
    tick(1000);
  }));

  it('replaces repeated errors without clearing the queue for the newer dialog and ignores a repeated ID', fakeAsync(() => {
    const f = TestBed.createComponent(ErrorPopupComponent);
    f.componentRef.setInput('errorInfo', {
      id: 1,
      title: 'API',
      message: 'First',
    });
    f.detectChanges();
    tick(150);
    f.componentRef.setInput('errorInfo', {
      id: 2,
      title: 'API',
      message: 'Second',
    });
    f.detectChanges();
    tick(300);
    expect(document.querySelectorAll('.blog-api-error-modal').length).toBe(1);
    expect(
      document.querySelector('.blog-api-error-modal pre')?.textContent
    ).toBe('Second');
    expect(errors.clearError).not.toHaveBeenCalled();
    const dialog = document.querySelector('.blog-api-error-modal');
    f.componentRef.setInput('errorInfo', {
      id: 2,
      title: 'API',
      message: 'Second',
    });
    f.detectChanges();
    tick(150);
    expect(document.querySelector('.blog-api-error-modal')).toBe(dialog);
    (dialog!.querySelector('.ant-modal-close') as HTMLButtonElement).click();
    tick(150);
    expect(errors.clearError).toHaveBeenCalledTimes(1);
    f.destroy();
    tick(1000);
  }));

  it('preserves the dashboard confirm dialog while keeping API messages escaped', fakeAsync(() => {
    const f = TestBed.createComponent(ErrorPopupComponent);
    f.componentRef.setInput('blogStyle', false);
    f.componentRef.setInput('errorInfo', {
      id: 1,
      icon: 'warning',
      title: 'Admin API',
      message: '<b>Plain text</b>',
    });
    f.detectChanges();
    tick(150);
    expect(document.querySelector('.blog-api-error-modal')).toBeNull();
    expect(
      document.querySelector('.ant-modal-confirm-title')?.textContent
    ).toContain('Admin API');
    expect(document.querySelector('.api-error-raw')?.textContent).toBe(
      '<b>Plain text</b>'
    );
    expect(document.querySelector('.api-error-raw b')).toBeNull();
    (
      document.querySelector(
        '.ant-modal-confirm-btns button'
      ) as HTMLButtonElement
    ).click();
    tick(150);
    expect(errors.clearError).toHaveBeenCalledTimes(1);
    f.destroy();
    tick(1000);
  }));
});
