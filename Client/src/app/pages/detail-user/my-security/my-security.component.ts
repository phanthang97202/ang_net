import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { finalize } from 'rxjs';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-my-security',
  standalone: true,
  imports: [TranslateModule, NzIconModule, NzModalModule],
  templateUrl: './my-security.component.html',
  styleUrl: './my-security.component.scss',
})
export class MySecurityComponent {
  auth = inject(AuthService);
  private translate = inject(TranslateService);
  private messages = inject(NzMessageService);
  private destroyRef = inject(DestroyRef);
  action: 'revoke' | 'lock' | null = null;
  saving = false;
  error = '';

  confirm(action: 'revoke' | 'lock'): void {
    if (this.saving || (action === 'lock' && this.auth.isAdminPermission()))
      return;
    this.error = '';
    this.action = action;
  }

  cancel(): void {
    if (!this.saving) this.action = null;
  }

  save(): void {
    if (!this.action || this.saving || !this.auth.isLoggedIn()) return;
    const locked = this.action === 'lock';
    if (locked && this.auth.isAdminPermission()) return;
    this.saving = true;
    this.error = '';
    this.auth
      .protectOwnAccount(locked)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => (this.saving = false))
      )
      .subscribe({
        next: response => {
          if (!response.Success) {
            this.error =
              response.ErrorMessage ||
              this.translate.instant('T_SELF_SECURITY_ERROR');
            return;
          }
          this.action = null;
          this.messages.success(
            this.translate.instant(locked ? 'T_SELF_LOCKED' : 'T_SELF_REVOKED')
          );
          this.auth.logout();
        },
        error: error => {
          this.error =
            error.error?.ErrorMessage ||
            this.translate.instant('T_SELF_SECURITY_ERROR');
        },
      });
  }
}
