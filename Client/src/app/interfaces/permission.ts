import { IBaseResponse } from './common';

export interface IPermissionItem {
  PermissionCode: string;
  PermissionNameVi: string;
  PermissionNameEn: string;
  DescriptionVi: string;
  DescriptionEn: string;
  SortOrder: number;
}

// Danh mục quyền do backend gom sẵn theo module, client khỏi phải tự nhóm lại.
export interface IPermissionModule {
  Module: string;
  ModuleNameVi: string;
  ModuleNameEn: string;
  Permissions: IPermissionItem[];
}

export interface IRolePermission {
  RoleId: string;
  RoleName: string;
  Permissions: string[];
}

export interface IUpdateRolePermissionRequest {
  RoleId: string;
  Permissions: string[];
}

export interface IPermissionCatalogueResponse
  extends IBaseResponse<IPermissionModule> {
  DataList: IPermissionModule[];
}

export interface IRolePermissionResponse
  extends IBaseResponse<IRolePermission> {
  Data: IRolePermission;
}
