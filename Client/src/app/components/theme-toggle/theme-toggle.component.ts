import { Component, inject } from '@angular/core';
import { ThemeService } from '../../services';

@Component({
  standalone: true,
  selector: 'app-theme-toggle',
  imports: [],
  templateUrl: './theme-toggle.component.html',
})
export class ThemeToggleComponent {
  private themeService = inject(ThemeService);

  toggle(): void {
    this.themeService.toggleTheme();
  }
}
