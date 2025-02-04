import { IBaseResponse } from './common';

interface IDetailAuth {
  AccessToken: string;
  RefreshToken: string;
}

export interface AuthResponse extends IBaseResponse<IDetailAuth> {
  Data: IDetailAuth;
}
