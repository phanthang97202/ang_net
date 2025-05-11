import { IsViewDirective } from '../directives';
import {
  LocalDTime,
  ShowNullishValue,
  SizeImgCloudinary,
  SubString,
} from '../pipes';
// toàn bộ những pipe standalone
export const REUSE_PIPE_MODULE = [
  SubString,
  LocalDTime,
  ShowNullishValue,
  IsViewDirective,
  SizeImgCloudinary,
];
