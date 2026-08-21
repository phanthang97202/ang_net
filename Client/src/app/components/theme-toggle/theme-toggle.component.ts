import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { AntdModule } from '../../modules';
import { ThemeService } from '../../services';

@Component({
  standalone: true,
  selector: 'app-theme-toggle',
  imports: [AntdModule, AsyncPipe],
  templateUrl: './theme-toggle.component.html',
})
export class ThemeToggleComponent {
  private themeService = inject(ThemeService);
  theme$ = this.themeService.theme$;

  toggle(): void {
    this.themeService.toggleTheme();
  }
}
