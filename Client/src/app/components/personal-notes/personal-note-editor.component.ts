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
import Placeholder from '@tiptap/extension-placeholder';
import { Clipboard } from '@angular/cdk/clipboard';
import { DOCUMENT } from '@angular/common';
import { map } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { PersonalNoteService } from '../../services/personal-note.service';
import { PersonalNote } from '../../interfaces/personal-note';
import {
  MAX_IMAGE_BYTES,
  isImageDataUrl,
  personalNoteExtensions,
} from './personal-note-extensions';

const MAX_DOCUMENT_LENGTH = 8_000_000;
const IMAGE_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
]);

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
  @Input() sharedToken: string | null = null;
  @Output() saved = new EventEmitter<PersonalNote>();
  @Output() closed = new EventEmitter<void>();
  @Output() publicationChanged = new EventEmitter<PersonalNote>();
  @ViewChild('editorHost', { static: true }) host!: ElementRef<HTMLDivElement>;
  @ViewChild('titleInput', { static: true })
  titleInput!: ElementRef<HTMLInputElement>;
  private api = inject(PersonalNoteService);
  private clipboard = inject(Clipboard);
  private document = inject(DOCUMENT);
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
  publicationBusy = false;
  shareOpen = false;
  publicToken: string | null = null;
  editToken: string | null = null;
  allowEditing = false;
  copiedEdit = false;
  savedShared = false;
  copied = false;
  insertingImages = false;
  private imageReaders = new Set<FileReader>();
  errorKey = '';
  linkVisible = false;
  linkUrl = '';
  version = 0;

  ngOnInit(): void {
    this.title = this.note?.Title ?? '';
    this.initialTitle = this.title;
    this.version = this.note?.Version ?? 0;
    this.publicToken = this.note?.PublicToken ?? null;
    this.editToken = this.note?.EditToken ?? null;
    this.allowEditing = !!this.editToken;
    this.editor = new Editor({
      element: this.host.nativeElement,
      extensions: [
        ...personalNoteExtensions(),
        Placeholder.configure({
          placeholder: this.translate.instant('T_PNOTE_START_WRITING'),
        }),
      ],
      content: this.note
        ? JSON.parse(this.note.ContentJson)
        : { type: 'doc', content: [{ type: 'paragraph' }] },
      editorProps: {
        handlePaste: (_view, event) => this.pasteImages(event),
        attributes: {
          'aria-label': this.translate.instant('T_PNOTE_CONTENT'),
          spellcheck: 'true',
        },
      },
      onUpdate: ({ editor }) =>
        this.zone.run(() => {
          this.bodyChanged = JSON.stringify(editor.getJSON()) !== this.initial;
          this.errorKey = '';
          this.savedShared = false;
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
    for (const reader of this.imageReaders) reader.abort();
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
      !!this.sharedToken ||
      (this.auth.isLoggedIn() &&
        this.auth.hasPermission('personalnote.use') &&
        this.auth.getAccountInfo()?.nameid === this.ownerId)
    );
  }
  get canSave(): boolean {
    return (
      this.currentOwner &&
      this.title.trim().length > 0 &&
      this.title.trim().length <= 200 &&
      !this.busy &&
      !!this.editor
    );
  }
  get busy(): boolean {
    return this.saving || this.insertingImages || this.publicationBusy;
  }
  get publicUrl(): string {
    return this.publicToken
      ? new URL(`/shared-note/view#${this.publicToken}`, this.document.baseURI).href
      : '';
  }
  get editUrl(): string {
    return this.editToken
      ? new URL(`/shared-note/edit#${this.editToken}`, this.document.baseURI)
          .href
      : '';
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
    if (this.sharedToken || this.busy || this.confirmation) return;
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
    const content = this.contentToSave();
    if (content === null) return;
    this.saving = true;
    this.errorKey = '';
    this.editor.setEditable(false);
    const body = {
      Title: this.title.trim(),
      ContentJson: content,
      Version: this.version,
    };
    const request = this.sharedToken
      ? this.api
          .saveShared(this.sharedToken, body)
          .pipe(map(note => ({ ...this.note!, ...note })))
      : this.api.save(this.noteId, body);
    request.pipe(takeUntilDestroyed(this.destroyed)).subscribe({
      next: note => {
        this.saving = false;
        if (!this.currentOwner) return;
        this.editor?.setEditable(true);
        this.initial = content;
        this.initialTitle = this.title;
        this.bodyChanged = false;
        this.version = note.Version;
        this.savedShared = !!this.sharedToken;
        this.saved.emit(note);
      },
      error: error => {
        this.saving = false;
        this.editor?.setEditable(true);
        this.errorKey =
          error.status === 409
            ? 'T_PNOTE_CONFLICT'
            : error.status === 404
              ? this.sharedToken
                ? 'T_PNOTE_SHARED_UNAVAILABLE'
                : 'T_PNOTE_UNAVAILABLE'
              : 'T_PNOTE_SAVE_ERROR';
      },
    });
  }
  private contentToSave(): string | null {
    const content = JSON.stringify(this.editor!.getJSON());
    if (
      content.length > MAX_DOCUMENT_LENGTH ||
      this.editor!.getText().length > 500_000
    ) {
      this.errorKey = 'T_PNOTE_TOO_LARGE';
      return null;
    }
    return content;
  }
  publish(): void {
    if (this.sharedToken || !this.canSave || !this.editor) return;
    const content = this.contentToSave();
    if (content === null) return;
    this.publicationBusy = true;
    this.errorKey = '';
    this.copied = false;
    this.editor.setEditable(false);
    this.api
      .publish(this.noteId, {
        Title: this.title.trim(),
        ContentJson: content,
        Version: this.version,
        ...(this.allowEditing ? { AllowEditing: true } : {}),
      })
      .pipe(takeUntilDestroyed(this.destroyed))
      .subscribe({
        next: note => {
          this.publicationBusy = false;
          if (!this.currentOwner) return;
          this.editor?.setEditable(true);
          this.version = note.Version;
          this.publicToken = note.PublicToken ?? null;
          this.editToken = note.EditToken ?? null;
          this.allowEditing = !!this.editToken;
          this.copiedEdit = false;
          this.initial = content;
          this.initialTitle = this.title;
          this.bodyChanged = false;
          this.shareOpen = true;
          this.publicationChanged.emit(note);
        },
        error: error => this.publicationError(error),
      });
  }
  unpublish(): void {
    if (
      this.sharedToken ||
      this.busy ||
      !this.currentOwner ||
      !this.publicToken
    )
      return;
    this.publicationBusy = true;
    this.errorKey = '';
    this.editor?.setEditable(false);
    this.api
      .unpublish(this.noteId, this.version)
      .pipe(takeUntilDestroyed(this.destroyed))
      .subscribe({
        next: note => {
          this.publicationBusy = false;
          if (!this.currentOwner) return;
          this.editor?.setEditable(true);
          this.version = note.Version;
          this.publicToken = note.PublicToken ?? null;
          this.editToken = note.EditToken ?? null;
          this.allowEditing = !!this.editToken;
          this.copiedEdit = false;
          this.copied = false;
          this.publicationChanged.emit(note);
        },
        error: error => this.publicationError(error),
      });
  }
  private publicationError(error: { status?: number }): void {
    this.publicationBusy = false;
    if (!this.currentOwner) return;
    this.editor?.setEditable(true);
    this.errorKey =
      error.status === 409
        ? 'T_PNOTE_CONFLICT'
        : error.status === 404
          ? 'T_PNOTE_UNAVAILABLE'
          : 'T_PNOTE_PUBLICATION_ERROR';
  }
  copyPublicLink(): void {
    this.copied = !!this.publicUrl && this.clipboard.copy(this.publicUrl);
    if (!this.copied) this.errorKey = 'T_PNOTE_COPY_ERROR';
  }
  copyEditLink(): void {
    this.copiedEdit = !!this.editUrl && this.clipboard.copy(this.editUrl);
    if (!this.copiedEdit) this.errorKey = 'T_PNOTE_COPY_ERROR';
  }
  revokeEditing(): void {
    if (this.sharedToken || this.busy || !this.currentOwner || !this.editToken)
      return;
    this.publicationBusy = true;
    this.errorKey = '';
    this.editor?.setEditable(false);
    this.api
      .revokeEditing(this.noteId, this.version)
      .pipe(takeUntilDestroyed(this.destroyed))
      .subscribe({
        next: note => {
          this.publicationBusy = false;
          if (!this.currentOwner) return;
          this.editor?.setEditable(true);
          this.version = note.Version;
          this.editToken = note.EditToken ?? null;
          this.allowEditing = !!this.editToken;
          this.copiedEdit = false;
          this.publicationChanged.emit(note);
        },
        error: error => this.publicationError(error),
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
  private pasteImages(event: ClipboardEvent): boolean {
    const files = Array.from(event.clipboardData?.files ?? []).filter(file =>
      file.type.startsWith('image/')
    );
    if (!files.length) return false;
    event.preventDefault();
    if (this.busy || !this.currentOwner || !this.editor) return true;
    if (files.some(file => !IMAGE_TYPES.has(file.type))) {
      this.errorKey = 'T_PNOTE_IMAGE_TYPE_ERROR';
      return true;
    }
    if (files.some(file => !file.size || file.size > MAX_IMAGE_BYTES)) {
      this.errorKey = 'T_PNOTE_IMAGE_SIZE_ERROR';
      return true;
    }
    if (
      JSON.stringify(this.editor.getJSON()).length +
        files.reduce(
          (size, file) => size + Math.ceil(file.size / 3) * 4 + 300,
          0
        ) >
      MAX_DOCUMENT_LENGTH
    ) {
      this.errorKey = 'T_PNOTE_TOO_LARGE';
      return true;
    }
    const { from, to } = this.editor.state.selection;
    this.insertingImages = true;
    this.errorKey = '';
    this.editor.setEditable(false);
    void Promise.all(files.map(file => this.readImage(file)))
      .then(sources => {
        if (this.disposed || !this.currentOwner || !this.editor) return;
        this.zone.run(() => {
          this.editor!.commands.insertContentAt(
            { from, to },
            sources.map(src => ({ type: 'image', attrs: { src } }))
          );
          this.editor!.commands.focus();
        });
      })
      .catch(() => {
        if (!this.disposed && this.currentOwner)
          this.zone.run(() => (this.errorKey = 'T_PNOTE_IMAGE_READ_ERROR'));
      })
      .finally(() => {
        if (this.disposed) return;
        this.zone.run(() => {
          this.insertingImages = false;
          if (this.currentOwner) this.editor?.setEditable(true);
          this.cd.markForCheck();
        });
      });
    return true;
  }
  private readImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      this.imageReaders.add(reader);
      reader.onload = () => {
        const src = String(reader.result);
        if (isImageDataUrl(src)) resolve(src);
        else reject(new Error('Invalid image'));
      };
      reader.onerror = reader.onabort = () =>
        reject(new Error('Image read failed'));
      reader.onloadend = () => this.imageReaders.delete(reader);
      reader.readAsDataURL(file);
    });
  }
  showLink(): void {
    this.linkVisible = !this.linkVisible;
    this.linkUrl = this.editor?.getAttributes('link')['href'] ?? '';
  }
  applyLink(): void {
    if (this.busy) return;
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
