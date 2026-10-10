import {
  Component,
  DestroyRef,
  inject,
  Input,
  OnChanges,
  SimpleChanges,
  OnDestroy,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import { NzModalModule, NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { take } from 'rxjs';
import {
  ShowErrorService,
  IErrorInfoWithId,
} from '../../services/show-error.service';

@Component({
  standalone: true,
  selector: 'app-error-popup',
  imports: [NzModalModule, TranslateModule],
  templateUrl: './error-popup.component.html',
  styleUrl: './error-popup.component.scss',
})
export class ErrorPopupComponent implements OnChanges, OnDestroy {
  @Input() errorInfo: IErrorInfoWithId = { title: '', icon: '', message: '' };
  @Input() blogStyle = true;
  @ViewChild('errorTitle', { static: true })
  private errorTitle!: TemplateRef<{}>;
  @ViewChild('errorContent', { static: true })
  private errorContent!: TemplateRef<unknown>;
  @ViewChild('errorFooter', { static: true })
  private errorFooter!: TemplateRef<{}>;
  @ViewChild('rawContent', { static: true })
  private rawContent!: TemplateRef<unknown>;
  errorInfoService = inject(ShowErrorService);
  private modal = inject(NzModalService);
  private destroyRef = inject(DestroyRef);
  private currentModal: NzModalRef | null = null;
  private lastErrorId?: number;
  private hasOpened = false;

  showConfirm(): void {
    // A replaced dialog must not clear errors belonging to the next dialog.
    const previous = this.currentModal;
    this.currentModal = null;
    previous?.destroy();
    this.lastErrorId = this.errorInfo.id;
    this.hasOpened = true;
    const ref = this.blogStyle
      ? this.modal.create({
          nzClassName: 'blog-api-error-modal',
          nzTitle: this.errorTitle,
          nzContent: this.errorContent,
          nzFooter: this.errorFooter,
          nzWidth: 480,
          nzCentered: true,
          nzMaskClosable: false,
          nzOnCancel: () => this.closeModal(),
        })
      : this.modal.error({
          nzIconType: this.errorInfo.icon || 'error',
          nzTitle: this.errorInfo.title || 'Lỗi',
          nzContent: this.rawContent,
          nzCentered: true,
          nzOnOk: () => this.closeModal(),
          nzOnCancel: () => this.closeModal(),
        });
    this.currentModal = ref;
    ref.afterClose
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.currentModal === ref) {
          this.currentModal = null;
          this.errorInfoService.clearError();
        }
      });
  }

  closeModal(): void {
    const ref = this.currentModal;
    this.currentModal = null;
    this.errorInfoService.clearError();
    ref?.destroy();
  }

  ngOnChanges(changes: SimpleChanges): void {
    const current = changes['errorInfo']?.currentValue as
      IErrorInfoWithId | undefined;
    if (
      current?.message &&
      (!this.hasOpened ||
        current.id === undefined ||
        current.id !== this.lastErrorId)
    ) {
      this.showConfirm();
    }
  }

  ngOnDestroy(): void {
    const ref = this.currentModal;
    this.currentModal = null;
    ref?.destroy();
  }
}
