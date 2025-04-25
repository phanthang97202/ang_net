import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { LoginRequest, RefreshTokenRequest } from '../interfaces/login-request';
import { delay, map, Observable } from 'rxjs';
import { AuthResponse } from '../interfaces/auth-response';
import { jwtDecode } from 'jwt-decode';
import { isAfter, isBefore } from 'date-fns';
import { IUser, IUserInfo, IUserResponse } from '../interfaces/user';
import {
  IAssignRoleRequest,
  IAssignRoleResponse,
  ICreateRoleRequest,
  IDeleteRoleResponse,
  IRole,
  IRoleResponse,
  IUnasignRoleResponse,
  IUnassignRoleRequest,
} from '../interfaces/role';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  apiUrl: string = environment.apiUrl;
  private tokenKey = environment.tokenKey;
  private refreshTokenKey = environment.refreshTokenKey;
  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  login(data: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}account/login`, data)
      .pipe(
        map(response => {
          if (response.Success) {
            localStorage.setItem(this.tokenKey, response.Data.AccessToken);
            localStorage.setItem(
              this.refreshTokenKey,
              response.Data.RefreshToken
            );
          }
          return response;
        })
      );
  }

  signInWithGoogle(idToken: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}account/login-google`, { idToken })
      .pipe(
        map(response => {
          if (response.Success) {
            localStorage.setItem(this.tokenKey, response.Data.AccessToken);
            localStorage.setItem(
              this.refreshTokenKey,
              response.Data.RefreshToken
            );
          }
          return response;
        })
      );
  }

  refreshToken(data: RefreshTokenRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.apiUrl}account/refreshtoken`,
      data
    );
  }

  getUserDetail(): Observable<IUserResponse> {
    return this.http.get<IUserResponse>(
      `${this.apiUrl}account/detail`
      //    {
      //   headers: {
      //     Authorization: `Bearer ${this.getToken()}`,
      //   },
      // }
    );
  }

  // get thông tin users cho dashboard
  getAllUsers(): Observable<IUserResponse> {
    return this.http.get<IUserResponse>(`${this.apiUrl}account/users`);
  }

  getAccountInfo() {
    const token = this.getToken();
    if (!token) {
      return {
        email: null,
        name: null,
        nameid: null,
        aud: null,
        iss: null,
        role: null,
        nbf: null,
        exp: null,
        iat: null,
      };
    }

    const decodedToken: any = jwtDecode(token);

    const shortname = decodedToken.name.split(' ')[0][0];

    return {
      ...decodedToken,
      shortname,
    };
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    this.router.navigate(['/login']);
  }

  logoutFromAllDevice(userId: string) {
    return this.http.post<AuthResponse>(
      `${this.apiUrl}account/logoutalldevice?userId=${userId}`,
      {}
    );
  }

  isLoggedIn(): boolean {
    const token = this.getToken();

    if (!token) return false;

    const decodedToken = jwtDecode(token);

    const isTokenExpried = isBefore(
      new Date(Date.now()),
      new Date((decodedToken['exp'] as number) * 1000)
    );

    // if (!isTokenExpried) {
    //   this.logout();
    // }

    return isTokenExpried;
  }

  isAdminPermission(): boolean {
    const token = this.getToken();

    if (!token) return false;

    const decodedToken: any = jwtDecode(token);

    const bool = decodedToken?.role?.includes('Admin') ?? false;

    return bool;
  }

  getToken() {
    return localStorage.getItem(this.tokenKey) ?? '';
  }

  // tạo mới role
  createRole(request: ICreateRoleRequest) {
    return this.http.post(`${this.apiUrl}roles/create`, request);
  }

  getAllRoles(): Observable<IRoleResponse> {
    return this.http.get<IRoleResponse>(`${this.apiUrl}roles/roles`);
  }

  deleteRole(key: string): Observable<IDeleteRoleResponse> {
    return this.http.delete<IDeleteRoleResponse>(`${this.apiUrl}roles/${key}`);
  }

  assignRole(param: IAssignRoleRequest): Observable<IAssignRoleResponse> {
    return this.http.post<IAssignRoleResponse>(
      `${this.apiUrl}roles/assign`,
      param
    );
  }

  unassignRole(param: IUnassignRoleRequest): Observable<IUnasignRoleResponse> {
    return this.http.post<IUnasignRoleResponse>(
      `${this.apiUrl}roles/unassign`,
      param
    );
  }
}
