export interface LoginRequest {
  email: string;
  password: string;
}
export interface RefreshTokenRequest {
  UserId: string;
  RefreshToken: string;
}
