import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { map, startWith } from 'rxjs/operators';
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

  readonly backgroundImageUrl$ = this.config
    .getText(SYS_PARAM_CODE.DASHBOARD_BACKGROUND_IMAGE)
    .pipe(
      map(url => url?.trim() || DEFAULT_DASHBOARD_BACKGROUND),
      startWith(DEFAULT_DASHBOARD_BACKGROUND)
    );

  useFallbackImage(event: Event): void {
    const image = event.target as HTMLImageElement;
    if (image.src !== DEFAULT_DASHBOARD_BACKGROUND) {
      image.src = DEFAULT_DASHBOARD_BACKGROUND;
    }
  }
}
