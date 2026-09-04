import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, shareReplay } from 'rxjs/operators';
import { ApiService } from './api.service';
import { INewsResponse } from '../interfaces/news';
import { INewsCategoryResponse } from '../interfaces/news-category';

// Router huỷ component khi rời route và tạo lại khi quay về, nên mỗi lần bấm
// vào 1 bài rồi back lại trang chủ là ngOnInit chạy lại -> gọi API lại ->
// spinner nháy, danh sách dựng lại từ đầu. Cache ở đây để lần quay lại lấy
// thẳng từ bộ nhớ (phát đồng bộ, không kịp thấy spinner).
//
// Chỉ dùng cho các màn hình công khai. Dashboard vẫn gọi thẳng ApiService: ở
// đó vừa sửa bài xong là phải thấy dữ liệu mới ngay, không được cache.
const TTL_MS = 60_000;

interface CacheEntry<T> {
  at: number;
  response$: Observable<T>;
}

@Injectable({ providedIn: 'root' })
export class NewsCacheService {
  private api = inject(ApiService);
  private cache = new Map<string, CacheEntry<unknown>>();

  SearchNews(
    pageIndex: number,
    pageSize: number,
    keyword: string,
    userId: string,
    categoryId: string,
    onlyPublished = true,
    hashTag = ''
  ): Observable<INewsResponse> {
    const key = [
      'search',
      pageIndex,
      pageSize,
      keyword,
      userId,
      categoryId,
      onlyPublished,
      hashTag,
    ].join('|');

    return this.through(key, () =>
      this.api.SearchNews(
        pageIndex,
        pageSize,
        keyword,
        userId,
        categoryId,
        onlyPublished,
        hashTag
      )
    );
  }

  GetAllActiveNewsCategory(): Observable<INewsCategoryResponse> {
    return this.through('categories', () =>
      this.api.GetAllActiveNewsCategory()
    );
  }

  private through<T>(key: string, request: () => Observable<T>): Observable<T> {
    const hit = this.cache.get(key) as CacheEntry<T> | undefined;

    if (hit && Date.now() - hit.at < TTL_MS) {
      return hit.response$;
    }

    const response$ = request().pipe(
      // Không có catchError thì shareReplay sẽ giữ luôn cả lỗi: mạng chập một
      // nhịp là mọi lần gọi sau trong suốt TTL đều nhận lại đúng lỗi đó dù
      // server đã ổn. Xoá khỏi cache để lần gọi kế tiếp thử lại thật.
      catchError(err => {
        this.cache.delete(key);
        return throwError(() => err);
      }),
      shareReplay(1)
    );

    this.cache.set(key, { at: Date.now(), response$ });

    return response$;
  }
}
