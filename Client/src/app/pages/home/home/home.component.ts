import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AsideNewsComponent } from '../aside-news/aside-news.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterOutlet, AsideNewsComponent, CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  constructor(private router: Router) {}
}
