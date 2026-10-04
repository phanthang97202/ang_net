import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { IArchiveCollection } from '../../../interfaces';
import { ArchiveService } from '../../../services';
import { ArchiveCollectionFormComponent } from '../../../components/archive/archive-collection-form/archive-collection-form.component';
import { ArchiveCollectionViewComponent } from '../../../components/archive/archive-collection-view/archive-collection-view.component';
import { archiveVisibilityOption } from '../../../components/archive/archive-visibility';

/**
 * Tab "Thư viện lưu trữ" trong hồ sơ: danh sách bộ sưu tập của chính mình.
 * Bộ đang mở nằm trong ?collection= để F5 / nút back vẫn đúng chỗ.
 */
@Component({
  selector: 'app-my-archive',
  standalone: true,
  imports: [
    CommonModule,
    NzButtonModule,
    NzIconModule,
    ArchiveCollectionFormComponent,
    ArchiveCollectionViewComponent,
  ],
  templateUrl: './my-archive.component.html',
  styleUrl: './my-archive.component.scss',
})
export class MyArchiveComponent implements OnInit {
  private archiveService = inject(ArchiveService);
  private message = inject(NzMessageService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  collections: IArchiveCollection[] = [];
  openCollectionId: string | null = null;
  isLoading = false;
  isFormOpen = false;
  movingId: string | null = null;

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      this.openCollectionId = params.get('collection');
    });
    this.load();
  }

  visibilityOf(collection: IArchiveCollection) {
    return archiveVisibilityOption(collection.Visibility);
  }

  load(): void {
    this.isLoading = this.collections.length === 0;
    this.archiveService.myCollections().subscribe({
      next: response => {
        this.isLoading = false;
        if (!response?.Success) {
          this.message.error(response?.ErrorMessage || 'Không tải được thư viện');
          return;
        }
        this.collections = response.DataList ?? [];
      },
      error: () => {
        this.isLoading = false;
        this.message.error('Không tải được thư viện');
      },
    });
  }

  openCollection(collectionId: string | null): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { collection: collectionId },
      queryParamsHandling: 'merge',
    });
  }

  onCreated(collection: IArchiveCollection): void {
    this.isFormOpen = false;
    this.load();
    this.openCollection(collection.CollectionId);
  }

  onDeleted(): void {
    this.openCollection(null);
    this.load();
  }

  move(collection: IArchiveCollection, direction: 'up' | 'down', event: Event): void {
    event.stopPropagation();
    if (this.movingId) return;

    this.movingId = collection.CollectionId;
    this.archiveService.reorderCollection(collection.CollectionId, direction).subscribe({
      next: response => {
        this.movingId = null;
        if (!response?.Success) {
          this.message.warning(response?.ErrorMessage || 'Không đổi được thứ tự');
          return;
        }
        this.load();
      },
      error: () => {
        this.movingId = null;
        this.message.error('Không đổi được thứ tự');
      },
    });
  }
}
