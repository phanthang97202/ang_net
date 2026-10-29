import { TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Subject, of } from 'rxjs';
import { PersonalNoteSharedComponent } from './personal-note-shared.component';
import { PersonalNoteService } from '../../services/personal-note.service';
import { AuthService } from '../../services/auth.service';
import { SharedPersonalNote } from '../../interfaces/personal-note';

describe('Shared note editing page', () => {
  let response: Subject<SharedPersonalNote>;
  let api: jasmine.SpyObj<PersonalNoteService>;
  let previousTitle: string;
  const token = 'b'.repeat(64);
  beforeEach(() => {
    previousTitle = document.title;
    response = new Subject();
    api = jasmine.createSpyObj<PersonalNoteService>('PersonalNoteService', [
      'sharedNote',
      'saveShared',
    ]);
    api.sharedNote.and.returnValue(response);
    TestBed.configureTestingModule({
      imports: [
        PersonalNoteSharedComponent,
        TranslateModule.forRoot(),
        NoopAnimationsModule,
      ],
      providers: [
        { provide: PersonalNoteService, useValue: api },
        { provide: ActivatedRoute, useValue: { paramMap: new Subject(), fragment: of(null) } },
        {
          provide: AuthService,
          useValue: { isLoggedIn: () => false, hasPermission: () => false },
        },
      ],
    });
  });
  afterEach(() => (document.title = previousTitle));
  it('loads a token from the URL fragment without putting it in the path', () => {
    TestBed.overrideProvider(ActivatedRoute, { useValue: { paramMap: of(convertToParamMap({})), fragment: of(token) } });
    const fixture = TestBed.createComponent(PersonalNoteSharedComponent);
    fixture.detectChanges();
    expect(api.sharedNote).toHaveBeenCalledWith(token);
  });
  it('loads an anonymous edit link into the full-page editor and stays open after saving', fakeAsync(() => {
    const params = TestBed.inject(ActivatedRoute).paramMap as Subject<
      ReturnType<typeof convertToParamMap>
    >;
    const fixture = TestBed.createComponent(PersonalNoteSharedComponent);
    fixture.detectChanges();
    params.next(convertToParamMap({ token }));
    expect(api.sharedNote).toHaveBeenCalledWith(token);
    response.next({
      Title: 'Shared',
      ContentJson: '{"type":"doc","content":[{"type":"paragraph"}]}',
      Version: 1,
    });
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    expect(
      fixture.nativeElement
        .querySelector('.tiptap')
        ?.getAttribute('contenteditable')
    ).toBe('true');
    const editor = fixture.nativeElement.querySelector(
      '.shared-editor'
    ) as HTMLElement;
    expect(
      Math.abs(editor.getBoundingClientRect().height - window.innerHeight)
    ).toBeLessThan(2);
    expect(
      fixture.nativeElement.querySelector(
        'nav, app-navbar, app-footer, .share-note, .editor-close'
      )
    ).toBeNull();
    const saved = new Subject<SharedPersonalNote>();
    api.saveShared.and.returnValue(saved);
    (
      fixture.nativeElement.querySelector(
        '.editor-buttons .primary'
      ) as HTMLButtonElement
    ).click();
    expect(api.saveShared).toHaveBeenCalled();
    saved.next({
      Title: 'Shared',
      ContentJson: '{"type":"doc","content":[{"type":"paragraph"}]}',
      Version: 2,
    });
    fixture.detectChanges();
    expect(fixture.componentInstance.note?.Version).toBe(2);
    expect(fixture.nativeElement.querySelector('.tiptap')).not.toBeNull();
    fixture.destroy();
    flush();
  }));
  it('renders a revoked edit link without creating an editor', fakeAsync(() => {
    const params = TestBed.inject(ActivatedRoute).paramMap as Subject<
      ReturnType<typeof convertToParamMap>
    >;
    const fixture = TestBed.createComponent(PersonalNoteSharedComponent);
    fixture.detectChanges();
    params.next(convertToParamMap({ token }));
    response.error({ status: 404 });
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('[role="alert"]').textContent
    ).toContain('T_PNOTE_SHARED_UNAVAILABLE');
    expect(
      fixture.nativeElement.querySelector('app-personal-note-editor')
    ).toBeNull();
    fixture.destroy();
    flush();
  }));

  it('replaces the editor and cancels pending saves when switching edit links', fakeAsync(() => {
    const params = TestBed.inject(ActivatedRoute).paramMap as Subject<
      ReturnType<typeof convertToParamMap>
    >;
    const fixture = TestBed.createComponent(PersonalNoteSharedComponent);
    fixture.detectChanges();
    params.next(convertToParamMap({ token }));
    const oldNote = {
      Title: 'First note',
      ContentJson: '{"type":"doc","content":[{"type":"paragraph"}]}',
      Version: 1,
    };
    response.next(oldNote);
    fixture.detectChanges();
    tick();
    const pendingSave = new Subject<SharedPersonalNote>();
    api.saveShared.and.returnValue(pendingSave);
    (
      fixture.nativeElement.querySelector('.primary') as HTMLButtonElement
    ).click();
    const nextToken = 'c'.repeat(64);
    api.sharedNote.and.returnValue(
      of({ ...oldNote, Title: 'Second note', Version: 7 })
    );
    params.next(convertToParamMap({ token: nextToken }));
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    expect(pendingSave.observed).toBeFalse();
    expect(
      (
        fixture.nativeElement.querySelector(
          '#personal-note-title'
        ) as HTMLInputElement
      ).value
    ).toBe('Second note');
    fixture.componentInstance.saved({
      ...oldNote,
      NoteId: token,
      Preview: '',
      CreatedAt: '',
      UpdatedAt: '',
    });
    expect(fixture.componentInstance.note?.Title).toBe('Second note');
    fixture.destroy();
    flush();
  }));
});
