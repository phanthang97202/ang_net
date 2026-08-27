import { Component } from '@angular/core';
import { AntdModule, REUSE_COMPONENT_MODULES } from '../../../modules';

// Danh sách bài viết (kể cả phần lọc theo categoryId/keyword/hashTag trên URL,
// phân trang và trạng thái loading) nằm hết trong app-new-news - cùng component
// trang chủ đang dùng, nên 2 trang hiển thị giống hệt nhau. Ở đây chỉ còn bố cục
// 2 cột: danh sách + sidebar.
@Component({
  selector: 'app-news-page',
  standalone: true,
  imports: [AntdModule, ...REUSE_COMPONENT_MODULES],
  templateUrl: './news.component.html',
  styleUrl: './news.component.scss',
})
export class NewsComponent {}
