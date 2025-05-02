import { Routes } from '@angular/router';
import { canActive, canActiveForAdmin } from './middlewares';

export const routes: Routes = [
  { path: '*', redirectTo: '' }, // Điều này đảm bảo rằng bất kỳ tuyến đường nào không xác định hoặc không tồn tại trong ứng dụng của bạn sẽ chuyển hướng người dùng về trang /home

  {
    title: 'Home',
    path: '',
    // component: HomeComponent,
    loadComponent: () =>
      import('./pages/home/home/home.component').then(p => p.HomeComponent),
    // canActivate: [canActive],
    children: [
      {
        path: '',
        // component: NewsComponent,
        loadComponent: () =>
          import('./pages/home/news/news.component').then(p => p.NewsComponent),
      },
      {
        path: 'news',
        // component: NewsComponent,
        loadComponent: () =>
          import('./pages/home/news/news.component').then(p => p.NewsComponent),
      },
      {
        path: 'news/:categoryId/:newsId',
        // component: DetailNewsComponent,
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
    // component: LoginComponent,
    loadComponent() {
      return import('./pages/login/login.component').then(
        p => p.LoginComponent
      );
    },
  },
  {
    title: 'About',
    path: 'about',
    // component: AboutComponent,
    loadComponent: () =>
      import('./pages/about/about.component').then(p => p.AboutComponent),
    // canActivate: [canActive],
  },
  {
    title: 'User detail',
    path: 'userinfor',
    // component: DetailUserComponent,
    loadComponent: () =>
      import('./pages/detail-user/detail-user.component').then(
        p => p.DetailUserComponent
      ),
    // canActivate: [canActive],
  },
  {
    title: 'Dashboard',
    path: 'dashboard',
    // component: LayoutDashboardComponent,
    loadComponent: () =>
      import('./pages/dashboard/_layout/_layout.component').then(
        p => p.LayoutDashboardComponent
      ),
    canActivate: [canActiveForAdmin],
    children: [
      {
        path: '',
        // component: DashboardComponent,
        loadComponent: () =>
          import('./pages/dashboard/dashboard/dashboard.component').then(
            p => p.DashboardComponent
          ),
        canActivate: [canActiveForAdmin],
      },
      {
        path: 'users',
        // component: UserListComponent,
        loadComponent: () =>
          import('./pages/dashboard/user-list/user-list.component').then(
            p => p.UserListComponent
          ),
        canActivate: [canActiveForAdmin],
      },
      {
        path: 'role',
        // component: RoleListComponent,
        loadComponent: () =>
          import('./pages/dashboard/role-list/role-list.component').then(
            p => p.RoleListComponent
          ),
        canActivate: [canActiveForAdmin],
      },
      {
        path: 'mstprovince',
        // component: MstProvinceComponent,
        loadComponent: () =>
          import(
            './pages/dashboard/mst-province/mst-province-list/mst-province-list.component'
          ).then(p => p.MstProvinceComponent),
        canActivate: [canActiveForAdmin],
      },
      {
        path: 'mstdistrict',
        // component: MstProvinceComponent,
        loadComponent: () =>
          import(
            './pages/dashboard/mst-province/mst-province-list/mst-province-list.component'
          ).then(p => p.MstProvinceComponent),
        canActivate: [canActiveForAdmin],
      },
      {
        path: 'blog',
        // component: BlogsComponent,
        loadComponent: () =>
          import('./pages/dashboard/blogs/blogs.component').then(
            p => p.BlogsComponent
          ),
        canActivate: [canActiveForAdmin],
      },
    ],
  },
];
