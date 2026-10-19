import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  DoCheck,
  HostListener,
  OnDestroy,
  inject,
  Input,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { NzModalModule, NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Subject, debounceTime, firstValueFrom, takeUntil } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { PersonalNoteService } from '../../services/personal-note.service';
import {
  PersonalNote,
  PersonalNoteSummary,
} from '../../interfaces/personal-note';
import { InfiniteScrollDirective } from '../../directives/infinite-scroll.directive';
import { PersonalNoteEditorComponent } from './personal-note-editor.component';

@Component({
  selector: 'app-personal-notes-widget',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    NzPopoverModule,
    NzModalModule,
    InfiniteScrollDirective,
    PersonalNoteEditorComponent,
  ],
  templateUrl: './personal-notes-widget.component.html',
  styleUrl: './personal-notes-widget.component.scss',
})
export class PersonalNotesWidgetComponent implements DoCheck, OnDestroy {
  @Input() hasChat = true;
  private auth = inject(AuthService);
  private api = inject(PersonalNoteService);
  private modal = inject(NzModalService);
  private message = inject(NzMessageService);
  private translate = inject(TranslateService);
  private destroyed = inject(DestroyRef);
  private disposed = false;
  private ownerChanged = new Subject<void>();
  private search = new Subject<void>();
  private confirmation?: NzModalRef;
  private request = 0;
  private detailRequest = 0;
  private cursor: string | null = null;
  accountId = '';
  editorOwner = '';
  listOpen = false;
  editorVisible = false;
  items: PersonalNoteSummary[] = [];
  keyword = '';
  loading = false;
  error = false;
  hasMore = false;
  openingId: string | null = null;
  deletingId: string | null = null;
  editingId = '';
  editingNote: PersonalNote | null = null;

