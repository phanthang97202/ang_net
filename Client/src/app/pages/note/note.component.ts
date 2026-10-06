import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Validators, NonNullableFormBuilder } from '@angular/forms';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AntdModule, REUSE_PIPE_MODULE } from '../../modules';
import { TextEditorComponent } from '../../components/text-editor/text-editor.component';
import { INote } from '../../interfaces';
import { ApiService, NoteRealtimeService } from '../../services';

@Component({
  selector: 'app-note',
  standalone: true,
  imports: [AntdModule, TextEditorComponent, ...REUSE_PIPE_MODULE],
  templateUrl: './note.component.html',
  styleUrl: './note.component.scss',
})
export class NoteComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly api = inject(ApiService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly message = inject(NzMessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly noteRealtime = inject(NoteRealtimeService);

  @ViewChild('loadMoreSentinel')
  private loadMoreSentinel?: ElementRef<HTMLElement>;

  readonly form = this.fb.group({
    Alias: this.fb.control('', Validators.maxLength(100)),
    ContentBody: this.fb.control('', Validators.required),
  });

  notes: INote[] = [];
  expandedIds = new Set<string>();
  isLoading = false;
  isSubmitting = false;
  featureUnavailable = false;
  hasMore = true;
  nextCursor: string | null = null;
  editorResetKey = 0;
  contentError = '';

  private observer?: IntersectionObserver;
  private readonly pageSize = 10;

  ngOnInit(): void {
    this.noteRealtime.newNote$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(note => this.prependNote(note));
    this.noteRealtime.initialize();
    void this.noteRealtime.markAllAsRead();
    this.loadMore();
  }

  ngAfterViewInit(): void {
    if (!this.loadMoreSentinel || typeof IntersectionObserver === 'undefined') {
      return;
    }

    this.observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          this.loadMore();
        }
      },
      { rootMargin: '320px 0px' }
    );
    this.observer.observe(this.loadMoreSentinel.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  handleContentChanged(event: { content: string }): void {
    this.form.controls.ContentBody.setValue(event.content);
    this.form.controls.ContentBody.markAsDirty();
    this.contentError = '';
  }

  submit(): void {
    const plainLength = this.plainText(
      this.form.controls.ContentBody.value
    ).length;
    if (plainLength === 0) {
      this.contentError = 'Vui lòng nhập nội dung ghi chú.';
    } else if (plainLength > 20_000) {
      this.contentError = 'Nội dung không được vượt quá 20.000 ký tự.';
    }

    this.form.markAllAsTouched();
    if (this.form.invalid || this.contentError || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.api
      .NoteCreate(this.form.getRawValue())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          if (!response?.Success) {
            this.message.error(
              response?.ErrorMessage || 'Không thể lưu ghi chú.'
            );
            return;
          }

          this.prependNote(response.Data);
          this.form.reset({ Alias: '', ContentBody: '' });
          this.editorResetKey += 1;
          this.contentError = '';
          this.message.success('Ghi chú của bạn đã được đăng.');
        },
        error: error => {
          this.isSubmitting = false;
          this.message.error(
            error?.status === 429
              ? 'Bạn gửi ghi chú quá nhanh. Vui lòng thử lại sau.'
              : 'Không thể lưu ghi chú lúc này.'
          );
        },
        complete: () => (this.isSubmitting = false),
      });
  }

  loadMore(): void {
    if (this.isLoading || !this.hasMore || this.featureUnavailable) return;

    this.isLoading = true;
    this.api
      .NoteFeed(this.pageSize, this.nextCursor)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          if (!response?.Success) {
            this.featureUnavailable = true;
            this.hasMore = false;
            return;
          }

          const page = response.objResult;
          const existingIds = new Set(this.notes.map(note => note.NoteId));
          const nextNotes = (page?.DataList || []).filter(
            note => !existingIds.has(note.NoteId)
          );
          this.notes = [...this.notes, ...nextNotes];
          this.nextCursor = page?.NextCursor || null;
          this.hasMore = page?.HasMore || false;
        },
        error: () => {
          this.isLoading = false;
          this.hasMore = false;
          this.message.error('Không thể tải danh sách ghi chú.');
        },
        complete: () => (this.isLoading = false),
      });
  }

  toggleExpanded(noteId: string): void {
    const next = new Set(this.expandedIds);
    if (next.has(noteId)) {
      next.delete(noteId);
    } else {
      next.add(noteId);
    }
    this.expandedIds = next;
  }

  isExpanded(noteId: string): boolean {
    return this.expandedIds.has(noteId);
  }

  shouldTruncate(note: INote): boolean {
    return this.plainText(note.ContentBody).length > 420;
  }

  initialOf(alias: string): string {
    return alias.trim().charAt(0).toUpperCase() || '?';
  }

  trackNote(_: number, note: INote): string {
    return note.NoteId;
  }

  private prependNote(note: INote): void {
    if (!note?.NoteId || this.notes.some(item => item.NoteId === note.NoteId)) {
      return;
    }
    this.notes = [note, ...this.notes];
  }

  private plainText(html: string): string {
    const element = document.createElement('div');
    element.innerHTML = html || '';
    return (element.textContent || '').replace(/\s+/g, ' ').trim();
  }
}
