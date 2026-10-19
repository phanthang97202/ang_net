import {
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import { AuthService } from '../../services/auth.service';
import { PersonalNoteService } from '../../services/personal-note.service';
import { PersonalNote } from '../../interfaces/personal-note';

@Component({
  selector: 'app-personal-note-editor',
  standalone: true,
  imports: [FormsModule, TranslateModule],
  templateUrl: './personal-note-editor.component.html',
  styleUrl: './personal-note-editor.component.scss',
})
export class PersonalNoteEditorComponent implements OnInit, OnDestroy {
  @Input({ required: true }) noteId!: string;
  @Input({ required: true }) ownerId!: string;
  @Input() note: PersonalNote | null = null;
  @Output() saved = new EventEmitter<PersonalNote>();
  @Output() closed = new EventEmitter<void>();
  @ViewChild('editorHost', { static: true }) host!: ElementRef<HTMLDivElement>;
  @ViewChild('titleInput', { static: true })
  titleInput!: ElementRef<HTMLInputElement>;
  private api = inject(PersonalNoteService);
  private auth = inject(AuthService);
  private modal = inject(NzModalService);
  private translate = inject(TranslateService);
  private destroyed = inject(DestroyRef);
  private disposed = false;
  private zone = inject(NgZone);
  private cd = inject(ChangeDetectorRef);
  private confirmation?: NzModalRef;
  private initial = '';
  private initialTitle = '';
  private bodyChanged = false;
  editor?: Editor;
  title = '';
  saving = false;
  errorKey = '';
  linkVisible = false;
  linkUrl = '';
  version = 0;

  ngOnInit(): void {
    this.title = this.note?.Title ?? '';
    this.initialTitle = this.title;
    this.version = this.note?.Version ?? 0;
    this.editor = new Editor({
      element: this.host.nativeElement,
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3] },
          link: {
            openOnClick: false,
            defaultProtocol: 'https',
            isAllowedUri: (url, context) =>
              context.defaultValidate(url) &&
              /^(https?:\/\/|mailto:|tel:)/i.test(url),
          },
        }),
        TaskList,
        TaskItem.configure({ nested: true }),
        Placeholder.configure({
          placeholder: this.translate.instant('T_PNOTE_START_WRITING'),
        }),
      ],
      content: this.note
        ? JSON.parse(this.note.ContentJson)
        : { type: 'doc', content: [{ type: 'paragraph' }] },
      editorProps: {
        attributes: {
          'aria-label': this.translate.instant('T_PNOTE_CONTENT'),
          spellcheck: 'true',
        },
      },
      onUpdate: ({ editor }) =>
        this.zone.run(() => {
          this.bodyChanged = JSON.stringify(editor.getJSON()) !== this.initial;
          this.errorKey = '';
          this.cd.markForCheck();
        }),
      onSelectionUpdate: () => this.zone.run(() => this.cd.markForCheck()),
    });
    this.initial = JSON.stringify(this.editor.getJSON());
    queueMicrotask(() => {
      if (!this.disposed)
        this.titleInput.nativeElement.focus({ preventScroll: true });
    });
  }
  ngOnDestroy(): void {
    this.disposed = true;
    this.confirmation?.destroy();
    this.editor?.destroy();
  }
  get dirty(): boolean {
    return (
      !!this.editor && (this.title !== this.initialTitle || this.bodyChanged)
    );
  }
  get currentOwner(): boolean {
    return (
      this.auth.isLoggedIn() &&
      this.auth.hasPermission('personalnote.use') &&
      this.auth.getAccountInfo()?.nameid === this.ownerId
    );
  }
  get canSave(): boolean {
    return (
      this.currentOwner &&
      this.title.trim().length > 0 &&
      this.title.trim().length <= 200 &&
      !this.saving &&
      !!this.editor
    );
  }

  @HostListener('window:beforeunload', ['$event'])
  beforeUnload(event: BeforeUnloadEvent): void {
    if (this.dirty) {
      event.preventDefault();
      event.returnValue = '';
    }
  }
  @HostListener('document:keydown', ['$event'])
  keyDown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      this.save();
    }
    if (event.key === 'Escape' && !this.confirmation) {
      if (this.linkVisible) this.linkVisible = false;
      else this.requestClose();
    }
  }
  requestClose(): void {
    if (this.saving || this.confirmation) return;
    if (!this.dirty || !this.currentOwner) {
      this.closed.emit();
      return;
    }
    this.confirmation = this.modal.confirm({
      nzTitle: this.translate.instant('T_PNOTE_DISCARD_TITLE'),
      nzContent: this.translate.instant('T_PNOTE_DISCARD_MESSAGE'),
      nzOkText: this.translate.instant('T_PNOTE_DISCARD'),
      nzCancelText: this.translate.instant('T_PNOTE_KEEP_EDITING'),
      nzOkDanger: true,
      nzClassName: 'blog-modal',
      nzOnOk: () => this.closed.emit(),
    });
    this.confirmation.afterClose
      .pipe(takeUntilDestroyed(this.destroyed))
      .subscribe(() => (this.confirmation = undefined));
  }
  save(): void {
    if (!this.canSave || !this.editor || !this.currentOwner) return;
    const content = JSON.stringify(this.editor.getJSON());
    if (content.length > 500_000) {
      this.errorKey = 'T_PNOTE_TOO_LARGE';
      return;
    }
    this.saving = true;
    this.errorKey = '';
    this.editor.setEditable(false);
    this.api
      .save(this.noteId, {
        Title: this.title.trim(),
        ContentJson: content,
        Version: this.version,
      })
      .pipe(takeUntilDestroyed(this.destroyed))
      .subscribe({
        next: note => {
          this.saving = false;
          if (!this.currentOwner) return;
          this.editor?.setEditable(true);
          this.initial = content;
          this.initialTitle = this.title;
          this.bodyChanged = false;
          this.version = note.Version;
          this.saved.emit(note);
        },
        error: error => {
          this.saving = false;
          this.editor?.setEditable(true);
          this.errorKey =
            error.status === 409
              ? 'T_PNOTE_CONFLICT'
              : error.status === 404
                ? 'T_PNOTE_UNAVAILABLE'
                : 'T_PNOTE_SAVE_ERROR';
        },
      });
  }
  block(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    if (value === 'paragraph')
      this.editor?.chain().focus().setParagraph().run();
    else
      this.editor
        ?.chain()
        .focus()
        .toggleHeading({ level: Number(value) as 1 | 2 | 3 })
        .run();
  }
  showLink(): void {
    this.linkVisible = !this.linkVisible;
    this.linkUrl = this.editor?.getAttributes('link')['href'] ?? '';
  }
  applyLink(): void {
    if (this.saving) return;
    const url = this.linkUrl.trim();
    if (url && !/^(https?:\/\/|mailto:|tel:)/i.test(url)) {
      this.errorKey = 'T_PNOTE_LINK_ERROR';
      return;
    }
    const chain = this.editor?.chain().focus().extendMarkRange('link');
    if (url) chain?.setLink({ href: url }).run();
    else chain?.unsetLink().run();
    this.errorKey = '';
    this.linkVisible = false;
  }
}
