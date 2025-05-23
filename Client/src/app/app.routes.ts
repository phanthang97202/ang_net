import { Routes } from '@angular/router';
import { canActive, canActiveForAdmin } from './middlewares';

export const routes: Routes = [
  { path: '*', redirectTo: '' }, // Điều này đảm bảo rằng bất kỳ tuyến đường nào không xác định hoặc không tồn tại trong ứng dụng của bạn sẽ chuyển hướng người dùng về trang /home

  {
    title: 'Home',
    path: '',
    loadComponent: () =>
      import('./pages/home/home/home.component').then(p => p.HomeComponent),
    // canActivate: [canActive],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/home/news/news.component').then(p => p.NewsComponent),
      },
      {
        path: 'news',
        loadComponent: () =>
          import('./pages/home/news/news.component').then(p => p.NewsComponent),
      },
      {
        path: 'news/:categoryId/:newsId',
        loadComponent: () =>
          import('./pages/home/detail-news/detail-news.component').then(
            p => p.DetailNewsComponent
          ),
      },
    ],
  },
  {
    title: 'Login',
    path: 'login',
    loadComponent() {
      return import('./pages/login/login.component').then(
        p => p.LoginComponent
      );
    },
  },
  {
    title: 'About',
    path: 'about',
    loadComponent: () =>
      import('./pages/about/about.component').then(p => p.AboutComponent),
    // canActivate: [canActive],
  },
  {
    title: 'User detail',
    path: 'userinfor',
    loadComponent: () =>
      import('./pages/detail-user/detail-user.component').then(
        p => p.DetailUserComponent
      ),
    // canActivate: [canActive],
  },
  {
    title: 'Dashboard',
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard/_layout/_layout.component').then(
        p => p.LayoutDashboardComponent
      ),
    canActivate: [canActiveForAdmin],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/dashboard/dashboard/dashboard.component').then(
            p => p.DashboardComponent
          ),
        canActivate: [canActiveForAdmin],
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./pages/dashboard/user-list/user-list.component').then(
            p => p.UserListComponent
          ),
        canActivate: [canActiveForAdmin],
      },
      {
        path: 'role',
        loadComponent: () =>
          import('./pages/dashboard/role-list/role-list.component').then(
            p => p.RoleListComponent
          ),
        canActivate: [canActiveForAdmin],
      },
      {
        path: 'mstprovince',
        loadComponent: () =>
          import(
            './pages/dashboard/mst-province/mst-province-list/mst-province-list.component'
          ).then(p => p.MstProvinceComponent),
        canActivate: [canActiveForAdmin],
      },
      {
        path: 'mstdistrict',
        loadComponent: () =>
          import(
            './pages/dashboard/mst-province/mst-province-list/mst-province-list.component'
          ).then(p => p.MstProvinceComponent),
        canActivate: [canActiveForAdmin],
      },
      {
        path: 'blog',
        loadComponent: () =>
          import('./pages/dashboard/blogs/blogs.component').then(
            p => p.BlogsComponent
          ),
        canActivate: [canActiveForAdmin],
      },
    ],
  },
];
