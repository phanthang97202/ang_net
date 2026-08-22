import { Component, OnInit, inject } from '@angular/core';
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

  // null = chưa cấu hình -> template dùng bản dịch i18n mặc định
  warningMessage: string | null = null;

  ngOnInit(): void {
    this.config
      .getText(SYS_PARAM_CODE.WARNING_BANNER)
      .subscribe(text => {
        this.warningMessage = text;
      });
  }
}
