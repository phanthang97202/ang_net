export interface IUser {
  id: string;
  fullName: string;
  email: string;
  roles: string[];
  phoneNumber: string;
  twoFacotrEnabled: boolean;
  phoneNumberConfirmed: boolean;
  accessFailedCount: number;
}
// dashboard
export interface IUserInfo {
  fullName: string;
  id: string;
  roles: string[];
  userName: string;
  normalizedUserName: string;
  email: string;
  normalizedEmail: string;
  emailConfirmed: boolean;
  passwordHash: string;
  securityStamp: string;
  concurrencyStamp: string;
  phoneNumber: string | null;
  phoneNumberConfirmed: boolean;
  twoFactorEnabled: boolean;
  lockoutEnd: string | null;
  lockoutEnabled: boolean;
  accessFailedCount: number;
}
