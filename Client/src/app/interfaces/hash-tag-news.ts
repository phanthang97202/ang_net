import { IBaseResponse } from './common';

export interface IHashTagNews {
  HashTagNewsId: string;
  NewsId: string;
  HashTagNewsName: string;
  LanguageCode: 'vi' | 'en';
  FlagActive: boolean;
  CreatedDTime: Date;
  UpdatedDTime: Date;
  /**
   * Số bài viết đã xuất bản đang dùng tag này. Chỉ có ý nghĩa ở kết quả của
   * GetTopHashTag - server đếm lại rồi ghi vào đây; ở các nơi khác cột này trong
   * DB không được cộng dồn nên đừng tin.
   */
  Count?: number;
}

export interface IHashTagNewsResponse extends IBaseResponse<IHashTagNews> {
  DataList: IHashTagNews[];
}
