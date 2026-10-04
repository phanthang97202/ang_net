import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { ArchiveCollectionViewComponent } from '../../components/archive/archive-collection-view/archive-collection-view.component';

/** Trang mở từ link chia sẻ /archive/:collectionId. */
@Component({
  selector: 'app-archive-public',
  standalone: true,
  imports: [ArchiveCollectionViewComponent],
  template: `
    <div class="archive-public">
      @if (collectionId(); as id) {
        <app-archive-collection-view [collectionId]="id" />
      }
    </div>
  `,
  styles: [
    `
      .archive-public {
        padding: 28px 0 48px;
      }
    `,
  ],
})
export class ArchivePublicComponent {
  private route = inject(ActivatedRoute);

  collectionId = toSignal(
    this.route.paramMap.pipe(map(params => params.get('collectionId') ?? '')),
    { initialValue: '' }
  );
}
