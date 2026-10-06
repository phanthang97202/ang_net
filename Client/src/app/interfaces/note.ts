import { IBaseResponse, IPageInfo } from './common';
import { ICursorPageInfo } from './reel';

export interface INote {
  NoteId: string;
  Alias: string;
  ContentBody: string;
  FlagActive: boolean;
  CreatedDTime: string;
  UpdatedDTime: string;
}

export interface INoteCreateRequest {
  Alias: string;
  ContentBody: string;
}

export interface INoteUnreadState {
  UnreadCount: number;
  ServerDTime: string;
}

export type INoteResponse = IBaseResponse<INote>;

export type INoteUnreadStateResponse = IBaseResponse<INoteUnreadState>;

export type INoteFeedResponse = Omit<IBaseResponse<INote>, 'objResult'> & {
  objResult: ICursorPageInfo<INote>;
};

export type INoteAdminSearchResponse = Omit<
  IBaseResponse<INote>,
  'objResult'
> & {
  objResult: IPageInfo<INote>;
};
