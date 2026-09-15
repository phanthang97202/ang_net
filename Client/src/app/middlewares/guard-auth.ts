import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
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

/**
 * Cửa vào khu quản trị: có BẤT KỲ quyền nào là vào được.
 *
 * Trước đây dùng canActiveForAdmin - chỉ hỏi token có vai trò "Admin" không, nên
 * người được gán đủ quyền vẫn bị đá ra ngoài. Việc vào được cửa không có nghĩa
 * thấy hết: menu lọc theo quyền, và mỗi trang con còn guard riêng.
 *
 * Đá về trang chủ chứ không về /login: người này ĐÃ đăng nhập, đẩy sang màn đăng
 * nhập chỉ khiến họ tưởng phiên hỏng rồi đăng nhập lại và vẫn vào không được.
 */
export const canActiveDashboard = () => {
  const router = inject(Router);
  const authService = inject(AuthService);

  if (!authService.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  if (authService.hasAnyPermissionAtAll()) {
    return true;
  }

  router.navigate(['/']);
  return false;
};

/**
 * Guard cho từng trang con: đòi đúng một mã quyền.
 *
 * Dùng: canActivate: [canActivePermission('audittrail.view')]
 *
 * Người vào được khu quản trị nhưng không có quyền của trang này thì quay về
 * trang tổng quan - trang đó ai qua cửa cũng xem được.
 */
export const canActivePermission = (permission: string): CanActivateFn => {
  return () => {
    const router = inject(Router);
    const authService = inject(AuthService);

    if (!authService.isLoggedIn()) {
      router.navigate(['/login']);
      return false;
    }

    if (authService.hasPermission(permission)) {
      return true;
    }

    router.navigate(['/dashboard']);
    return false;
  };
};

/** Như trên nhưng chỉ cần một trong nhiều quyền (trang gộp nhiều thao tác). */
export const canActiveAnyPermission = (
  permissions: string[]
): CanActivateFn => {
  return () => {
    const router = inject(Router);
    const authService = inject(AuthService);

    if (!authService.isLoggedIn()) {
      router.navigate(['/login']);
      return false;
    }

    if (authService.hasAnyPermission(permissions)) {
      return true;
    }

    router.navigate(['/dashboard']);
    return false;
  };
};