  constructor() {
    this.search
      .pipe(debounceTime(250), takeUntilDestroyed(this.destroyed))
      .subscribe(() => {
        if (this.listOpen) this.load(true);
      });
  }
  private get permittedOwner(): string {
    return this.auth.isLoggedIn() && this.auth.hasPermission('personalnote.use')
      ? (this.auth.getAccountInfo()?.nameid ?? '')
      : '';
  }
  ngDoCheck(): void {
    const id = this.permittedOwner;
    if (id === this.accountId) return;
    this.ownerChanged.next();
    this.request++;
    this.detailRequest++;
    this.confirmation?.destroy();
    this.confirmation = undefined;
    this.accountId = id;
    this.editorOwner = '';
    this.listOpen = false;
    this.editorVisible = false;
    this.items = [];
    this.editingNote = null;
    this.keyword = '';
    this.loading = false;
    this.error = false;
    this.hasMore = false;
    this.cursor = null;
    this.openingId = this.deletingId = null;
  }
  ngOnDestroy(): void {
    this.disposed = true;
    this.ownerChanged.next();
    this.ownerChanged.complete();
    this.confirmation?.destroy();
  }
  @HostListener('document:keydown.escape')
  closeList(): void {
    if (!this.editorVisible && !this.confirmation) this.listOpen = false;
  }
  visibleChange(open: boolean): void {
    this.ngDoCheck();
    if (open === this.listOpen) return;
    this.listOpen = open && !!this.accountId;
    if (this.listOpen) this.load(true);
    else {
      this.detailRequest++;
      this.openingId = null;
    }
  }
  searchChanged(): void {
    this.search.next();
  }
  load(reset = false): void {
    this.ngDoCheck();
    if (!this.accountId || (!reset && (this.loading || !this.hasMore))) return;
    const request = ++this.request;
    if (reset) {
      this.items = [];
      this.cursor = null;
      this.hasMore = false;
    }
    this.loading = true;
    this.error = false;
    this.api
      .list(this.keyword.trim(), this.cursor)
      .pipe(takeUntil(this.ownerChanged), takeUntilDestroyed(this.destroyed))
      .subscribe({
        next: page => {
          if (request !== this.request) return;
          const seen = new Set(this.items.map(item => item.NoteId));
          this.items = [
            ...this.items,
            ...page.DataList.filter(item => !seen.has(item.NoteId)),
          ];
          this.hasMore = page.HasMore;
          this.cursor = page.NextCursor;
          this.loading = false;
        },
        error: () => {
          if (request === this.request) {
            this.loading = false;
            this.error = true;
          }
        },
      });
  }
  create(): void {
    this.ngDoCheck();
    if (!this.accountId) return;
    this.detailRequest++;
    this.openingId = null;
    this.editingNote = null;
    this.editingId = crypto.randomUUID();
    this.showEditor();
  }
  edit(note: PersonalNoteSummary): void {
    this.ngDoCheck();
    if (!this.accountId) return;
    const request = ++this.detailRequest;
    this.openingId = note.NoteId;
    this.api
      .get(note.NoteId)
      .pipe(takeUntil(this.ownerChanged), takeUntilDestroyed(this.destroyed))
      .subscribe({
        next: detail => {
          if (request !== this.detailRequest || !this.listOpen) return;
          this.openingId = null;
          this.editingNote = detail;
          this.editingId = detail.NoteId;
          this.showEditor();
        },
        error: () => {
          if (request !== this.detailRequest) return;
          this.openingId = null;
          this.message.error(this.translate.instant('T_PNOTE_UNAVAILABLE'));
        },
      });
  }
  private showEditor(): void {
    this.editorOwner = this.accountId;
    this.listOpen = false;
    this.editorVisible = true;
  }
  closeEditor(): void {
    this.editorVisible = false;
    this.editingNote = null;
    this.listOpen = !!this.accountId;
  }
  saved(): void {
    this.closeEditor();
    this.load(true);
    this.message.success(this.translate.instant('T_PNOTE_SAVED'));
  }
  confirmDelete(note: PersonalNoteSummary): void {
    this.ngDoCheck();
    if (this.confirmation || this.deletingId || !this.accountId) return;
    const owner = this.accountId;
    this.listOpen = false;
    this.detailRequest++;
    this.openingId = null;
    this.confirmation = this.modal.confirm({
      nzTitle: this.translate.instant('T_PNOTE_DELETE_TITLE'),
      nzContent: this.translate.instant('T_PNOTE_DELETE_MESSAGE'),
      nzOkText: this.translate.instant('T_PNOTE_DELETE'),
      nzCancelText: this.translate.instant('T_PNOTE_CANCEL'),
      nzOkDanger: true,
      nzClassName: 'blog-modal',
      nzOnOk: () => this.remove(note),
    });
    this.confirmation.afterClose
      .pipe(takeUntilDestroyed(this.destroyed))
      .subscribe(() => {
        this.confirmation = undefined;
        if (owner === this.accountId && !this.disposed && !this.editorVisible)
          this.listOpen = true;
      });
  }
  private async remove(note: PersonalNoteSummary): Promise<boolean> {
    this.ngDoCheck();
    if (!this.accountId) return true;
    const owner = this.accountId;
    this.deletingId = note.NoteId;
    try {
      await firstValueFrom(
        this.api
          .delete(note.NoteId, note.Version)
          .pipe(
            takeUntil(this.ownerChanged),
            takeUntilDestroyed(this.destroyed)
          )
      );
      if (owner !== this.accountId || this.disposed) return true;
      this.items = this.items.filter(item => item.NoteId !== note.NoteId);
      this.message.success(this.translate.instant('T_PNOTE_DELETED'));
      return true;
    } catch (error) {
      if (owner !== this.accountId || this.disposed) return true;
      const status = (error as { status?: number }).status;
      this.message.error(
        this.translate.instant(
          status === 409 ? 'T_PNOTE_CONFLICT' : 'T_PNOTE_DELETE_ERROR'
        )
      );
      if (status === 409 || status === 404) this.load(true);
      return false;
    } finally {
      if (owner === this.accountId) this.deletingId = null;
    }
  }
}
