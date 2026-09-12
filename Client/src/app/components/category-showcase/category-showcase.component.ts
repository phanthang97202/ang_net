import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NewsCacheService, ShowErrorService } from '../../services';
import { INewsCategoryPreview } from '../../interfaces';
import { ScrollRevealDirective } from '../../directives';
import {
  CONSTANTS_APP,
  getTopicColor as topicColor,
  getTopicIconPath as topicIconPath,
} from '../../helpers';
import { NewsItemSmComponent } from '../news-items-sm/news-item-sm.component';

@Component({
  selector: 'app-category-showcase',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TranslateModule,
    ScrollRevealDirective,
    NewsItemSmComponent,
  ],
  templateUrl: './category-showcase.component.html',
  styleUrls: ['./category-showcase.component.scss'],
})
export class CategoryShowcaseComponent implements OnInit {
  private newsCacheService = inject(NewsCacheService);
  private showErrorService = inject(ShowErrorService);

  isLoading = true;
  categories: INewsCategoryPreview[] = [];

  ngOnInit(): void {
    this.loadCategories();
  }

  // API trả sẵn theo danh mục gốc, đã bỏ mục chưa có bài, đã xếp theo
  // NewsCategoryIndex và bài trong mỗi mục đã xếp theo lượt đọc - ở đây không
  // sắp lại gì nữa để thứ tự trên trang đúng bằng thứ tự admin đã cấu hình.
  private loadCategories(): void {
    this.newsCacheService
      .GetNewsCategoryPreview(CONSTANTS_APP.CATEGORY_PREVIEW_TAKE)
      .subscribe({
        next: res => {
          this.categories = res.DataList || [];
          this.isLoading = false;
        },
        error: err => {
          this.showErrorService.setShowError({
            icon: 'warning',
            message: JSON.stringify(err, null, 2),
            title: err.message,
          });
          this.isLoading = false;
          throw new Error(err);
        },
      });
  }

  trackById(_: number, category: INewsCategoryPreview): string {
    return category.NewsCategoryId;
  }

  // Cùng helper với thanh chọn chủ đề: một danh mục phải ra đúng một icon/màu ở
  // cả hai khối, nếu không người đọc sẽ không nhận ra đó là cùng một chủ đề.
  getTopicIconPath(name: string, index: number): string {
    return topicIconPath(name, index);
  }

  getTopicColor(index: number): string {
    return topicColor(index);
  }
}
