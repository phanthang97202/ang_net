import { TestBed } from '@angular/core/testing';
import { registerLocaleData } from '@angular/common';
import localeVi from '@angular/common/locales/vi';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NZ_ICONS } from 'ng-zorro-antd/icon';
import { NZ_I18N, vi_VN } from 'ng-zorro-antd/i18n';
import * as icons from '@ant-design/icons-angular/icons';
import { BehaviorSubject, of } from 'rxjs';
import {
  ChatService,
  LangService,
  LoadingService,
  ShowErrorService,
} from '../../../services';
import { MessageListComponent } from './message-list.component';

describe('MessageListComponent', () => {
  let chat: jasmine.SpyObj<ChatService>;

  beforeEach(() => {
    registerLocaleData(localeVi);
    chat = jasmine.createSpyObj('ChatService', [
      'searchMessages',
      'getAdminImage',
    ]);
    chat.searchMessages.and.returnValue(
      of({
        Success: true,
        objResult: {
          DataList: [
            {
              MessageId: 'm1',
              Sequence: 1,
              SenderName: 'Nguyễn Gửi',
              SenderEmail: 'sender@example.com',
              SenderUsername: 'hotel.sender',
              UserId: 'account:sender',
              Message: 'Lịch trực khách sạn',
              Type: 'string',
              CreatedDTime: new Date('2026-11-05T10:00:00Z'),
              IsDeleted: false,
            },
          ],
          ItemCount: 1,
          PageIndex: 0,
          PageSize: 20,
          PageCount: 1,
        },
      } as any)
    );
    const language = new BehaviorSubject('vi');
    TestBed.configureTestingModule({
      imports: [
        MessageListComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot(),
      ],
      providers: [
        provideRouter([]),
        { provide: ChatService, useValue: chat },
        { provide: LoadingService, useValue: { setLoading: () => undefined } },
        {
          provide: ShowErrorService,
          useValue: { setShowError: () => undefined },
        },
        { provide: NZ_ICONS, useValue: Object.values(icons) },
        { provide: NZ_I18N, useValue: vi_VN },
        {
          provide: LangService,
          useValue: {
            getLang: () => 'vi',
            $langSubjectObservable: language.asObservable(),
          },
        },
      ],
    });
  });

  it('searches by keyword and a full inclusive local date range', () => {
    const fixture = TestBed.createComponent(MessageListComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.pageIndex = 3;
    component.searchForm.setValue({
      Keyword: 'hotel.sender',
      DateRange: [new Date(2026, 10, 5), new Date(2026, 10, 6)],
      DeletionStatus: 'deleted',
    });
    component.handleSearch();

    expect(chat.searchMessages.calls.mostRecent().args[0]).toEqual({
      pageIndex: 0,
      pageSize: 20,
      keyword: 'hotel.sender',
      sentFrom: new Date(2026, 10, 5).toISOString(),
      sentBefore: new Date(2026, 10, 7).toISOString(),
      isDeleted: true,
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Nguyễn Gửi');
    expect(fixture.nativeElement.textContent).toContain('sender@example.com');
    expect(fixture.nativeElement.textContent).toContain('Lịch trực khách sạn');
    fixture.destroy();
  });

  it('resets filters and returns to the first page', () => {
    const fixture = TestBed.createComponent(MessageListComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.pageIndex = 4;
    component.searchForm.setValue({
      Keyword: 'sender',
      DateRange: [new Date(2026, 10, 5), new Date(2026, 10, 6)],
      DeletionStatus: 'active',
    });
    component.handleReset();
    expect(component.pageIndex).toBe(1);
    expect(component.searchForm.getRawValue()).toEqual({
      Keyword: '',
      DateRange: [],
      DeletionStatus: 'all',
    });
    expect(chat.searchMessages.calls.mostRecent().args[0]).toEqual(
      jasmine.objectContaining({
        pageIndex: 0,
        keyword: '',
        sentFrom: undefined,
        sentBefore: undefined,
        isDeleted: undefined,
      })
    );
    fixture.destroy();
  });

  it('loads a stored image for the admin preview and releases its URL', async () => {
    const fixture = TestBed.createComponent(MessageListComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const image = {
      MessageId: 'image-1',
      Sequence: 2,
      UserId: 'account:sender',
      Message: '[Hình ảnh]',
      Type: 'image',
      CreatedDTime: new Date('2026-11-05T10:00:00Z'),
      IsDeleted: true,
    } as const;
    chat.getAdminImage.and.returnValue(of(new Blob(['image'])));
    const createUrl = spyOn(URL, 'createObjectURL').and.returnValue(
      'blob:admin-preview'
    );
    const revokeUrl = spyOn(URL, 'revokeObjectURL');

    await component.openImage(image);

    expect(chat.getAdminImage).toHaveBeenCalledWith('image-1');
    expect(createUrl).toHaveBeenCalled();
    expect(component.previewVisible).toBeTrue();
    expect(component.previewImage).toBe('blob:admin-preview');

    component.closeImagePreview();
    expect(revokeUrl).toHaveBeenCalledWith('blob:admin-preview');
    fixture.destroy();
  });
});
