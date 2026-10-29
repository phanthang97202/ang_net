import { TestBed, fakeAsync, flush } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, ParamMap } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject, Subject, of } from 'rxjs';
import { Title } from '@angular/platform-browser';
import { PersonalNotePublicComponent } from './personal-note-public.component';
import { PersonalNoteService } from '../../services/personal-note.service';
import { PublicPersonalNote } from '../../interfaces/personal-note';

describe('Published personal note page', () => {
  let api: jasmine.SpyObj<PersonalNoteService>;
  let params: BehaviorSubject<ParamMap>;
  let response: Subject<PublicPersonalNote>;
  let previousTitle: string;
  const token = 'a'.repeat(64);
  const note: PublicPersonalNote = {
    Title: 'A public note',
    ContentJson: JSON.stringify({
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'A heading' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: '<script>plain text</script>',
              marks: [{ type: 'bold' }],
            },
          ],
        },
        {
          type: 'taskList',
          content: [
            {
              type: 'taskItem',
              attrs: { checked: true },
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Done' }],
                },
              ],
            },
          ],
        },
        {
          type: 'image',
          attrs: {
            src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jL1sAAAAASUVORK5CYII=',
          },
        },
      ],
    }),
  };
  beforeEach(() => {
    previousTitle = document.title;
    params = new BehaviorSubject(convertToParamMap({ token }));
    response = new Subject();
    api = jasmine.createSpyObj<PersonalNoteService>('PersonalNoteService', [
      'publicNote',
    ]);
    api.publicNote.and.returnValue(response);
    TestBed.configureTestingModule({
      imports: [PersonalNotePublicComponent, TranslateModule.forRoot()],
      providers: [
        { provide: PersonalNoteService, useValue: api },
        { provide: ActivatedRoute, useValue: { paramMap: params, fragment: of(null) } },
      ],
    });
  });
  afterEach(() => (document.title = previousTitle));

  it('renders title, formatting, checklists and base64 images as read-only content without editor controls', fakeAsync(() => {
    const fixture = TestBed.createComponent(PersonalNotePublicComponent);
    fixture.detectChanges();
    expect(api.publicNote).toHaveBeenCalledWith(token);
    response.next(note);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('h1').textContent).toBe(
      note.Title
    );
    expect(TestBed.inject(Title).getTitle()).toBe(note.Title);
    expect(fixture.nativeElement.querySelector('.tiptap h2').textContent).toBe(
      'A heading'
    );
    expect(
      fixture.nativeElement.querySelector('.tiptap strong').textContent
    ).toContain('<script>plain text</script>');
    expect(fixture.nativeElement.querySelector('.tiptap script')).toBeNull();
    expect(fixture.componentInstance.editor!.isEditable).toBeFalse();
    const checkbox = fixture.nativeElement.querySelector(
      'input[type="checkbox"]'
    ) as HTMLInputElement;
    expect(checkbox.checked).toBeTrue();
    checkbox.click();
    expect(checkbox.checked).toBeTrue();
    const image = fixture.nativeElement.querySelector(
      '.tiptap img'
    ) as HTMLImageElement;
    expect(image.getAttribute('src')).toContain('data:image/png;base64,');
    image.width = 2000;
    expect(image.getBoundingClientRect().right).toBeLessThanOrEqual(
      window.innerWidth
    );
    expect(
      fixture.nativeElement.querySelector(
        'footer, nav, .editor-toolbar, button'
      )
    ).toBeNull();
    fixture.destroy();
    flush();
  }));

  it('clears old content when switching links, cancels pending requests and handles revoked links', fakeAsync(() => {
    const fixture = TestBed.createComponent(PersonalNotePublicComponent);
    fixture.detectChanges();
    response.next(note);
    fixture.detectChanges();
    const nextResponse = new Subject<PublicPersonalNote>();
    api.publicNote.and.returnValue(nextResponse);
    params.next(convertToParamMap({ token: 'b'.repeat(64) }));
    fixture.detectChanges();
    expect(response.observed).toBeFalse();
    expect(fixture.componentInstance.note).toBeNull();
    expect(fixture.nativeElement.querySelector('.tiptap')).toBeNull();
    nextResponse.error({ status: 404 });
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('[role="alert"]').textContent
    ).toContain('T_PNOTE_PUBLIC_UNAVAILABLE');
    expect(fixture.nativeElement.querySelector('article').hidden).toBeTrue();
    const unavailable = new Subject<PublicPersonalNote>();
    api.publicNote.and.returnValue(unavailable);
    params.next(convertToParamMap({ token }));
    unavailable.error({ status: 500 });
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('[role="alert"]').textContent
    ).toContain('T_PNOTE_PUBLIC_LOAD_ERROR');
    fixture.destroy();
    flush();
  }));
});
