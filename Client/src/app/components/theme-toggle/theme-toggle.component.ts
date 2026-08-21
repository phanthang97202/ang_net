import { Component, inject } from '@angular/core';
import { AntdModule } from '../../modules';
import { ThemeService } from '../../services';

@Component({
  standalone: true,
  selector: 'app-theme-toggle',
  imports: [AntdModule],
  templateUrl: './theme-toggle.component.html',
})
export class ThemeToggleComponent {
  private themeService = inject(ThemeService);

  toggle(): void {
    this.themeService.toggleTheme();
  }
}
