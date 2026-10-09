import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { BlogMaintenanceService } from '../services/blog-maintenance.service';

export const canMatchBlog: CanMatchFn = () => {
  const router = inject(Router);
  return inject(BlogMaintenanceService)
    .check()
    .pipe(
      map(enabled => (enabled ? router.createUrlTree(['/maintain']) : true))
    );
};
