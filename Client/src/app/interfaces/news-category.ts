import { IBaseResponse, IPageInfo } from './common';
import { INewsItemSm } from './news';

export interface INewsCategory {
  NewsCategoryId: string;
  NewsCategoryParentId: string;
  NewsCategoryName: string;
  NewsCategoryIndex: number;
}

export interface INewsCategoryResponse extends IBaseResponse<INewsCategory> {
  DataList: INewsCategory[];
}

// ── Khối "Khám phá theo chủ đề" ngoài trang chủ ────────────────────────
// API gom sẵn theo danh mục gốc: TotalCount đã cộng cả bài của danh mục con,
// Posts là vài bài đọc nhiều nhất trong cả nhánh.
export interface INewsCategoryPreview {
  NewsCategoryId: string;
  NewsCategoryName: string;
  NewsCategoryIndex: number;
  TotalCount: number;
  Children: INewsCategory[];
  Posts: INewsItemSm[];
}

export interface INewsCategoryPreviewResponse
  extends IBaseResponse<INewsCategoryPreview> {
  DataList: INewsCategoryPreview[];
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
