import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AntdModule, REUSE_COMPONENT_MODULES } from '../../../modules';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [AntdModule, ...REUSE_COMPONENT_MODULES],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  constructor(private router: Router) {}
}
