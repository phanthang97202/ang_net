import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { SysParameterConfigService, SYS_PARAM_CODE } from '../../services';

@Component({
  selector: 'app-show-warning',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './show-warning.component.html',
  styleUrl: './show-warning.component.scss',
})
export class ShowWarningComponent implements OnInit {
  private config = inject(SysParameterConfigService);
  private destroyRef = inject(DestroyRef);

  // null = chưa cấu hình -> template dùng bản dịch i18n mặc định
  warningMessage: string | null = null;

  ngOnInit(): void {
    // Nguồn phát lại mỗi lần đổi ngôn ngữ nên không tự complete -> phải hủy
    // theo vòng đời component.
    this.config
      .getText(SYS_PARAM_CODE.WARNING_BANNER)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(text => {
        this.warningMessage = text;
      });
  }
}
