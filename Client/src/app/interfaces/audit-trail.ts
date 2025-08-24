import { AuditTrailLevelType, AuditTrailTypeType } from '../types';
import { IBaseResponse } from './common';

export interface IAuditTrail {
  AuditTrailId: string;
  RecordId: string;
  IPAddress: string;
  Level: AuditTrailLevelType;
  RequestUrl: string;
  TrailType: AuditTrailTypeType;
  Description: string;
  ChangedColumns: string;
  OldValues: string;
  NewValues: string;
  ChangedBy: string;
  ChangedDTime: string;
  IsRevoked: boolean;
}

export interface IAuditTrailResponse extends IBaseResponse<IAuditTrail> {
  DataList: IAuditTrail[];
}

export interface IAuditTrailNode extends IAuditTrail {
  key: string;
  title: string | undefined;
  children: any;
}
