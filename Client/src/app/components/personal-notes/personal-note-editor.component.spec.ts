import { TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NZ_ICONS } from 'ng-zorro-antd/icon';
import {
  ExclamationCircleOutline,
  QuestionCircleOutline,
  CloseOutline,
} from '@ant-design/icons-angular/icons';
import { Subject } from 'rxjs';
import { PersonalNoteEditorComponent } from './personal-note-editor.component';
import { PersonalNoteService } from '../../services/personal-note.service';
import { AuthService } from '../../services/auth.service';
import { PersonalNote } from '../../interfaces/personal-note';

describe('Personal note Tiptap editor', () => {
  let api: jasmine.SpyObj<PersonalNoteService>;
  let response: Subject<PersonalNote>;
  let permitted: boolean;
  const id = 'ae7a323a-64b5-4b69-b2d8-7a713fcebb15';
  beforeEach(() => {
    response = new Subject();
    permitted = true;
    api = jasmine.createSpyObj<PersonalNoteService>('PersonalNoteService', [
      'save',
    ]);
    api.save.and.returnValue(response);
    TestBed.configureTestingModule({
      imports: [
        PersonalNoteEditorComponent,
        TranslateModule.forRoot(),
        NoopAnimationsModule,
        NzModalModule,
      ],
      providers: [
        { provide: PersonalNoteService, useValue: api },
        {
          provide: AuthService,
          useValue: {
            isLoggedIn: () => true,
            hasPermission: (key: string) =>
              permitted && key === 'personalnote.use',
            getAccountInfo: () => ({ nameid: 'owner' }),
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
  function create(note: PersonalNote | null = null) {
    const fixture = TestBed.createComponent(PersonalNoteEditorComponent);
    fixture.componentRef.setInput('noteId', id);
    fixture.componentRef.setInput('ownerId', 'owner');
    fixture.componentRef.setInput('note', note);
    fixture.detectChanges();
    tick();
    return fixture;
  }

  it('does not save when module permission has been removed', fakeAsync(() => {
    const fixture = create();
    fixture.componentInstance.title = 'Private';
    permitted = false;
    expect(fixture.componentInstance.canSave).toBeFalse();
    fixture.componentInstance.save();
    expect(api.save).not.toHaveBeenCalled();
    fixture.destroy();
    flush();
  }));
  it('creates rich Tiptap JSON, saves once and keeps the editor locked while saving', fakeAsync(() => {
    const fixture = create();
    const component = fixture.componentInstance;
    component.title = 'A private note';
    component.editor!.commands.setContent(
      '<p>Hello <strong>world</strong></p>'
    );
    fixture.detectChanges();
    const saved = jasmine.createSpy('saved');
    component.saved.subscribe(saved);
    component.save();
    component.save();
    expect(api.save).toHaveBeenCalledTimes(1);
    const [noteId, body] = api.save.calls.mostRecent().args;
    expect(noteId).toBe(id);
    expect(body.Title).toBe('A private note');
    expect(body.Version).toBe(0);
    expect(
      JSON.parse(body.ContentJson).content[0].content[1].marks[0].type
    ).toBe('bold');
    expect(component.editor!.isEditable).toBeFalse();
    response.next({
      NoteId: id,
      Title: body.Title,
      ContentJson: body.ContentJson,
      Version: 1,
      Preview: 'Hello world',
      CreatedAt: '',
      UpdatedAt: '',
    });
    expect(saved).toHaveBeenCalledTimes(1);
    expect(component.dirty).toBeFalse();
    fixture.destroy();
    flush();
  }));

  it('opens an existing note and submits its version when saving with Ctrl+S', fakeAsync(() => {
    const content = JSON.stringify({
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Saved text' }] },
      ],
    });
    const fixture = create({
      NoteId: id,
      Title: 'Existing note',
      ContentJson: content,
      Version: 4,
      Preview: 'Saved text',
      CreatedAt: '',
      UpdatedAt: '',
    });
    expect(fixture.componentInstance.editor!.getText()).toContain('Saved text');
    expect(fixture.componentInstance.dirty).toBeFalse();
    fixture.componentInstance.title = 'Updated';
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 's', ctrlKey: true, bubbles: true })
    );
    expect(api.save.calls.mostRecent().args[1].Version).toBe(4);
    response.error({ status: 409 });
    fixture.detectChanges();
    expect(fixture.componentInstance.errorKey).toBe('T_PNOTE_CONFLICT');
    expect(fixture.componentInstance.editor!.getText()).toContain('Saved text');
    expect(fixture.componentInstance.editor!.isEditable).toBeTrue();
    expect(fixture.componentInstance.dirty).toBeTrue();
    fixture.destroy();
    flush();
  }));

  it('requires confirmation before discarding unsaved content and does not close on Cancel', fakeAsync(() => {
    const fixture = create();
    const component = fixture.componentInstance;
    component.title = 'Unsaved title';
    const closed = jasmine.createSpy('closed');
    component.closed.subscribe(closed);
    component.requestClose();
    fixture.detectChanges();
    tick(500);
    expect(closed).not.toHaveBeenCalled();
    const cancel = document.querySelector(
      '.ant-modal-confirm-btns button:first-child'
    ) as HTMLButtonElement;
    expect(cancel).not.toBeNull();
    cancel.click();
    tick(500);
    fixture.detectChanges();
    expect(closed).not.toHaveBeenCalled();
    expect(component.title).toBe('Unsaved title');
    component.requestClose();
    fixture.detectChanges();
    tick(500);
    (
      document.querySelector(
        '.ant-modal-confirm-btns .ant-btn-primary'
      ) as HTMLButtonElement
    ).click();
    tick(500);
    expect(closed).toHaveBeenCalledTimes(1);
    fixture.destroy();
    flush();
  }));

  it('keeps invalid links out of the document and protects unsaved work on browser close', fakeAsync(() => {
    const fixture = create();
    const component = fixture.componentInstance;
    component.title = 'Remember this';
    component.linkUrl = 'javascript:alert(1)';
    component.applyLink();
    expect(component.errorKey).toBe('T_PNOTE_LINK_ERROR');
    expect(component.editor!.getHTML()).not.toContain('javascript:');
    const event = new Event('beforeunload', {
      cancelable: true,
    }) as BeforeUnloadEvent;
    component.beforeUnload(event);
    expect(event.defaultPrevented).toBeTrue();
    fixture.destroy();
    flush();
  }));
});
