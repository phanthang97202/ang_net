import { IBaseResponse } from './common';
import { IDetailNews } from './news';
import { ICursorPageInfo } from './reel';

export type TBlogActivityKind =
  | 'PostLiked'
  | 'PostUnliked'
  | 'Commented'
  | 'CommentLiked'
  | 'CommentUnliked'
  | 'Rated';
export interface IBlogActivity {
  ActivityId: string;
  Kind: TBlogActivityKind;
  OccurredAt: string;
  NewsId: string;
  CategoryNewsId: string;
  Title: string;
  TitleEn: string;
  HasEnglishTranslation: boolean;
  CommentId: string | null;
  CommentContent: string | null;
  Point: number | null;
}
export type IMyFavoritesResponse = Omit<
  IBaseResponse<IDetailNews>,
  'objResult'
> & {
  objResult: ICursorPageInfo<IDetailNews> & { ItemCount: number };
};
export type IMyActivityResponse = Omit<
  IBaseResponse<IBlogActivity>,
  'objResult'
> & {
  objResult: ICursorPageInfo<IBlogActivity>;
};
