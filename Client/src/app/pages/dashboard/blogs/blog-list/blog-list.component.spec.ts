import { TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { BlogListComponent } from './blog-list.component';
import {
  ApiService,
  AuthService,
  LoadingService,
  NewsCacheService,
  ShowErrorService,
} from '../../../../services';

describe('Dashboard article filters', () => {
  let api: any;
  let admin = true;
  const response = { Success: true, objResult: { DataList: [], ItemCount: 0 } };
  beforeEach(() => {
    admin = true;
    api = {
      SearchNews: jasmine.createSpy().and.returnValue(of(response)),
      NewsAuthors: jasmine
        .createSpy()
        .and.returnValue(of({ Success: true, DataList: [] })),
    };
    TestBed.configureTestingModule({
      imports: [BlogListComponent],
      providers: [
        { provide: ApiService, useValue: api },
        {
          provide: AuthService,
          useValue: {
            getAccountInfo: () => ({ nameid: 'me' }),
            isAdminPermission: () => admin,
            hasPermission: () => true,
          },
        },
        { provide: Router, useValue: { navigate: jasmine.createSpy() } },
        {
          provide: NzMessageService,
          useValue: { warning: jasmine.createSpy() },
        },
        { provide: NzModalService, useValue: {} },
        { provide: NewsCacheService, useValue: {} },
        {
          provide: ShowErrorService,
          useValue: { setShowError: jasmine.createSpy() },
        },
        {
          provide: LoadingService,
          useValue: { setLoading: jasmine.createSpy() },
        },
      ],
    }).overrideComponent(BlogListComponent, {
      set: { template: '', imports: [] },
    });
  });
  function create() {
    const fixture = TestBed.createComponent(BlogListComponent);
    fixture.detectChanges();
    return fixture;
  }
  it('combines title, author, full local date range, pin and draft filters before paging', () => {
    const f = create();
    const c = f.componentInstance;
    c.pageIndex = 5;
    c.filters = {
      title: '  Dapper & SQL  ',
      author: 'author',
      dates: [new Date(2026, 9, 13), new Date(2026, 9, 14)],
      pinned: false,
      status: 'draft',
    };
    c.applyFilters();
    const args = api.SearchNews.calls.mostRecent().args;
    expect(args[0]).toBe(0);
    expect(args[2]).toBe('Dapper & SQL');
    expect(args[3]).toBe('author');
    expect(args[10]).toEqual({
      titleOnly: true,
      createdFrom: new Date(2026, 9, 13).toISOString(),
      createdBefore: new Date(2026, 9, 15).toISOString(),
      isPinned: false,
      published: false,
    });
    c.onQueryParamsChange({ pageIndex: 2, pageSize: 20 } as any);
    expect(api.SearchNews.calls.mostRecent().args[0]).toBe(1);
    expect(api.SearchNews.calls.mostRecent().args[10]).toEqual(args[10]);
    f.destroy();
  });
  it('keeps author scope for non-admins and does not load the author catalogue', () => {
    admin = false;
    const f = create();
    const c = f.componentInstance;
    c.filters.author = 'someone-else';
    c.applyFilters();
    expect(api.SearchNews.calls.mostRecent().args[3]).toBe('me');
    expect(api.NewsAuthors).not.toHaveBeenCalled();
    f.destroy();
  });
  it('resets all filters and sorting and accepts a cleared date picker', () => {
    const f = create();
    const c = f.componentInstance;
    c.filters.status = 'Private';
    c.filters.dates = null as any;
    c.applyFilters();
    expect(api.SearchNews.calls.mostRecent().args[9]).toBe('Private');
    c.sort = 'views';
    c.resetFilters();
    expect(c.hasFilters).toBeFalse();
    expect(c.sort).toBe('latest');
    expect(c.pageIndex).toBe(1);
    expect(
      api.SearchNews.calls.mostRecent().args[10].published
    ).toBeUndefined();
    f.destroy();
  });
  it('cancels an old request and clears the loading state after errors', () => {
    const old = new Subject<any>();
    api.SearchNews.and.returnValue(old);
    const f = create();
    const c = f.componentInstance;
    const current = new Subject<any>();
    api.SearchNews.and.returnValue(current);
    c.sort = 'oldest';
    c.changeSort();
    expect(old.observers.length).toBe(0);
    old.next({
      Success: true,
      objResult: { DataList: [{ NewsId: 'stale' }], ItemCount: 1 },
    });
    expect(c.dataSource.length).toBe(0);
    current.error(new Error('Network'));
    expect(c.tableLoading).toBeFalse();
    f.destroy();
  });
});
