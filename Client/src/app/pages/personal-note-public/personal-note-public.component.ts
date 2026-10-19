import {
  Component,
  DestroyRef,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { Editor } from '@tiptap/core';
import { PersonalNoteService } from '../../services/personal-note.service';
import { PublicPersonalNote } from '../../interfaces/personal-note';
import { personalNoteExtensions } from '../../components/personal-notes/personal-note-extensions';

@Component({
  selector: 'app-personal-note-public',
  standalone: true,
  imports: [TranslateModule],
  template: `
    @if (loading) {
      <p class="page-status" role="status">
        {{ 'T_PNOTE_LOADING' | translate }}
      </p>
    } @else if (!note) {
      <p class="page-status" role="alert">
        {{
          (failed ? 'T_PNOTE_PUBLIC_LOAD_ERROR' : 'T_PNOTE_PUBLIC_UNAVAILABLE')
            | translate
        }}
      </p>
    }
    <article [hidden]="!note" class="public-note">
      <h1>{{ note?.Title }}</h1>
      <div #content class="tiptap-host"></div>
    </article>
  `,
  styleUrl: './personal-note-public.component.scss',
})
export class PersonalNotePublicComponent implements OnInit, OnDestroy {
  @ViewChild('content', { static: true }) host!: ElementRef<HTMLDivElement>;
  private route = inject(ActivatedRoute);
  private api = inject(PersonalNoteService);
  private destroyed = inject(DestroyRef);
  private title = inject(Title);
  editor?: Editor;
  note: PublicPersonalNote | null = null;
  loading = true;
  failed = false;

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map(params => params.get('token') ?? ''),
        tap(() => {
          this.editor?.destroy();
          this.editor = undefined;
          this.host.nativeElement.replaceChildren();
          this.note = null;
          this.loading = true;
          this.failed = false;
        }),
        switchMap(token =>
          this.api.publicNote(token).pipe(
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
        try {
          this.editor = new Editor({
            element: this.host.nativeElement,
            extensions: personalNoteExtensions(true),
            content: JSON.parse(note.ContentJson),
            editable: false,
            editorProps: { attributes: { 'aria-readonly': 'true' } },
          });
          this.note = note;
          this.title.setTitle(note.Title);
        } catch {
          this.failed = true;
        }
      });
  }
  ngOnDestroy(): void {
    this.editor?.destroy();
  }
}
