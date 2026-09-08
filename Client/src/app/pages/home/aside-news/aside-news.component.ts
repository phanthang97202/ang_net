import { Component, Input, OnChanges, OnInit, inject } from '@angular/core';
import { ShowErrorService, ApiService } from '../../../services';
import { IDetailNews, IHashTagNews } from '../../../interfaces';
import {
  AntdModule,
  REUSE_COMPONENT_MODULES,
  REUSE_PIPE_MODULE,
} from '../../../modules';

@Component({
  selector: 'app-aside-news',
  standalone: true,
  imports: [AntdModule, ...REUSE_COMPONENT_MODULES, ...REUSE_PIPE_MODULE],
  templateUrl: './aside-news.component.html',
  styleUrl: './aside-news.component.scss',
})
export class AsideNewsComponent implements OnInit, OnChanges {
  showErrorService = inject(ShowErrorService);
  apiService = inject(ApiService);

  // Không báo qua LoadingService: đó là bộ đếm request chung của cả app và nó
  // bật spinner che kín màn hình. Khối này chỉ là thanh bên, hai request lại
  // xong ở hai thời điểm khác nhau (còn loadNews() chạy lại mỗi lần đổi bài),
  // nên báo vào đó là làm spinner và skeleton của trang chi tiết nhấp nháy theo
  // lịch của thanh bên. Chỗ này tự hiện dần khi có dữ liệu là đủ.

  // Trang chi tiết truyền 2 giá trị này vào để khối đổi thành "bài viết liên
  // quan": cùng danh mục, mới nhất, bỏ chính bài đang đọc. Trang danh sách tin
  // không truyền gì nên vẫn là "bài viết gần đây" như trước.
  @Input() categoryId = '';
  @Input() excludeNewsId = '';

  lstNews: IDetailNews[] = [];
  lstTopHashTag: IHashTagNews[] = [];

  private initialized = false;

  get isRelatedMode(): boolean {
    return !!this.categoryId;
  }

  ngOnInit() {
    this.initialized = true;
    this.loadNews();
    this.loadTopHashTag();
  }

  // Component nằm ngoài khối *ngIf của trang chi tiết nên nó có mặt trước khi
  // bài viết tải xong, và khi chuyển sang bài khác nó cũng không bị dựng lại.
  // Cả hai trường hợp đều tới đây chứ không qua ngOnInit.
  ngOnChanges(): void {
    if (this.initialized) {
      this.loadNews();
    }
  }

  private loadNews(): void {
    // API sắp sẵn theo CreatedDTime giảm dần và lọc theo danh mục khi categoryId
    // khác rỗng, nên chỉ còn phải bỏ bài đang đọc ra.
    this.apiService.SearchNews(0, 10, '', '', this.categoryId).subscribe({
      next: res => {
        this.lstNews = res.objResult.DataList.filter(
          item => item.NewsId !== this.excludeNewsId
        );
      },
      error: err => {
        this.showErrorService.setShowError({
          icon: 'warning',
          message: JSON.stringify(err, null, 2),
          title: err.message,
        });
        throw new Error(err);
      },
    });
  }

  private loadTopHashTag(): void {
    this.apiService.GetTopHashTag().subscribe({
      next: res => {
        this.lstTopHashTag = res.DataList;
      },
      error: err => {
        this.showErrorService.setShowError({
          icon: 'warning',
          message: JSON.stringify(err, null, 2),
          title: err.message,
        });
        throw new Error(err);
      },
    });
  }
}
