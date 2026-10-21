import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { NZ_ICONS } from 'ng-zorro-antd/icon';
import { DeleteOutline, CloseOutline } from '@ant-design/icons-angular/icons';
import { NzMessageService } from 'ng-zorro-antd/message';
import { of, Subject } from 'rxjs';
import { ApiService, AuthService } from '../../../../services';
import { IReelCreateResponse, IReelDto } from '../../../../interfaces';
import { ReelDeleteComponent } from './reel-delete.component';

describe('Delete a reel from the blog', () => {
  let fixture: ComponentFixture<ReelDeleteComponent>;
  let api: jasmine.SpyObj<ApiService>;
  let account: string | null;
  let moderator: boolean;
  let response: Subject<IReelCreateResponse>;

  beforeEach(() => {
    account = 'me';
    moderator = false;
    response = new Subject();
    api = jasmine.createSpyObj<ApiService>('ApiService', ['ReelDelete']);
    api.ReelDelete.and.returnValue(response);
    TestBed.configureTestingModule({
      imports: [
        ReelDeleteComponent,
        TranslateModule.forRoot(),
        NoopAnimationsModule,
      ],
      providers: [
        { provide: ApiService, useValue: api },
        {
          provide: AuthService,
          useValue: {
            isLoggedIn: () => !!account,
            getAccountInfo: () => ({ nameid: account }),
            hasPermission: (key: string) => key === 'reel.delete' && moderator,
          },
        },
        {
          provide: NzMessageService,
          useValue: {
            success: jasmine.createSpy(),
            error: jasmine.createSpy(),
          },
        },
        { provide: NZ_ICONS, useValue: [DeleteOutline, CloseOutline] },
      ],
    });
    fixture = TestBed.createComponent(ReelDeleteComponent);
    fixture.componentInstance.reel = {
      ReelId: 'mine',
      UserId: 'me',
    } as IReelDto;
    fixture.detectChanges();
  });

  const confirmButton = () =>
    document.querySelector<HTMLButtonElement>('.blog-modal .blog-btn--danger')!;

  it('only exposes delete for the current owner or the delete permission', () => {
    expect(fixture.nativeElement.querySelector('.reel-delete')).not.toBeNull();
    account = 'other';
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.reel-delete')).toBeNull();
    moderator = true;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.reel-delete')).not.toBeNull();
    account = null;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.reel-delete')).toBeNull();
  });

  it('requires confirmation and cancel does not send a delete request', () => {
    fixture.nativeElement.querySelector('.reel-delete').click();
    fixture.detectChanges();
    expect(confirmButton()).not.toBeNull();
    document
      .querySelector<HTMLButtonElement>(
        '.blog-modal .blog-btn:not(.blog-btn--danger)'
      )!
      .click();
    fixture.detectChanges();
    expect(fixture.componentInstance.open).toBeFalse();
    expect(api.ReelDelete).not.toHaveBeenCalled();
  });

  it('disables repeat submission and removes the reel only after backend success', () => {
    const removed = jasmine.createSpy();
    fixture.componentInstance.deleted.subscribe(removed);
    fixture.nativeElement.querySelector('.reel-delete').click();
    fixture.detectChanges();
    confirmButton().click();
    fixture.detectChanges();
    expect(confirmButton().disabled).toBeTrue();
    fixture.componentInstance.remove();
    expect(api.ReelDelete).toHaveBeenCalledOnceWith('mine');
    expect(removed).not.toHaveBeenCalled();
    response.next({ Success: true } as IReelCreateResponse);
    response.complete();
    fixture.detectChanges();
    expect(removed).toHaveBeenCalledOnceWith('mine');
    expect(fixture.componentInstance.open).toBeFalse();
  });

  it('keeps confirmation open for retry when Cloudinary cleanup fails', () => {
    api.ReelDelete.and.returnValue(
      of({
        Success: false,
        ErrorMessage: 'Cloudinary unavailable',
      } as IReelCreateResponse)
    );
    const removed = jasmine.createSpy();
    fixture.componentInstance.deleted.subscribe(removed);
    fixture.componentInstance.confirm();
    fixture.detectChanges();
    confirmButton().click();
    fixture.detectChanges();
    expect(fixture.componentInstance.open).toBeTrue();
    expect(fixture.componentInstance.deleting).toBeFalse();
    expect(removed).not.toHaveBeenCalled();
    expect(TestBed.inject(NzMessageService).error).toHaveBeenCalledWith(
      'Cloudinary unavailable'
    );
  });

  it('rechecks ownership if the account changes while confirmation is open', () => {
    fixture.componentInstance.confirm();
    account = 'other';
    fixture.componentInstance.remove();
    expect(api.ReelDelete).not.toHaveBeenCalled();
    expect(fixture.componentInstance.open).toBeFalse();
  });
});
