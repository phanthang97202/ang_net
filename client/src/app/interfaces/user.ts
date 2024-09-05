export interface IUser {
  id: string;
  fullName: string;
  email: string;
  roles: string[];
  phoneNumber: string;
  twoFacotrEnabled: true;
  phoneNumberConfirmed: true;
  accessFailedCount: number;
}
