import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { map } from 'rxjs/operators';
import {
  SYS_PARAM_CODE,
  SysParameterConfigService,
} from '../../../services';

const DEFAULT_DASHBOARD_BACKGROUND =
  'https://i.ytimg.com/vi/UiqJa6_PsIo/maxresdefault.jpg';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [AsyncPipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private readonly config = inject(SysParameterConfigService);

  // Không startWith ảnh mặc định: vẽ ảnh mặc định trước rồi đổi sang ảnh cấu hình
  // gây nháy. Chưa có URL (async pipe trả null) thì chỉ hiện nền gradient; ảnh
  // mặc định chỉ dùng khi tham số trống/lỗi (service trả null) hoặc ảnh hỏng.
  readonly backgroundImageUrl$ = this.config
    .getText(SYS_PARAM_CODE.DASHBOARD_BACKGROUND_IMAGE)
    .pipe(map(url => url?.trim() || DEFAULT_DASHBOARD_BACKGROUND));

  // Ảnh đã tải xong thì mới hiện (fade-in), tránh thấy ảnh hiện dần từng phần
  imageLoaded = false;

  useFallbackImage(event: Event): void {
    const image = event.target as HTMLImageElement;
    if (image.src !== DEFAULT_DASHBOARD_BACKGROUND) {
      image.src = DEFAULT_DASHBOARD_BACKGROUND;
    }
  }
}
