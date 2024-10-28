import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { AboutComponent } from './pages/about/about.component';
import { HomeComponent } from './pages/home/home.component';
import { canActive, canActiveForAdmin } from './middlewares/guard-auth';
import { DetailUserComponent } from './pages/detail-user/detail-user.component';
import { DashboardComponent } from './pages/dashboard/dashboard/dashboard.component';
import { UserListComponent } from './pages/dashboard/user-list/user-list.component';
import { RoleListComponent } from './pages/dashboard/role-list/role-list.component';
import { CreateRoleComponent } from './components/create-role/create-role.component';
import { MstProvinceComponent } from './pages/dashboard/mst-province/mst-province-list/mst-province-list.component';
import { BlogsComponent } from './pages/dashboard/blogs/blogs.component';

export const routes: Routes = [
  { path: '*', redirectTo: '/home' }, // Điều này đảm bảo rằng bất kỳ tuyến đường nào không xác định hoặc không tồn tại trong ứng dụng của bạn sẽ chuyển hướng người dùng về trang /home

  {
    title: 'Home',
    path: '',
    component: HomeComponent,
    canActivate: [canActive],
  },
  {
    title: 'Login',
    path: 'login',
    component: LoginComponent,
  },
  {
    title: 'About',
    path: 'about',
    component: AboutComponent,
    canActivate: [canActive],
  },
  {
    title: 'User detail',
    path: 'userinfor',
    component: DetailUserComponent,
    canActivate: [canActive],
  },
  {
    title: 'Dashboard',
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [canActiveForAdmin],
    children: [],
  },
  {
    path: 'dashboard/users',
    component: UserListComponent,
    canActivate: [canActiveForAdmin],
  },
  {
    path: 'dashboard/role',
    component: RoleListComponent,
    canActivate: [canActiveForAdmin],
  },
  {
    path: 'dashboard/mstprovince',
    component: MstProvinceComponent,
    canActivate: [canActiveForAdmin],
  },
  {
    path: 'dashboard/blog',
    component: BlogsComponent,
    canActivate: [canActiveForAdmin],
  },
];
