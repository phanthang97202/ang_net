import {
  TestBed,
  fakeAsync,
  tick,
  DeferBlockBehavior,
} from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NZ_ICONS } from 'ng-zorro-antd/icon';
import {
  ExclamationCircleOutline,
  QuestionCircleOutline,
  CloseOutline,
} from '@ant-design/icons-angular/icons';
import { of, Subject } from 'rxjs';
import { PersonalNotesWidgetComponent } from './personal-notes-widget.component';
import { PersonalNoteEditorComponent } from './personal-note-editor.component';
import { getDebugNode } from '@angular/core';
import { PersonalNoteService } from '../../services/personal-note.service';
import { AuthService } from '../../services/auth.service';
import {
  PersonalNote,
  PersonalNotePage,
  PersonalNoteSummary,
} from '../../interfaces/personal-note';

describe('Personal notes floating widget', () => {
  let api: jasmine.SpyObj<PersonalNoteService>;
  let account: string;
  let permitted: boolean;
  let list: Subject<PersonalNotePage>;
  const note: PersonalNoteSummary = {
    NoteId: 'ae7a323a-64b5-4b69-b2d8-7a713fcebb15',
    Title: 'My private note',
    Preview: 'Only me',
    Version: 2,
    CreatedAt: '2026-10-19T00:00:00Z',
    UpdatedAt: '2026-10-19T00:00:00Z',
  };
  beforeEach(() => {
    account = 'owner';
    permitted = true;
    list = new Subject();
    api = jasmine.createSpyObj<PersonalNoteService>('PersonalNoteService', [
      'list',
      'get',
      'save',
      'delete',
    ]);
    api.list.and.returnValue(list);
    api.delete.and.returnValue(of(undefined));
    TestBed.configureTestingModule({
      imports: [
        PersonalNotesWidgetComponent,
        TranslateModule.forRoot(),
        NoopAnimationsModule,
      ],
      deferBlockBehavior: DeferBlockBehavior.Manual,
      providers: [
        { provide: PersonalNoteService, useValue: api },
        {
          provide: AuthService,
          useValue: {
            isLoggedIn: () => !!account,
            hasPermission: (key: string) =>
              permitted && key === 'personalnote.use',
            getAccountInfo: () => ({ nameid: account }),
          },
        },
        {
          provide: NzMessageService,
          useValue: {
            success: jasmine.createSpy(),
            error: jasmine.createSpy(),
          },
        },
        {
          provide: NZ_ICONS,
          useValue: [
            ExclamationCircleOutline,
            QuestionCircleOutline,
            CloseOutline,
          ],
        },
      ],
    });
  });
  function openList() {
    const fixture = TestBed.createComponent(PersonalNotesWidgetComponent);
    fixture.detectChanges();
    expect(api.list).not.toHaveBeenCalled();
    (
      fixture.nativeElement.querySelector(
        '.personal-notes-toggle'
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    tick(500);
    fixture.detectChanges();
    list.next({ DataList: [note], HasMore: false, NextCursor: null });
    fixture.detectChanges();
    return fixture;
  }
  it('hides the icon and blocks every action without the module permission', fakeAsync(() => {
    permitted = false;
    const fixture = TestBed.createComponent(PersonalNotesWidgetComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(
      fixture.nativeElement.querySelector('.personal-notes-toggle')
    ).toBeNull();
    component.visibleChange(true);
    component.load(true);
    component.create();
    component.edit(note);
    component.confirmDelete(note);
    expect(component.listOpen).toBeFalse();
    expect(component.editorVisible).toBeFalse();
    expect(api.list).not.toHaveBeenCalled();
    expect(api.get).not.toHaveBeenCalled();
    expect(api.delete).not.toHaveBeenCalled();
    fixture.destroy();
    tick(500);
  }));
  it('clears private content and cancels requests when the same account loses permission', fakeAsync(() => {
    const fixture = openList();
    const component = fixture.componentInstance;
    const detail = new Subject<PersonalNote>();
    api.get.and.returnValue(detail);
    component.edit(note);
    permitted = false;
    fixture.detectChanges();
    expect(component.accountId).toBe('');
    expect(component.items).toEqual([]);
    expect(component.listOpen).toBeFalse();
    expect(detail.observed).toBeFalse();
    expect(
      fixture.nativeElement.querySelector('.personal-notes-toggle')
    ).toBeNull();
    permitted = true;
    fixture.detectChanges();
    component.create();
    fixture.detectChanges();
    expect(component.editorVisible).toBeTrue();
    permitted = false;
    fixture.detectChanges();
    expect(component.editorVisible).toBeFalse();
    expect(component.editingNote).toBeNull();
    fixture.destroy();
    tick(500);
  }));
  it('loads only after clicking the icon and creates a 90% browser-sized editor popup', fakeAsync(() => {
    const fixture = openList();
    const launcher = fixture.nativeElement.querySelector(
      '.personal-notes-toggle'
    ) as HTMLButtonElement;
    expect(getComputedStyle(launcher).width).toBe(
      window.innerWidth <= 768 ? '44px' : '48px'
    );
    expect(getComputedStyle(launcher).right).toBe(
      window.innerWidth <= 768 ? '70px' : '84px'
    );
    expect(document.querySelector('.note-open')?.textContent).toContain(
      'My private note'
    );
    (document.querySelector('.new-note') as HTMLButtonElement).click();
    fixture.detectChanges();
    tick(500);
    fixture.detectChanges();
    expect(fixture.componentInstance.editorVisible).toBeTrue();
    expect(fixture.componentInstance.editingNote).toBeNull();
    const modals = document.querySelectorAll<HTMLElement>(
      '.personal-note-modal'
    );
    const modal = modals[modals.length - 1];
    expect(modal).not.toBeNull();
    expect(modal.style.width).toBe('90vw');
    expect(
      Math.abs(modal.getBoundingClientRect().width - window.innerWidth * 0.9)
    ).toBeLessThan(2);
    expect(modal.style.top).toBe('5dvh');
    fixture.destroy();
    tick(500);
  }));
  it('opens the selected note with its stored content for editing', fakeAsync(() => {
    api.get.and.returnValue(
      of({
        ...note,
        ContentJson: '{"type":"doc","content":[{"type":"paragraph"}]}',
      })
    );
    const fixture = openList();
    (document.querySelector('.note-open') as HTMLButtonElement).click();
    fixture.detectChanges();
    tick(500);
    expect(api.get).toHaveBeenCalledWith(note.NoteId);
    expect(fixture.componentInstance.editingNote?.Version).toBe(2);
    expect(fixture.componentInstance.editorOwner).toBe('owner');
    fixture.destroy();
    tick(500);
  }));

  it('uses the corner position when the account has no chat access', fakeAsync(() => {
    const fixture = TestBed.createComponent(PersonalNotesWidgetComponent);
    fixture.componentRef.setInput('hasChat', false);
    fixture.detectChanges();
    const launcher = fixture.nativeElement.querySelector(
      '.personal-notes-toggle'
    ) as HTMLButtonElement;
    expect(getComputedStyle(launcher).right).toBe(
      window.innerWidth <= 768 ? '16px' : '24px'
    );
    fixture.destroy();
    tick(500);
  }));

  it('loads the deferred Tiptap editor, saves a new note and returns to the refreshed list', async () => {
    TestBed.configureTestingModule({
      deferBlockBehavior: DeferBlockBehavior.Playthrough,
    });
    const fixture = TestBed.createComponent(PersonalNotesWidgetComponent);
    fixture.detectChanges();
    fixture.componentInstance.create();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const editorElement = document.querySelector('app-personal-note-editor');
    expect(editorElement).not.toBeNull();
    expect(
      Math.abs(
        (
          editorElement!.querySelector('.note-editor') as HTMLElement
        ).getBoundingClientRect().height -
          window.innerHeight * 0.9
      )
    ).toBeLessThan(2);
    const editor = getDebugNode(editorElement!)!
      .componentInstance as PersonalNoteEditorComponent;
    editor.title = 'A new idea';
    editor.editor!.commands.setContent('<p>My private idea</p>');
    fixture.detectChanges();
    const body = JSON.stringify(editor.editor!.getJSON());
    api.save.and.returnValue(
      of({
        ...note,
        NoteId: editor.noteId,
        Title: 'A new idea',
        Version: 1,
        ContentJson: body,
      })
    );
    (
      document.querySelector('.editor-buttons .primary') as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(api.save).toHaveBeenCalledOnceWith(editor.noteId, {
      Title: 'A new idea',
      Version: 0,
      ContentJson: body,
    });
    expect(fixture.componentInstance.editorVisible).toBeFalse();
    expect(fixture.componentInstance.listOpen).toBeTrue();
    list.next({
      DataList: [{ ...note, Title: 'A new idea' }],
      HasMore: false,
      NextCursor: null,
    });
    fixture.detectChanges();
    expect(document.querySelector('.note-open')?.textContent).toContain(
      'A new idea'
    );
    fixture.destroy();
    await fixture.whenStable();
  });
  it('never deletes before confirmation, keeps notes on Cancel and deletes with the displayed version', fakeAsync(() => {
    const fixture = openList();
    (document.querySelector('.note-delete') as HTMLButtonElement).click();
    fixture.detectChanges();
    tick(500);
    expect(api.delete).not.toHaveBeenCalled();
    (
      document.querySelector(
        '.ant-modal-confirm-btns button:first-child'
      ) as HTMLButtonElement
    ).click();
    tick(500);
    fixture.detectChanges();
    expect(api.delete).not.toHaveBeenCalled();
    expect(fixture.componentInstance.items.length).toBe(1);
    expect(fixture.componentInstance.listOpen).toBeTrue();
    tick(500);
    fixture.detectChanges();
    (document.querySelector('.note-delete') as HTMLButtonElement).click();
    fixture.detectChanges();
    tick(500);
    (
      document.querySelector(
        '.ant-modal-confirm-btns .ant-btn-primary'
      ) as HTMLButtonElement
    ).click();
    tick(500);
    fixture.detectChanges();
    expect(api.delete).toHaveBeenCalledOnceWith(note.NoteId, 2);
    expect(fixture.componentInstance.items.length).toBe(0);
    fixture.destroy();
    tick(500);
  }));
  it('clears private state and ignores pending old-account responses on account switch', fakeAsync(() => {
    const fixture = openList();
    const detail = new Subject<PersonalNote>();
    api.get.and.returnValue(detail);
    fixture.componentInstance.edit(note);
    account = 'other';
    fixture.detectChanges();
    tick(500);
    detail.next({ ...note, ContentJson: '{}' });
    list.next({ DataList: [note], HasMore: false, NextCursor: null });
    expect(fixture.componentInstance.items).toEqual([]);
    expect(fixture.componentInstance.editorVisible).toBeFalse();
    expect(fixture.componentInstance.editingNote).toBeNull();
    expect(fixture.componentInstance.listOpen).toBeFalse();
    fixture.destroy();
    tick(500);
  }));
  it('debounces search and appends cursor pages without duplicating notes', fakeAsync(() => {
    const fixture = openList();
    fixture.componentInstance.keyword = 'idea';
    fixture.componentInstance.searchChanged();
    tick(249);
    expect(api.list).toHaveBeenCalledTimes(1);
    tick(1);
    expect(api.list).toHaveBeenCalledWith('idea', null);
    list.next({ DataList: [note], HasMore: true, NextCursor: 'page2' });
    fixture.componentInstance.load();
    expect(api.list).toHaveBeenCalledWith('idea', 'page2');
    list.next({
      DataList: [note, { ...note, NoteId: 'another', Title: 'Another idea' }],
      HasMore: false,
      NextCursor: null,
    });
    expect(fixture.componentInstance.items.length).toBe(2);
    fixture.destroy();
    tick(500);
  }));
});
