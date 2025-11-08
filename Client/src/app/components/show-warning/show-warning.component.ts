import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-show-warning',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './show-warning.component.html',
  styleUrl: './show-warning.component.scss',
})
export class ShowWarningComponent {}
