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
import { Clipboard } from '@angular/cdk/clipboard';

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
      'publish',
      'unpublish',
      'revokeEditing',
      'saveShared',
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
  function create(
    note: PersonalNote | null = null,
    sharedToken: string | null = null
  ) {
    const fixture = TestBed.createComponent(PersonalNoteEditorComponent);
    fixture.componentRef.setInput('noteId', id);
    fixture.componentRef.setInput('ownerId', 'owner');
    fixture.componentRef.setInput('note', note);
    fixture.componentRef.setInput('sharedToken', sharedToken);
    fixture.detectChanges();
    tick();
    return fixture;
  }

  it('serializes the default null link title sent with pasted URLs', fakeAsync(() => {
    const fixture = create();
    const component = fixture.componentInstance;
    component.title = 'Cloudflare setup';
    component.editor!.commands.setContent(
      '<p>Visit <a href="https://dash.cloudflare.com">Cloudflare</a>.</p>'
    );
    component.save();
    const document = JSON.parse(
      api.save.calls.mostRecent().args[1].ContentJson
    );
    const link = document.content[0].content.find(
      (node: { marks?: unknown[] }) => node.marks
    ).marks[0];
    expect(link).toEqual({
      type: 'link',
      attrs: {
        href: 'https://dash.cloudflare.com',
        target: '_blank',
        rel: 'noopener noreferrer nofollow',
        class: null,
        title: null,
      },
    });
    fixture.destroy();
    flush();
  }));

  it('does not save when module permission has been removed', fakeAsync(() => {
    const fixture = create();
    fixture.componentInstance.title = 'Private';
    permitted = false;
    expect(fixture.componentInstance.canSave).toBeFalse();
    fixture.componentInstance.save();
    fixture.componentInstance.publish();
    expect(api.save).not.toHaveBeenCalled();
    expect(api.publish).not.toHaveBeenCalled();
    fixture.destroy();
    flush();
  }));

  it('keeps standard numbering from pasted ordered lists in the save request', fakeAsync(() => {
    const fixture = create();
    const component = fixture.componentInstance;
    component.title = 'Cloudflare setup';
    component.editor!.commands.setContent(
      '<h2>Add the domain</h2><ol type="1"><li><p>Log in to Cloudflare</p></li></ol>'
    );
    component.save();
    const document = JSON.parse(
      api.save.calls.mostRecent().args[1].ContentJson
    );
    expect(document.content[1].type).toBe('orderedList');
    expect(document.content[1].attrs).toEqual({ start: 1, type: '1' });
    expect(document.content[1].content[0].content[0].content[0].text).toBe(
      'Log in to Cloudflare'
    );
    fixture.destroy();
    flush();
  }));

  it('creates a separate edit link only when editing is selected and revokes it while keeping view access', fakeAsync(() => {
    const fixture = create();
    const component = fixture.componentInstance;
    component.title = 'Shared note';
    component.allowEditing = true;
    api.publish.and.returnValue(response);
    component.publish();
    expect(api.publish.calls.mostRecent().args[1].AllowEditing).toBeTrue();
    const published: PersonalNote = {
      NoteId: id,
      Title: component.title,
      ContentJson: JSON.stringify(component.editor!.getJSON()),
      PublicToken: 'a'.repeat(64),
      EditToken: 'b'.repeat(64),
      Version: 1,
      Preview: '',
      CreatedAt: '',
      UpdatedAt: '',
    };
    response.next(published);
    fixture.detectChanges();
    expect(component.editUrl).toContain(
      '/shared-note/edit#' + 'b'.repeat(64)
    );
    expect(component.editUrl).not.toBe(component.publicUrl);
    const clipboard = spyOn(TestBed.inject(Clipboard), 'copy').and.returnValue(
      true
    );
    component.copyEditLink();
    expect(clipboard).toHaveBeenCalledWith(component.editUrl);
    expect(
      fixture.nativeElement.querySelectorAll('.publication-link input').length
    ).toBe(2);
    const revoke = new Subject<PersonalNote>();
    api.revokeEditing.and.returnValue(revoke);
    component.editor!.commands.insertContent('Private changes');
    component.revokeEditing();
    expect(api.revokeEditing).toHaveBeenCalledOnceWith(id, 1);
    revoke.next({ ...published, EditToken: null, Version: 2 });
    fixture.detectChanges();
    expect(component.editToken).toBeNull();
    expect(component.publicToken).toBe(published.PublicToken!);
    expect(component.dirty).toBeTrue();
    expect(component.editor!.getText()).toContain('Private changes');
    expect(
      fixture.nativeElement.querySelectorAll('.publication-link input').length
    ).toBe(1);
    fixture.destroy();
    flush();
  }));

  it('lets an edit-key holder save without login, hides sharing controls and preserves work after a stale save', fakeAsync(() => {
    permitted = false;
    const token = 'e'.repeat(64);
    const note: PersonalNote = {
      NoteId: token,
      Title: 'Shared note',
      ContentJson: '{"type":"doc","content":[{"type":"paragraph"}]}',
      Version: 3,
      Preview: '',
      CreatedAt: '',
      UpdatedAt: '',
    };
    const fixture = create(note, token),
      component = fixture.componentInstance;
    const result = new Subject<{
      Title: string;
      ContentJson: string;
      Version: number;
    }>();
    api.saveShared.and.returnValue(result);
    component.editor!.commands.insertContent('Shared changes');
    fixture.detectChanges();
    expect(component.canSave).toBeTrue();
    expect(
      fixture.nativeElement.querySelector(
        '.editor-close, .share-note, .publication-panel'
      )
    ).toBeNull();
    component.save();
    expect(api.saveShared).toHaveBeenCalledOnceWith(token, {
      Title: note.Title,
      ContentJson: JSON.stringify(component.editor!.getJSON()),
      Version: 3,
    });
    expect(api.save).not.toHaveBeenCalled();
    result.next({
      Title: note.Title,
      ContentJson: api.saveShared.calls.mostRecent().args[1].ContentJson,
      Version: 4,
    });
    fixture.detectChanges();
    expect(component.version).toBe(4);
    expect(component.dirty).toBeFalse();
    expect(fixture.nativeElement.textContent).toContain('T_PNOTE_SAVED');
    component.editor!.commands.insertContent('Unsaved changes');
    const stale = new Subject<{
      Title: string;
      ContentJson: string;
      Version: number;
    }>();
    api.saveShared.and.returnValue(stale);
    component.save();
    stale.error({ status: 409 });
    expect(component.errorKey).toBe('T_PNOTE_CONFLICT');
    expect(component.editor!.isEditable).toBeTrue();
    expect(component.dirty).toBeTrue();
    expect(component.editor!.getText()).toContain('Unsaved changes');
    component.publicToken = 'a'.repeat(64);
    component.editToken = token;
    component.publish();
    component.unpublish();
    component.revokeEditing();
    expect(api.publish).not.toHaveBeenCalled();
    expect(api.unpublish).not.toHaveBeenCalled();
    expect(api.revokeEditing).not.toHaveBeenCalled();
    fixture.destroy();
    flush();
  }));

  it('publishes the current draft, copies the public link and revokes it while preserving new private changes', fakeAsync(() => {
    const fixture = create();
    const component = fixture.componentInstance;
    const publication = new Subject<PersonalNote>();
    const revocation = new Subject<PersonalNote>();
    api.publish.and.returnValue(publication);
    api.unpublish.and.returnValue(revocation);
    const clipboard = spyOn(TestBed.inject(Clipboard), 'copy').and.returnValue(
      true
    );
    const changed = jasmine.createSpy('publicationChanged');
    const closed = jasmine.createSpy('closed');
    component.publicationChanged.subscribe(changed);
    component.closed.subscribe(closed);
    component.title = 'Public idea';
    component.editor!.commands.setContent('<p>Published body</p>');
    component.publish();
    expect(api.publish).toHaveBeenCalledOnceWith(id, {
      Title: 'Public idea',
      ContentJson: JSON.stringify(component.editor!.getJSON()),
      Version: 0,
    });
    expect(component.editor!.isEditable).toBeFalse();
    const published: PersonalNote = {
      NoteId: id,
      Title: 'Public idea',
      ContentJson: api.publish.calls.mostRecent().args[1].ContentJson,
      Version: 1,
      PublicToken: 'a'.repeat(64),
      PublishedAt: '2026-10-19T00:00:00Z',
      Preview: '',
      CreatedAt: '',
      UpdatedAt: '',
    };
    publication.next(published);
    fixture.detectChanges();
    expect(component.dirty).toBeFalse();
    expect(component.shareOpen).toBeTrue();
    expect(component.publicUrl).toContain('/shared-note/view#' + 'a'.repeat(64));
    expect(
      fixture.nativeElement.querySelector('.publication-link input').value
    ).toBe(component.publicUrl);
    component.copyPublicLink();
    expect(clipboard).toHaveBeenCalledWith(component.publicUrl);
    expect(component.copied).toBeTrue();
    expect(closed).not.toHaveBeenCalled();
    expect(changed).toHaveBeenCalledOnceWith(published);
    component.editor!.commands.insertContent('Private draft');
    expect(component.dirty).toBeTrue();
    component.unpublish();
    expect(api.unpublish).toHaveBeenCalledOnceWith(id, 1);
    revocation.next({
      ...published,
      PublicToken: null,
      PublishedAt: null,
      Version: 2,
    });
    expect(component.publicToken).toBeNull();
    expect(component.version).toBe(2);
    expect(component.dirty).toBeTrue();
    expect(component.editor!.getText()).toContain('Private draft');
    fixture.destroy();
    flush();
  }));

  it('keeps the draft editable after a publication conflict and never publishes automatically on save', fakeAsync(() => {
    const fixture = create();
    const component = fixture.componentInstance;
    component.title = 'Draft';
    api.publish.and.returnValue(response);
    component.publish();
    response.error({ status: 409 });
    expect(component.errorKey).toBe('T_PNOTE_CONFLICT');
    expect(component.dirty).toBeTrue();
    expect(component.editor!.isEditable).toBeTrue();
    expect(component.publicToken).toBeNull();
    api.publish.calls.reset();
    api.save.and.returnValue(new Subject());
    component.save();
    expect(api.publish).not.toHaveBeenCalled();
    expect(api.save).toHaveBeenCalled();
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

  function pasteImage(fixture: ReturnType<typeof create>, file: File) {
    const clipboard = new DataTransfer();
    clipboard.items.add(file);
    const event = new ClipboardEvent('paste', {
      clipboardData: clipboard,
      bubbles: true,
      cancelable: true,
    });
    fixture.nativeElement.querySelector('.tiptap').dispatchEvent(event);
    return event;
  }

  it('pastes a screenshot as base64, saves it and renders it when reopened', async () => {
    const fixture = TestBed.createComponent(PersonalNoteEditorComponent);
    fixture.componentRef.setInput('noteId', id);
    fixture.componentRef.setInput('ownerId', 'owner');
    fixture.detectChanges();
    await fixture.whenStable();
    const component = fixture.componentInstance;
    component.title = 'Screenshot';
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 2;
    canvas.getContext('2d')!.fillRect(0, 0, 2, 2);
    const base64 = canvas.toDataURL('image/png').split(',')[1];
    const file = new File(
      [Uint8Array.from(atob(base64), char => char.charCodeAt(0))],
      'screenshot.png',
      { type: 'image/png' }
    );
    const originalRead = FileReader.prototype.readAsDataURL;
    const imageRead = new Promise<void>(resolve => {
      spyOn(FileReader.prototype, 'readAsDataURL').and.callFake(function (
        this: FileReader,
        blob: Blob
      ) {
        this.addEventListener('loadend', () => resolve(), { once: true });
        originalRead.call(this, blob);
      });
    });
    const event = pasteImage(fixture, file);
    expect(event.defaultPrevented).toBeTrue();
    expect(component.insertingImages).toBeTrue();
    expect(component.canSave).toBeFalse();
    await imageRead;
    await fixture.whenStable();
    fixture.detectChanges();
    expect(component.insertingImages).toBeFalse();
    const image = fixture.nativeElement.querySelector(
      '.tiptap img'
    ) as HTMLImageElement;
    expect(image).not.toBeNull();
    expect(image.getAttribute('src')).toBe('data:image/png;base64,' + base64);
    await image.decode();
    expect(image.naturalWidth).toBe(2);
    expect(component.dirty).toBeTrue();
    expect(fixture.nativeElement.querySelector('.editor-head h2')).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('T_PNOTE_PRIVATE');
    component.save();
    const body = api.save.calls.mostRecent().args[1];
    expect(body.ContentJson).toContain('data:image/png;base64,' + base64);
    const note: PersonalNote = {
      NoteId: id,
      Title: body.Title,
      ContentJson: body.ContentJson,
      Version: 1,
      Preview: '',
      CreatedAt: '',
      UpdatedAt: '',
    };
    response.next(note);
    fixture.destroy();
    const reopened = TestBed.createComponent(PersonalNoteEditorComponent);
    reopened.componentRef.setInput('noteId', id);
    reopened.componentRef.setInput('ownerId', 'owner');
    reopened.componentRef.setInput('note', note);
    reopened.detectChanges();
    await reopened.whenStable();
    expect(
      reopened.nativeElement.querySelector('.tiptap img').getAttribute('src')
    ).toBe('data:image/png;base64,' + base64);
    expect(reopened.componentInstance.dirty).toBeFalse();
    reopened.destroy();
  });

  it('rejects oversized images and SVG without altering the note, and blocks images after permission loss', fakeAsync(() => {
    const fixture = create();
    const component = fixture.componentInstance;
    const initial = JSON.stringify(component.editor!.getJSON());
    pasteImage(
      fixture,
      new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'large.png', {
        type: 'image/png',
      })
    );
    expect(component.errorKey).toBe('T_PNOTE_IMAGE_SIZE_ERROR');
    pasteImage(
      fixture,
      new File(['<svg/>'], 'image.svg', { type: 'image/svg+xml' })
    );
    expect(component.errorKey).toBe('T_PNOTE_IMAGE_TYPE_ERROR');
    permitted = false;
    pasteImage(
      fixture,
      new File(['small'], 'small.png', { type: 'image/png' })
    );
    expect(component.insertingImages).toBeFalse();
    expect(JSON.stringify(component.editor!.getJSON())).toBe(initial);
    expect(api.save).not.toHaveBeenCalled();
    fixture.destroy();
    flush();
  }));

  it('keeps pasted text working while excluding remote image HTML', fakeAsync(() => {
    const fixture = create();
    const clipboard = new DataTransfer();
    clipboard.setData('text/plain', 'Pasted text');
    const event = new ClipboardEvent('paste', {
      clipboardData: clipboard,
      bubbles: true,
      cancelable: true,
    });
    fixture.nativeElement.querySelector('.tiptap').dispatchEvent(event);
    expect(fixture.componentInstance.editor!.getText()).toContain(
      'Pasted text'
    );
    fixture.componentInstance.editor!.commands.insertContent(
      '<img src="https://example.com/tracker.png"><p>Text remains</p>'
    );
    expect(fixture.nativeElement.querySelector('.tiptap img')).toBeNull();
    expect(fixture.componentInstance.editor!.getText()).toContain(
      'Text remains'
    );
    fixture.destroy();
    flush();
  }));
});
