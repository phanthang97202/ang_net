import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { isReactive } from '@angular/core/primitives/signals';
import {
  ActivatedRoute,
  Router,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMenuItemComponent, NzMenuModule } from 'ng-zorro-antd/menu';
import { AuthService } from '../../services/auth.service';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    NzPopoverModule,
    NzAvatarModule,
    CommonModule,
    RouterLink,
    RouterLinkActive,
    NzMenuModule,
    NzMenuItemComponent,
    NzIconModule,
    NzButtonComponent,
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent implements OnInit {
  authService = inject(AuthService);
  activeRoute: boolean = false;

  constructor(private router: Router, private activatedRoute: ActivatedRoute) {}

  listRoute = [
    { path: '/', title: 'Home', icon: 'home', isActive: false },
    { path: '/about', title: 'About', icon: 'user', isActive: false },
  ];

  ngOnInit() {
    this.listRoute.map((item) => {
      return {
        ...item,
        isActive: item.path === this.activatedRoute.snapshot.url.join('/'),
      };
    });
  }

  handleNavigateLogin(event: MouseEvent) {
    this.router.navigate(['/login']);
  }

  handleLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
