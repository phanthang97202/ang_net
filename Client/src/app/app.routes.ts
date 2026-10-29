import { Routes } from '@angular/router';
import { canMatchBlog } from './middlewares/guard-blog-maintenance';
import {
  canActive,
  canActiveDashboard,
  canActivePermission,
} from './middlewares';

const appRoutes: Routes = [
  {
    path: 'shared-note/edit',
    title: 'T_PNOTE_EDITOR',
    loadComponent: () => import('./pages/personal-note-shared/personal-note-shared.component').then(p => p.PersonalNoteSharedComponent),
  },
  {
    path: 'shared-note/view',
    title: 'T_PNOTE_MY_NOTES',
    loadComponent: () => import('./pages/personal-note-public/personal-note-public.component').then(p => p.PersonalNotePublicComponent),
  },
  {
    path: 'shared-note/:token/edit',
    title: 'T_PNOTE_EDITOR',
    loadComponent: () =>
      import(
        './pages/personal-note-shared/personal-note-shared.component'
      ).then(p => p.PersonalNoteSharedComponent),
  },
  {
    path: 'shared-note/:token',
    title: 'T_PNOTE_MY_NOTES',
    loadComponent: () =>
      import(
        './pages/personal-note-public/personal-note-public.component'
      ).then(p => p.PersonalNotePublicComponent),
  },
  {
    path: 'maintain',
    title: 'Bảo trì',
    loadComponent: () =>
      import('./pages/maintain/maintain.component').then(
        p => p.MaintainComponent
      ),
  },
  {
    // Trò chơi khăm TROLL_VIETNAM. Không đi qua guard blog (đích của chính guard
    // đó); trang tự kiểm tra cấu hình và về trang chủ nếu chế độ đang tắt.
    path: 'haha',
    title: 'T_PAGE_HAHA',
    loadComponent: () =>
      import('./pages/haha/haha.component').then(p => p.HahaComponent),
  },
  {
    path: 'dashboard/login',
    title: 'T_PAGE_LOGIN',
    loadComponent: () =>
      import('./pages/login/login.component').then(p => p.LoginComponent),
  },
  {
    // Không set title: AppTitleStrategy sẽ fallback về đúng "Phan Thang Blog"
    // thay vì lặp lại thành "Home - Phan Thang Blog".
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./pages/home/home/home.component').then(p => p.HomeComponent),
    // canActivate: [canActive],
  },
  {
    title: 'T_PAGE_NEWS',
    path: 'news',
    loadComponent: () =>
      import('./pages/home/news/news.component').then(p => p.NewsComponent),
  },
  {
    title: 'T_PAGE_NEWS_DETAIL',
    path: 'news/:categoryId/:newsId',
    loadComponent: () =>
      import('./pages/home/detail-news/detail-news.component').then(
        p => p.DetailNewsComponent
      ),
  },
  {
    title: 'T_PAGE_REELS',
    path: 'reels',
    loadComponent: () =>
      import('./pages/home/reels/reels.component').then(p => p.ReelsComponent),
  },
  {
    title: 'T_PAGE_NOTE',
    path: 'note',
    loadComponent: () =>
      import('./pages/note/note.component').then(p => p.NoteComponent),
  },
  {
    title: 'T_CALENDAR',
    path: 'calendar',
    loadComponent: () =>
      import('./pages/personal-calendar/personal-calendar.component').then(
        p => p.PersonalCalendarComponent
      ),
    canActivate: [canActivePermission('calendar.use', '/')],
  },
  {
    title: 'T_EXPENSES',
    path: 'expenses',
    loadComponent: () => import('./pages/personal-expenses/personal-expenses.component').then(p => p.PersonalExpensesComponent),
    canActivate: [canActivePermission('expenses.use', '/')],
  },
  {
    title: 'T_PAGE_MUSIC',
    path: 'music',
    loadComponent: () =>
      import('./pages/music/music.component').then(p => p.MusicComponent),
    canActivate: [canActivePermission('music.use', '/')],
  },
  {
    // Link chia sẻ bộ sưu tập nhạc (Public / Unlisted). Không gác quyền: ai xem
    // được do server quyết định theo Visibility, giống archive/:collectionId.
    title: 'T_PAGE_MUSIC_COLLECTION',
    path: 'music/collection/:collectionId',
    loadComponent: () =>
      import('./pages/music/music-collection-public.component').then(
        p => p.MusicCollectionPublicComponent
      ),
  },
  {
    title: 'T_PAGE_MOVIE',
    path: 'phim',
    loadComponent: () =>
      import('./pages/movie/movie.component').then(p => p.MovieComponent),
    canActivate: [canActivePermission('movie.view')],
  },
  {
    title: 'T_PAGE_MOVIE',
    path: 'phim/:slug',
    loadComponent: () =>
      import('./pages/movie/movie.component').then(p => p.MovieComponent),
    canActivate: [canActivePermission('movie.view')],
  },
  {
    path: 'anime',
    redirectTo: 'phim',
    pathMatch: 'full',
  },
  {
    path: 'anime/:slug',
    redirectTo: 'phim/:slug',
    pathMatch: 'full',
  },
  {
    title: 'T_PAGE_CREATE_REEL',
    path: 'reels/create',
    loadComponent: () =>
      import('./pages/home/reels/create-reel/create-reel.component').then(
        p => p.CreateReelComponent
      ),
    canActivate: [canActive],
  },
  {
    // Link chia sẻ bộ sưu tập (Public / Unlisted). Không gác đăng nhập: quyền
    // xem do server quyết định theo Visibility.
    title: 'T_PAGE_ARCHIVE',
    path: 'archive/:collectionId',
    loadComponent: () =>
      import('./pages/archive-public/archive-public.component').then(
        p => p.ArchivePublicComponent
      ),
  },
  {
    title: 'T_PAGE_TOOLS',
    path: 'tools',
    // canActivate: [canActive],
    children: [
      {
        title: 'T_PAGE_CALCULATING_HOTEL_FEE',
        path: 'calculating-hotel-fee',
        loadComponent: () =>
          import(
            './pages/tools/caculating-hotel-fee/calculating-hotel-fee.component'
          ).then(p => p.CalculatingHotelFeeComponent),
      },
      {
        title: 'T_PAGE_SHIFT_REPORT',
        path: 'shift-report',
        canActivate: [canActivePermission('shiftreport.view', '/')],
        loadChildren: () =>
          import('./pages/tools/shift-report/shift-report.module').then(
            p => p.ShiftReportModule
          ),
      },
      {
        title: 'T_PAGE_RENTAL_STATISTICS',
        path: 'rental-statistics',
        canActivate: [canActivePermission('rentalstatistics.view', '/')],
        loadComponent: () =>
          import(
            './pages/tools/rental-statistics/shift-rental-statistics.component'
          ).then(p => p.ShiftRentalStatisticsComponent),
      },
      {
        title: 'T_PAGE_REVENUE_REPORT',
        path: 'revenue-report',
        canActivate: [canActivePermission('revenuereport.view', '/')],
        loadChildren: () =>
          import('./pages/tools/revenue-report/revenue-report.module').then(
            p => p.RevenueReportModule
          ),
      },
    ],
  },
  {
    title: 'T_PAGE_CHESS',
    path: 'game/chess',
    loadComponent: () =>
      import('./pages/game/chess/chess-lobby/chess-lobby.component').then(
        p => p.ChessLobbyComponent
      ),
  },
  {
    title: 'T_PAGE_CHESS_VS_COMPUTER',
    path: 'game/chess/vs-computer',
    loadComponent: () =>
      import(
        './pages/game/chess/chess-vs-computer/chess-vs-computer.component'
      ).then(p => p.ChessVsComputerComponent),
  },
  {
    title: 'T_PAGE_CHESS_ROOM',
    path: 'game/chess/:roomId',
    loadComponent: () =>
      import('./pages/game/chess/chess-room/chess-room.component').then(
        p => p.ChessRoomComponent
      ),
  },
  {
    title: 'T_PAGE_LOGIN',
    path: 'login',
    loadComponent() {
      return import('./pages/login/login.component').then(
        p => p.LoginComponent
      );
    },
  },
  {
    title: 'T_PAGE_FORGOT_PASSWORD',
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
    title: 'T_PAGE_USER_DETAIL',
    path: 'userinfor',
    loadComponent: () =>
      import('./pages/detail-user/detail-user.component').then(
        p => p.DetailUserComponent
      ),
    // canActivate: [canActive],
  },
  {
    title: 'T_PAGE_DASHBOARD',
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
        path: 'analytics',
        title: 'Thống kê truy cập',
        loadComponent: () =>
          import('./pages/dashboard/analytics/analytics.component').then(
            p => p.AnalyticsComponent
          ),
        canActivate: [canActivePermission('analytics.view')],
      },
      {
        path: 'movie-view-logs',
        title: 'Nhật ký mở phim',
        loadComponent: () =>
          import('./pages/dashboard/analytics/movie-view-logs.component').then(
            p => p.MovieViewLogsComponent
          ),
        canActivate: [canActivePermission('movieviewlog.view')],
      },
      {
        path: 'music-analytics',
        title: 'Thống kê âm nhạc',
        loadComponent: () => import('./pages/dashboard/analytics/music-analytics.component').then(p => p.MusicAnalyticsComponent),
        canActivate: [canActivePermission('music.analytics.view')],
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
        path: 'note',
        loadComponent: () =>
          import('./pages/dashboard/note/note-list/note-list.component').then(
            p => p.NoteListComponent
          ),
        canActivate: [canActivePermission('blog.view')],
      },
      {
        path: 'media',
        loadComponent: () =>
          import(
            './pages/dashboard/media-library/media-library.component'
          ).then(p => p.MediaLibraryComponent),
        canActivate: [canActivePermission('media.view')],
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
        // Trước đây route này không có guard nào: ai vào được khu quản trị đều mở
        // được trình soạn bài bằng URL. Việc lưu vẫn bị API chặn nếu không phải
        // tác giả, nhưng không nên để mở được màn hình ngay từ đầu.
        canActivate: [canActivePermission('blog.update')],
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
      {
        // Cùng lý do với menu trang chủ: dùng chung quyền với tham số hệ thống
        // thay vì seed thêm permission riêng.
        path: 'subscriber',
        loadComponent: () =>
          import(
            './pages/dashboard/subscriber/subscriber-list/subscriber-list.component'
          ).then(p => p.SubscriberComponent),
        canActivate: [canActivePermission('subscriber.view')],
      },
      {
        // Menu trang chủ cũng là một dạng cấu hình hệ thống nên dùng chung quyền
        // với tham số hệ thống, không đặt quyền riêng.
        path: 'menu',
        loadComponent: () =>
          import(
            './pages/dashboard/sys-menu/sys-menu-list/sys-menu-list.component'
          ).then(p => p.SysMenuComponent),
        canActivate: [canActivePermission('sysparameter.view')],
      },
      {
        path: 'email-report',
        loadComponent: () =>
          import('./pages/dashboard/email-report/email-report.component').then(
            p => p.EmailReportComponent
          ),
        canActivate: [canActivePermission('sysparameter.view')],
      },
    ],
  },

  // Mọi URL không khớp route nào -> về trang chủ. Wildcard của Angular là '**'
  // ('*' trước đây không bao giờ khớp, nên URL sai render ra trang trắng), và
  // bắt buộc phải đứng CUỐI mảng vì router khớp theo thứ tự khai báo.
  { path: '**', redirectTo: '' },
];

export const routes: Routes = appRoutes.map(route => {
  if (
    ['dashboard', 'dashboard/login', 'maintain', 'haha'].includes(route.path!)
  )
    return route;
  return { ...route, canMatch: [canMatchBlog] };
});
