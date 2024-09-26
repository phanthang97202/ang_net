import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { LoginRequest } from '../interfaces/login-request';
import { delay, map, Observable } from 'rxjs';
import { AuthResponse } from '../interfaces/auth-response';
import { jwtDecode } from 'jwt-decode';
import { isAfter, isBefore } from 'date-fns';
import { IUser, IUserInfo } from '../interfaces/user';
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
  private tokenKey = 'token';
  constructor(private http: HttpClient, private router: Router) {}

  login(data: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}account/login`, data)

      .pipe(
        // delay(2000),
        map((response) => {
          if (response.IsSuccess) {
            localStorage.setItem(this.tokenKey, response.Token);
          }
          return response;
        })
      );
  }

  getUserDetail(): Observable<IUser> {
    return this.http.get<IUser>(
      `${this.apiUrl}account/detail`
      //    {
      //   headers: {
      //     Authorization: `Bearer ${this.getToken()}`,
      //   },
      // }
    );
  }

  // get thông tin users cho dashboard
  getAllUsers(): Observable<IUser[]> {
    return this.http.get<IUser[]>(`${this.apiUrl}account/users`);
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
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    console.log('🚀 ~ AuthService ~ isLoggedIn ~ token:', token);

    if (!token) return false;

    const decodedToken = jwtDecode(token);
    console.log('🚀 ~ AuthService ~ isLoggedIn ~ decodedToken:', decodedToken);

    const isTokenExpried = isBefore(
      new Date(Date.now()),
      new Date((decodedToken['exp'] as number) * 1000)
    );
    console.log(
      '🚀 ~ AuthService ~ isLoggedIn ~ isTokenExpried:',
      isTokenExpried
    );

    if (!isTokenExpried) {
      this.logout();
    }

    return isTokenExpried;
  }

  isAdminPermission(): boolean {
    const token = this.getToken();

    if (!token) return false;

    const decodedToken: any = jwtDecode(token);
    console.log(
      '🚀 ~ AuthService ~ isAdminPermission ~ decodedToken:',
      decodedToken
    );

    const bool = decodedToken.role.includes('Admin');

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
