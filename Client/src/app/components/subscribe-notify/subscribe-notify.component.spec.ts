import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { ApiService } from '../../services';
import { SubscribeNotifyComponent } from './subscribe-notify.component';

describe('SubscribeNotifyComponent submission', () => {
  let component: SubscribeNotifyComponent;
  let api: jasmine.SpyObj<ApiService>;
  let response: Subject<any>;

  beforeEach(() => {
    response = new Subject();
    api = jasmine.createSpyObj('ApiService', ['Subscribe']);
    api.Subscribe.and.returnValue(response);
    TestBed.configureTestingModule({
      providers: [{ provide: ApiService, useValue: api }],
    });
    component = TestBed.runInInjectionContext(
      () => new SubscribeNotifyComponent()
    );
  });

  it('rejects an invalid address without making a request', () => {
    component.form.email = 'khong-phai-email';
    component.handleSubmit();
    expect(api.Subscribe).not.toHaveBeenCalled();
    expect(component.errorMsg).toBeTruthy();
  });

  it('trims an address and allows only one pending request', () => {
    component.form.email = '  reader@example.com  ';
    component.handleSubmit();
    component.handleSubmit();
    expect(api.Subscribe).toHaveBeenCalledOnceWith('reader@example.com');
    response.next({ Success: true });
    response.complete();
    expect(component.isSuccess).toBeTrue();
    expect(component.isLoading).toBeFalse();
    component.handleSubmit();
    expect(api.Subscribe).toHaveBeenCalledTimes(1);
  });

  it('allows retry after a failed request', () => {
    component.form.email = 'reader@example.com';
    component.handleSubmit();
    response.error(new Error('offline'));
    expect(component.isLoading).toBeFalse();
    expect(component.errorMsg).toBeTruthy();
    api.Subscribe.and.returnValue(new Subject());
    component.handleSubmit();
    expect(api.Subscribe).toHaveBeenCalledTimes(2);
  });
});
