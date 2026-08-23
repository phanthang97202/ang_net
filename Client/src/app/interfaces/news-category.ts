import { IBaseResponse, IPageInfo } from './common';

export interface INewsCategory {
  NewsCategoryId: string;
  NewsCategoryParentId: string;
  NewsCategoryName: string;
  NewsCategoryIndex: number;
}

export interface INewsCategoryResponse extends IBaseResponse<INewsCategory> {
  DataList: INewsCategory[];
}

export interface INewsCategoryNode extends INewsCategory {
  key: string;
  title: string | undefined;
  children: any;
}

// ── Quản trị danh mục (trang /dashboard/newscategory) ──────────────────
export interface ISearchNewsCategoryRequest {
  pageIndex: number;
  pageSize: number;
  keyword: string;
}

// Bản đầy đủ dùng cho màn quản trị: INewsCategory ở trên là bản rút gọn
// dùng cho các màn công khai (thanh chọn chủ đề, form tạo bài).
export interface INewsCategoryAdmin extends INewsCategory {
  IsGlobal: boolean;
  FlagActive: boolean;
  CreatedDTime?: Date;
  UpdatedDTime?: Date;
}

export interface IResponseNewsCategorySearch
  extends IBaseResponse<INewsCategoryAdmin> {
  objResult: IPageInfo<INewsCategoryAdmin>;
}

export type IRequestNewsCategoryCreate = Omit<
  INewsCategoryAdmin,
  'CreatedDTime' | 'UpdatedDTime'
>;

export type IResponseNewsCategoryCreate = IBaseResponse<INewsCategoryAdmin>;
