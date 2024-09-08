import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { LoginRequest } from '../interfaces/login-request';
import { delay, map, Observable } from 'rxjs';
import { AuthResponse } from '../interfaces/auth-response';
import { jwtDecode } from 'jwt-decode';
import { isAfter, isBefore } from 'date-fns';
import { IUser, IUserInfo } from '../interfaces/user';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  apiUrl: string = environment.apiUrl;
  private tokenKey = 'token';
  constructor(private http: HttpClient) {}

  login(data: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}account/login`, data)

      .pipe(
        // delay(2000),
        map((response) => {
          if (response.isSuccess) {
            localStorage.setItem(this.tokenKey, response.token);
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
  getAllUsers(): Observable<IUserInfo[]> {
    return this.http.get<IUserInfo[]>(`${this.apiUrl}account/users`);
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
  }

  isLoggedIn(): boolean {
    const token = this.getToken();

    if (!token) return false;

    const decodedToken = jwtDecode(token);

    const isTokenExpried = isBefore(
      new Date(Date.now()),
      new Date((decodedToken['exp'] as number) * 1000)
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

    const bool = decodedToken.role.includes('Admin');

    return bool;
  }

  getToken() {
    return localStorage.getItem(this.tokenKey) ?? '';
  }
}
