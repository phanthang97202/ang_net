import { IBaseResponse, IPageInfo } from './common';

export type TypeMessage =
  'string' | 'txt' | 'png' | 'jpg' | 'image' | 'mp4' | 'mp3';
export interface IChat {
  MessageId: string;
  Sequence: number;
  SenderName?: string;
  SenderAvatar?: string;
  UserId: string;
  Message: string;
  Type: TypeMessage;
  CreatedDTime: Date;
}

export interface IChatResponse extends IBaseResponse<IChat> {
  objResult: IPageInfo<IChat>;
}
export interface IChatNotifications {
  UnreadCount: number;
  LatestMessage: IChat | null;
}
export interface IChatDeleted {
  MessageId: string;
  Sequence: number;
}
