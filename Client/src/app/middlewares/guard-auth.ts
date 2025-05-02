import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services';

export const canActive = () => {
  const router = inject(Router);
  const authService = inject(AuthService);

  if (authService.isLoggedIn()) {
    return true;
  } else {
    router.navigate(['/login']);
    return false;
  }
};

export const canActiveForAdmin = () => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const bool = authService.isAdminPermission();
  if (bool) {
    return true;
  } else {
    router.navigate(['/login']);
    return false;
  }
};
