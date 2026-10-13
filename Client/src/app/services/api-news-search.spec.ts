import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { ApiService } from './api.service';

describe('Article search HTTP filters', () => {
  it('encodes special characters and includes explicit false values and ISO date offsets', () => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    const http = TestBed.inject(HttpTestingController);
    const service = TestBed.inject(ApiService);
    service
      .SearchNews(
        0,
        20,
        'C# & .NET?',
        'a&b',
        '',
        false,
        '',
        'oldest',
        false,
        '',
        {
          titleOnly: true,
          isPinned: false,
          published: false,
          createdFrom: '2026-10-13T00:00:00+07:00',
        }
      )
      .subscribe();
    const req = http.expectOne(r => r.url.endsWith('news/search'));
    expect(req.request.params.get('keyword')).toBe('C# & .NET?');
    expect(req.request.urlWithParams).toContain('keyword=C%23%20%26%20.NET?');
    expect(req.request.params.get('userId')).toBe('a&b');
    expect(req.request.params.get('isPinned')).toBe('false');
    expect(req.request.params.get('published')).toBe('false');
    expect(req.request.params.get('createdFrom')).toBe(
      '2026-10-13T00:00:00+07:00'
    );
    req.flush({ Success: true });
    http.verify();
  });
});
