import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { map, of, switchMap } from 'rxjs';
import { BlogMaintenanceService } from '../services/blog-maintenance.service';

/**
 * Guard của mọi route blog (app.routes.ts gắn cho tất cả trừ /dashboard, /dashboard/login, /maintain):
 *  1. BLOG_MAINTENANCE bật -> /maintain.
 *  2. ONLY_SHIFT_REPORT bật -> chỉ còn báo cáo ca + đăng nhập; URL khác về /tools/shift-report.
 */
export const canMatchBlog: CanMatchFn = () => {
  const router = inject(Router);
  const service = inject(BlogMaintenanceService);
  // canMatch chỉ nhận đoạn URL của route đang xét; cần cả URL đích để biết có
  // phải báo cáo ca không (route con nằm dưới 'tools')
  const navigation = router.getCurrentNavigation();
  const url = navigation
    ? router.serializeUrl(navigation.extractedUrl)
    : router.url;

  return service.check().pipe(
    switchMap(maintenance => {
      if (maintenance) return of(router.createUrlTree(['/maintain']));
      return service.checkShiftReportOnly().pipe(
        map(only => {
          const target = only ? service.shiftReportOnlyRedirect(url) : null;
          return target ? router.parseUrl(target) : true;
        })
      );
    })
  );
};
