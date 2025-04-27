import { IBaseResponse, IPageInfo } from './common';

export type TypeMessage = 'string' | 'txt' | 'png' | 'jpg' | 'mp4' | 'mp3';
export interface IChat {
  MessageId: string;
  UserId: string;
  Message: string;
  Type: TypeMessage;
  CreatedDTime: Date;
}

export interface IChatResponse extends IBaseResponse<IChat> {
  objResult: IPageInfo<IChat>;
}
