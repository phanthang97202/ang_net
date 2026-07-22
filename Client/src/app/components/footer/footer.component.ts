import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { VisitTrackingService } from '../../services';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  private visitTrackingService = inject(VisitTrackingService);

  currentYear = new Date().getFullYear();
  stats$ = this.visitTrackingService.stats$;
}
