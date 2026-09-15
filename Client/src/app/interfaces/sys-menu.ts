import { IBaseResponse } from './common';

/** Một mục menu kèm menu con - backend gom sẵn thành cây, client vẽ thẳng. */
export interface ISysMenuTree {
  MenuId: string;
  TitleVi: string;
  TitleEn: string;
  Path: string;
  Icon: string;
  SortOrder: number;
  FlagActive: boolean;
  Children: ISysMenuTree[];
}

/** Dữ liệu tạo/sửa một mục menu. */
export interface ISysMenuSave {
  MenuId: string;
  ParentId: string;
  TitleVi: string;
  TitleEn: string;
  Path: string;
  Icon: string;
  SortOrder: number;
  FlagActive: boolean;
}

export interface ISysMenuTreeResponse extends IBaseResponse<ISysMenuTree> {
  DataList: ISysMenuTree[];
}

export interface ISysMenuSaveResponse extends IBaseResponse<ISysMenuSave> {
  Data: ISysMenuSave;
}
