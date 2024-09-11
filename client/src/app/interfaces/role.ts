export interface ICreateRoleRequest {
  roleName: string;
}

export interface IRole {
  id: string;
  name: string;
  totalUsers: number;
}

export interface IRoleResponse {
  isSuccess: boolean;
  data: IRole[];
}

export interface IRoleResponseBase {
  isSuccess: boolean;
  message: string;
}
export interface IDeleteRoleResponse extends IRoleResponseBase {}

export interface IAssignRoleRequest {
  UserId: string;
  RoleId: string;
}

export interface IAssignRoleResponse extends IRoleResponseBase {}
