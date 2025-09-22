import { IBaseResponse } from './common';

interface IDetailAuth {
  AccessToken: string;
  RefreshToken: string;
}

export interface AuthResponse extends IBaseResponse<IDetailAuth> {
  Data: IDetailAuth;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IForgotPasswordResponse extends IBaseResponse<string> {}
