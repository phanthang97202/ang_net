export interface IUserResponse {
  Success: boolean;
  ErrorMessage: any;
  RequestDTimeAt: Date;
  RequestClients: any;
  Data: IUser;
  DataList: IUser[];
  objResult: any;
}

export interface IUser {
  Id: string;
  FullName: string;
  Email: string;
  Roles: string[];
  PhoneNumber: string;
  TwoFacotrEnabled: boolean;
  PhoneNumberConfirmed: boolean;
  AccessFailedCount: number;
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
