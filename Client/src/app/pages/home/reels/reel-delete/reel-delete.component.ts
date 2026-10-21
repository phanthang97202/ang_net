import {
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  Output,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { finalize } from 'rxjs';
import { IReelDto } from '../../../../interfaces';
import { ApiService, AuthService } from '../../../../services';

@Component({
  selector: 'app-reel-delete',
  standalone: true,
  imports: [NzIconModule, NzModalModule, TranslateModule],
  templateUrl: './reel-delete.component.html',
  styleUrl: './reel-delete.component.scss',
  host: { '[style.display]': 'canDelete ? "block" : "none"' },
})
export class ReelDeleteComponent {
  @Input({ required: true }) reel!: IReelDto;
  @Input() compact = false;
  @Output() deleted = new EventEmitter<string>();
  open = false;
  deleting = false;
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly message = inject(NzMessageService);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  get canDelete(): boolean {
    return (
      this.auth.isLoggedIn() &&
      (this.auth.getAccountInfo().nameid === this.reel.UserId ||
        this.auth.hasPermission('reel.delete'))
    );
  }

  confirm(): void {
    if (this.canDelete && !this.deleting) this.open = true;
  }

  cancel(): void {
    if (!this.deleting) this.open = false;
  }

  remove(): void {
    if (this.deleting) return;
    // Re-check the current session rather than trusting the cached reel DTO.
    if (!this.canDelete) {
      this.open = false;
      return;
    }
    const id = this.reel.ReelId;
    this.deleting = true;
    this.api
      .ReelDelete(id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => (this.deleting = false))
      )
      .subscribe({
        next: response => {
          if (!response.Success) {
            this.message.error(
              response.ErrorMessage ||
                this.translate.instant('T_REEL_DELETE_ERROR')
            );
            return;
          }
          this.open = false;
          this.message.success(this.translate.instant('T_REEL_DELETED'));
          this.deleted.emit(id);
        },
        error: () =>
          this.message.error(this.translate.instant('T_REEL_DELETE_ERROR')),
      });
  }
}
