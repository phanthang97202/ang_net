import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { NewsCacheService } from './news-cache.service';
import { ApiService } from './api.service';
import { INewsResponse } from '../interfaces/news';

describe('NewsCacheService', () => {
  let api: jasmine.SpyObj<ApiService>;
  let service: NewsCacheService;

  const response = { Success: true } as INewsResponse;
  const search = () => service.SearchNews(0, 10, '', '', '');

  beforeEach(() => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(2026, 0, 1));

    api = jasmine.createSpyObj<ApiService>('ApiService', [
      'SearchNews',
      'GetAllActiveNewsCategory',
    ]);
    api.SearchNews.and.returnValue(of(response));

    TestBed.configureTestingModule({
      providers: [NewsCacheService, { provide: ApiService, useValue: api }],
    });
    service = TestBed.inject(NewsCacheService);
  });

  afterEach(() => jasmine.clock().uninstall());

  it('chỉ gọi API 1 lần khi cùng bộ tham số được yêu cầu lại trong TTL', () => {
    search().subscribe();
    search().subscribe();

    expect(api.SearchNews).toHaveBeenCalledTimes(1);
  });

  // Đây mới là thứ khiến spinner không kịp nháy khi quay lại trang chủ: dữ
  // liệu phải phát ra ngay trong lúc subscribe, không đợi tick nào cả.
  it('phát lại dữ liệu đồng bộ cho lần gọi thứ hai', () => {
    search().subscribe();

    let emitted: INewsResponse | undefined;
    search().subscribe(res => (emitted = res));

    expect(emitted).toBe(response);
  });

  it('gọi lại API sau khi hết TTL 60 giây', () => {
    search().subscribe();
    jasmine.clock().tick(60_001);
    search().subscribe();

    expect(api.SearchNews).toHaveBeenCalledTimes(2);
  });

  it('cache riêng cho từng bộ tham số lọc', () => {
    service.SearchNews(0, 10, '', '', 'cuisine').subscribe();
    service.SearchNews(0, 10, '', '', 'travel').subscribe();

    expect(api.SearchNews).toHaveBeenCalledTimes(2);
  });

  it('không giữ lỗi lại trong cache', () => {
    api.SearchNews.and.returnValue(throwError(() => new Error('mạng lỗi')));
    search().subscribe({ error: () => undefined });

    api.SearchNews.and.returnValue(of(response));
    let emitted: INewsResponse | undefined;
    search().subscribe(res => (emitted = res));

    expect(api.SearchNews).toHaveBeenCalledTimes(2);
    expect(emitted).toBe(response);
  });
});
