import { IBaseResponse } from './common';

export interface IUserResponse extends IBaseResponse<IUser> {}

export interface IUser {
  Id: string;
  UserName: string;
  HasPassword: boolean;
  FullName: string;
  Email: string;
  Avatar: string;
  Roles: string[];
  PhoneNumber: string;
  TwoFacotrEnabled: boolean;
  PhoneNumberConfirmed: boolean;
  AccessFailedCount: number;
  FlagActive: boolean;
}

export interface IAccountCredentials {
  UserName: string;
  Password: string;
}

export interface IAdminAccountCreate extends IAccountCredentials {
  Email: string;
  FullName: string;
}
// dashboard
export interface IUserInfo {
  FullName: string;
  Id: string;
  Roles: string[];
  UserName: string;
  NormalizedUserName: string;
  Email: string;
  NormalizedEmail: string;
  EmailConfirmed: boolean;
  PasswordHash: string;
  SecurityStamp: string;
  ConcurrencyStamp: string;
  PhoneNumber: string | null;
  phoneNumberConfirmed: boolean;
  TwoFactorEnabled: boolean;
  LockoutEnd: string | null;
  LockoutEnabled: boolean;
  AccessFailedCount: number;
}
