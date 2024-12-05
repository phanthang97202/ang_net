import { IBaseResponse } from './common';

interface IDetailAuth {
  Token: string;
}

export interface AuthResponse extends IBaseResponse<IDetailAuth> {
  Data: IDetailAuth;
}
