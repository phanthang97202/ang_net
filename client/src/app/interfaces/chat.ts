import { IPageInfo } from './common';

export type TypeMessage = 'string' | 'txt' | 'png' | 'jpg' | 'mp4' | 'mp3';
export interface IChat {
  MessageId: string;
  UserId: string;
  Message: string;
  Type: TypeMessage; //
  CreatedDTime: Date;
}

export interface IChatResponse {
  Success: boolean;
  ErrorMessage: string;
  Data: any;
  DataList: any[];
  objResult: IPageInfo<IChat>;
  RequestDTimeAt: Date;
  RequestClients: any;
}
