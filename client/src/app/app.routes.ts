import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { AboutComponent } from './pages/about/about.component';
import { HomeComponent } from './pages/home/home.component';
import { canActive } from './middlewares/guard-auth';
import { DetailUserComponent } from './pages/detail-user/detail-user.component';

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
];
