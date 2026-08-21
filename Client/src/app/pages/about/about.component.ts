import { Component } from '@angular/core';
import { ScrollRevealDirective } from '../../directives';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [ScrollRevealDirective],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
})
export class AboutComponent {}
