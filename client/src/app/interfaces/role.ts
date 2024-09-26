export interface ICreateRoleRequest {
  roleName: string;
}

export interface IRole {
  Id: string;
  Name: string;
  TotalUsers: number;
}

export interface IRoleResponse {
  IsSuccess: boolean;
  Data: IRole[];
}

export interface IRoleResponseBase {
  IsSuccess: boolean;
  Message: string;
}
export interface IDeleteRoleResponse extends IRoleResponseBase {}

export interface IAssignRoleRequest {
  UserId: string;
  RoleId: string;
}

export interface IUnassignRoleRequest extends IAssignRoleRequest {}

export interface IAssignRoleResponse extends IRoleResponseBase {}
export interface IUnasignRoleResponse extends IRoleResponseBase {}
