import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-layout-dashboard',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './_layout.component.html',
  styleUrl: './_layout.component.scss',
})
export class LayoutDashboardComponent {}
