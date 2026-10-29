import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, combineLatest, map, of, switchMap, tap } from 'rxjs';
import { PersonalNoteService } from '../../services/personal-note.service';
import { PersonalNote } from '../../interfaces/personal-note';
import { PersonalNoteEditorComponent } from '../../components/personal-notes/personal-note-editor.component';

@Component({
  selector: 'app-personal-note-shared',
  standalone: true,
  imports: [TranslateModule, NzModalModule, PersonalNoteEditorComponent],
  template: `
    @if (loading) {
      <p class="page-status" role="status">
        {{ 'T_PNOTE_LOADING' | translate }}
      </p>
    } @else if (!note) {
      <p class="page-status" role="alert">
        {{
          (failed ? 'T_PNOTE_PUBLIC_LOAD_ERROR' : 'T_PNOTE_SHARED_UNAVAILABLE')
            | translate
        }}
      </p>
    } @else {
      @for (editableNote of [note]; track editableNote.NoteId) {
        <app-personal-note-editor
          [noteId]="editableNote.NoteId"
          ownerId=""
          [note]="editableNote"
          [sharedToken]="editableNote.NoteId"
          (saved)="saved($event)" />
      }
    }
  `,
  styles: [
    `
      :host ::ng-deep .note-editor.shared-editor {
        height: 100dvh;
        box-sizing: border-box;
        padding-top: 16px;
      }
      :host {
        display: block;
        min-height: 100dvh;
        background: var(--color-bg-card);
        color: var(--color-text);
      }
      .page-status {
        margin: 0;
        padding: 64px 24px;
        text-align: center;
      }
    `,
  ],
})
export class PersonalNoteSharedComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(PersonalNoteService);
  private destroyed = inject(DestroyRef);
  private title = inject(Title);
  token = '';
  note: PersonalNote | null = null;
  loading = true;
  failed = false;

  ngOnInit(): void {
    combineLatest([this.route.paramMap, this.route.fragment])
      .pipe(
        map(([params, fragment]) => params.get('token') ?? fragment ?? ''),
        tap(token => {
          this.token = token;
          this.note = null;
          this.loading = true;
          this.failed = false;
        }),
        switchMap(token =>
          this.api.sharedNote(token).pipe(
            catchError(error => {
              this.failed = error.status !== 404;
              return of(null);
            })
          )
        ),
        takeUntilDestroyed(this.destroyed)
      )
      .subscribe(note => {
        this.loading = false;
        if (!note) return;
        this.note = {
          ...note,
          NoteId: this.token,
          Preview: '',
          CreatedAt: '',
          UpdatedAt: '',
        };
        this.title.setTitle(note.Title);
      });
  }
  saved(note: PersonalNote): void {
    if (note.NoteId !== this.token) return;
    this.note = note;
    this.title.setTitle(note.Title);
  }
}
