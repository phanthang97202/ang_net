import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { map, Observable, tap } from 'rxjs';
import {
  LoginRequest,
  RefreshTokenRequest,
  AuthResponse,
  IUserResponse,
  IForgotPasswordResponse,
} from '../interfaces';
import { jwtDecode } from 'jwt-decode';
import { isBefore } from 'date-fns';
import {
  IAssignRoleRequest,
  IAssignRoleResponse,
  ICreateRoleRequest,
  IDeleteRoleResponse,
  IRoleResponse,
  IUnasignRoleResponse,
  IUnassignRoleRequest,
} from '../interfaces';
import { Router } from '@angular/router';
import { IAccountCredentials, IAdminAccountCreate } from '../interfaces/user';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  apiUrl: string = environment.apiUrl;
  private tokenKey = environment.tokenKey;
  private refreshTokenKey = environment.refreshTokenKey;
  private avatarKey = `${environment.tokenKey}.avatar`;
  private currentAvatar = signal<{ userId: string; url: string } | null>(
    this.readSavedAvatar()
  );
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
            this.clearAvatar();
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

  findAdminUserByEmail(email: string): Observable<IUserResponse> {
    return this.http.get<IUserResponse>(
      `${this.apiUrl}account/admin/users/by-email`,
      {
        params: { email },
      }
    );
  }

  createAdminUser(data: IAdminAccountCreate): Observable<IUserResponse> {
    return this.http.post<IUserResponse>(
      `${this.apiUrl}account/admin/users`,
      data
    );
  }

  addAccountCredentials(
    userId: string,
    data: IAccountCredentials
  ): Observable<IUserResponse> {
    return this.http.put<IUserResponse>(
      `${this.apiUrl}account/admin/users/${encodeURIComponent(userId)}/credentials`,
      data
    );
  }

  resetAccountPassword(
    userId: string,
    password: string
  ): Observable<IUserResponse> {
    return this.http.post<IUserResponse>(
      `${this.apiUrl}account/admin/users/${encodeURIComponent(userId)}/reset-password`,
      { Password: password }
    );
  }

  revokeAccountSessions(userId: string): Observable<IUserResponse> {
    return this.http.post<IUserResponse>(
      `${this.apiUrl}account/admin/users/${encodeURIComponent(userId)}/revoke-sessions`,
      {}
    );
  }

  setAccountLocked(userId: string, locked: boolean): Observable<IUserResponse> {
    return this.http.post<IUserResponse>(
      `${this.apiUrl}account/admin/users/${encodeURIComponent(userId)}/${locked ? 'lock' : 'unlock'}`,
      {}
    );
  }

  signInWithGoogle(idToken: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}account/login-google`, { idToken })
      .pipe(
        map(response => {
          if (response.Success) {
            this.clearAvatar();
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
    return this.http
      .get<IUserResponse>(`${this.apiUrl}account/detail`)
      .pipe(tap(response => this.rememberAvatar(response)));
  }

  updateAvatar(avatarUrl: string): Observable<IUserResponse> {
    return this.http
      .put<IUserResponse>(`${this.apiUrl}account/avatar`, {
        AvatarUrl: avatarUrl.trim(),
      })
      .pipe(tap(response => this.rememberAvatar(response)));
  }

  private readSavedAvatar(): { userId: string; url: string } | null {
    try {
      const saved = JSON.parse(localStorage.getItem(this.avatarKey) || 'null');
      return typeof saved?.userId === 'string' && typeof saved?.url === 'string'
        ? saved
        : null;
    } catch {
      return null;
    }
  }

  private rememberAvatar(response: IUserResponse): void {
    if (
      !response.Success ||
      !response.Data ||
      response.Data.Id !== this.getAccountInfo().nameid
    )
      return;
    const avatar = { userId: response.Data.Id, url: response.Data.Avatar };
    localStorage.setItem(this.avatarKey, JSON.stringify(avatar));
    this.currentAvatar.set(avatar);
  }

  private clearAvatar(): void {
    localStorage.removeItem(this.avatarKey);
    this.currentAvatar.set(null);
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
    const avatar = this.currentAvatar();

    return {
      ...decodedToken,
      shortname,
      avatar:
        avatar && avatar.userId === decodedToken.nameid
          ? avatar.url
          : decodedToken.avatar,
    };
  }

  logout() {
    this.clearTokens();
    this.router.navigate(['/login']);
  }

  logoutFromAllDevice(userId: string) {
    return this.http.post<AuthResponse>(
      `${this.apiUrl}account/logoutalldevice?userId=${userId}`,
      {}
    );
  }

  // gọi lúc app khởi động: nếu access token hết hạn nhưng còn refresh token thì chủ động refresh
  // để menu hiển thị đúng trạng thái đăng nhập ngay cả khi trang đầu tiên chỉ gọi API public
  tryRefreshOnInit(): void {
    const refreshTokenValue = localStorage.getItem(this.refreshTokenKey);

    if (this.isLoggedIn() || !refreshTokenValue) return;

    const { nameid: userid } = this.getAccountInfo();

    this.refreshToken({
      UserId: userid,
      RefreshToken: refreshTokenValue,
    }).subscribe({
      next: response => {
        if (response?.Success) {
          localStorage.setItem(this.tokenKey, response.Data.AccessToken);
          localStorage.setItem(
            this.refreshTokenKey,
            response.Data.RefreshToken
          );
        } else {
          this.clearTokens();
        }
      },
      error: () => this.clearTokens(),
    });
  }

  // xóa token hết hạn/invalid mà không ép điều hướng sang /login,
  // vì lúc init user có thể chỉ đang xem trang public
  private clearTokens(): void {
    this.clearAvatar();
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
  }

  isLoggedIn(): boolean {
    const token = this.getToken();

    if (!token) return false;

    const decodedToken = jwtDecode(token);

    const isTokenStillValid = isBefore(
      new Date(Date.now()),
      new Date((decodedToken['exp'] as number) * 1000)
    );

    return isTokenStillValid;
  }

  isAdminPermission(): boolean {
    const token = this.getToken();

    if (!token) return false;

    const decodedToken: any = jwtDecode(token);

    const bool = decodedToken?.role?.includes('Admin') ?? false;

    return bool;
  }

  /**
   * Các mã quyền có trong token. Backend gộp quyền của mọi vai trò người dùng
   * đang giữ rồi nhét vào claim "permission" lúc đăng nhập.
   *
   * Claim chỉ có MỘT giá trị thì thư viện JWT trả về chuỗi chứ không phải mảng -
   * ép về mảng để bên gọi khỏi phải phân biệt hai trường hợp.
   */
  getPermissions(): string[] {
    const token = this.getToken();
    if (!token) return [];

    const decodedToken: any = jwtDecode(token);
    const raw = decodedToken?.permission;

    if (!raw) return [];
    return Array.isArray(raw) ? raw : [raw];
  }

  /**
   * Admin đi qua mọi kiểm tra quyền - khớp với PermissionHandler ở backend.
   * Không có ngoại lệ này thì tài khoản Admin (vốn không cần gán quyền) sẽ bị
   * giao diện chặn dù API vẫn cho qua.
   */
  hasPermission(code: string): boolean {
    if (this.isAdminPermission()) return true;
    const permissions = this.getPermissions();
    // Preserve access for sessions issued before Anime became the Movie module.
    return (
      permissions.includes(code) ||
      (code === 'movie.view' && permissions.includes('anime.view'))
    );
  }

  /** Có ít nhất một trong các quyền truyền vào. */
  hasAnyPermission(codes: string[]): boolean {
    if (this.isAdminPermission()) return true;
    const owned = this.getPermissions();
    return codes.some(c => owned.includes(c));
  }

  /** Có bất kỳ quyền nào - dùng làm điều kiện vào khu quản trị. */
  hasAnyPermissionAtAll(): boolean {
    if (this.isAdminPermission()) return true;
    return this.getPermissions().length > 0;
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

  forgotPassword(email: string) {
    return this.http.get<IForgotPasswordResponse>(
      `${this.apiUrl}account/forgotpassword?username=${email}`
    );
  }
}
