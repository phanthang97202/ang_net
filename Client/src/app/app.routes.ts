import { Routes } from '@angular/router';
import {
  canActive,
  canActiveDashboard,
  canActivePermission,
} from './middlewares';

export const routes: Routes = [
  {
    // Không set title: AppTitleStrategy sẽ fallback về đúng "Phan Thang Blog"
    // thay vì lặp lại thành "Home - Phan Thang Blog".
    path: '',
    loadComponent: () =>
      import('./pages/home/home/home.component').then(p => p.HomeComponent),
    // canActivate: [canActive],
  },
  {
    title: 'News',
    path: 'news',
    loadComponent: () =>
      import('./pages/home/news/news.component').then(p => p.NewsComponent),
  },
  {
    title: 'News detail',
    path: 'news/:categoryId/:newsId',
    loadComponent: () =>
      import('./pages/home/detail-news/detail-news.component').then(
        p => p.DetailNewsComponent
      ),
  },
  {
    title: 'Reels',
    path: 'reels',
    loadComponent: () =>
      import('./pages/home/reels/reels.component').then(
        p => p.ReelsComponent
      ),
  },
  {
    title: 'Create reel',
    path: 'reels/create',
    loadComponent: () =>
      import('./pages/home/reels/create-reel/create-reel.component').then(
        p => p.CreateReelComponent
      ),
    canActivate: [canActive],
  },
  {
    title: 'Tools',
    path: 'tools',
    // canActivate: [canActive],
    children: [
      {
        title: 'Calculating hotel fee',
        path: 'calculating-hotel-fee',
        loadComponent: () =>
          import(
            './pages/tools/caculating-hotel-fee/calculating-hotel-fee.component'
          ).then(p => p.CalculatingHotelFeeComponent),
      },
      {
        title: 'Shift report',
        path: 'shift-report',
        loadChildren: () =>
          import('./pages/tools/shift-report/shift-report.module').then(
            p => p.ShiftReportModule
          ),
      },
      {
        title: 'Revenue report',
        path: 'revenue-report',
        loadChildren: () =>
          import('./pages/tools/revenue-report/revenue-report.module').then(
            p => p.RevenueReportModule
          ),
      },
    ],
  },
  {
    title: 'Chess',
    path: 'game/chess',
    loadComponent: () =>
      import('./pages/game/chess/chess-lobby/chess-lobby.component').then(
        p => p.ChessLobbyComponent
      ),
  },
  {
    title: 'Chess vs computer',
    path: 'game/chess/vs-computer',
    loadComponent: () =>
      import(
        './pages/game/chess/chess-vs-computer/chess-vs-computer.component'
      ).then(p => p.ChessVsComputerComponent),
  },
  {
    title: 'Chess room',
    path: 'game/chess/:roomId',
    loadComponent: () =>
      import('./pages/game/chess/chess-room/chess-room.component').then(
        p => p.ChessRoomComponent
      ),
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
    title: 'Forgot password',
    path: 'forgot-password',
    loadComponent() {
      return import('./pages/forgot-password/forgot-password.component').then(
        p => p.ForgotPasswordComponent
      );
    },
  },
  // Trang giới thiệu tạm ẩn (chưa dùng tới). Bật lại: bỏ comment khối này và
  // mục '/about' trong listRoute của navbar.component.ts. Component vẫn còn ở
  // pages/about nên không mất gì.
  // {
  //   title: 'About',
  //   path: 'about',
  //   loadComponent: () =>
  //     import('./pages/about/about.component').then(p => p.AboutComponent),
  // },
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
    // Cửa vào khu quản trị: có bất kỳ quyền nào là vào được. Từng trang con bên
    // dưới còn guard riêng theo đúng quyền của trang đó.
    canActivate: [canActiveDashboard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/dashboard/dashboard/dashboard.component').then(
            p => p.DashboardComponent
          ),
        // Không guard riêng: trang tổng quan là chỗ đáp của mọi người vào được
        // khu quản trị, kể cả người chỉ có đúng một quyền.
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./pages/dashboard/user-list/user-list.component').then(
            p => p.UserListComponent
          ),
        canActivate: [canActivePermission('user.view')],
      },
      {
        path: 'role',
        loadComponent: () =>
          import('./pages/dashboard/role-list/role-list.component').then(
            p => p.RoleListComponent
          ),
        canActivate: [canActivePermission('role.view')],
      },
      {
        path: 'mstprovince',
        loadComponent: () =>
          import(
            './pages/dashboard/mst-province/mst-province-list/mst-province-list.component'
          ).then(p => p.MstProvinceComponent),
        canActivate: [canActivePermission('master.view')],
      },
      {
        path: 'mstdistrict',
        loadComponent: () =>
          import(
            './pages/dashboard/mst-province/mst-province-list/mst-province-list.component'
          ).then(p => p.MstProvinceComponent),
        canActivate: [canActivePermission('master.view')],
      },
      {
        path: 'blog',
        loadComponent: () =>
          import('./pages/dashboard/blogs/blog-list/blog-list.component').then(
            p => p.BlogListComponent
          ),
        canActivate: [canActivePermission('blog.view')],
      },

      {
        path: 'blog/create',
        loadComponent: () =>
          import('./pages/dashboard/blogs/modify-blog/blogs.component').then(
            p => p.BlogsComponent
          ),
        canActivate: [canActivePermission('blog.create')],
        data: { mode: 'create' },
      },

      {
        path: 'blog/edit/:id',
        loadComponent: () =>
          import('./pages/dashboard/blogs/modify-blog/blogs.component').then(
            p => p.BlogsComponent
          ),
        data: { mode: 'edit' },
      },

      {
        path: 'audittrail',
        loadComponent: () =>
          import(
            './pages/dashboard/audit-trail/audit-trail-list/audit-trail-list.component'
          ).then(p => p.AuditTrailComponent),
        canActivate: [canActivePermission('audittrail.view')],
      },
      {
        path: 'sysparameter',
        loadComponent: () =>
          import(
            './pages/dashboard/sys-parameter/sys-parameter-list/sys-parameter-list.component'
          ).then(p => p.SysParameterComponent),
        canActivate: [canActivePermission('sysparameter.view')],
      },
      {
        path: 'newscategory',
        loadComponent: () =>
          import(
            './pages/dashboard/news-category/news-category-list/news-category-list.component'
          ).then(p => p.NewsCategoryComponent),
        canActivate: [canActivePermission('newscategory.view')],
      },
    ],
  },

  // Mọi URL không khớp route nào -> về trang chủ. Wildcard của Angular là '**'
  // ('*' trước đây không bao giờ khớp, nên URL sai render ra trang trắng), và
  // bắt buộc phải đứng CUỐI mảng vì router khớp theo thứ tự khai báo.
  { path: '**', redirectTo: '' },
];
