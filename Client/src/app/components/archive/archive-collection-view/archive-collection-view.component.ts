import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  Output,
  inject,
} from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { IArchiveCollection, IArchiveItem } from '../../../interfaces';
import { ArchiveService } from '../../../services';
import { ArchiveCollectionFormComponent } from '../archive-collection-form/archive-collection-form.component';
import { ArchiveItemFormComponent } from '../archive-item-form/archive-item-form.component';
import { ArchiveItemViewerComponent } from '../archive-item-viewer/archive-item-viewer.component';
import { archiveVisibilityOption } from '../archive-visibility';
import { ArchiveProviderIconComponent } from '../archive-provider-icon/archive-provider-icon.component';

const PAGE_SIZE = 24;

/**
 * Một bộ sưu tập: tiêu đề + lưới các mục + xem chi tiết. Dùng cho cả tab
 * "Thư viện lưu trữ" trong hồ sơ và trang chia sẻ công khai; các nút sửa/xoá
 * chỉ hiện khi server báo IsOwner, quyền thật vẫn do server kiểm tra.
 */
@Component({
  selector: 'app-archive-collection-view',
  standalone: true,
  imports: [
    CommonModule,
    NzButtonModule,
    NzDropDownModule,
    NzIconModule,
    NzModalModule,
    NzSkeletonModule,
    ArchiveCollectionFormComponent,
    ArchiveItemFormComponent,
    ArchiveItemViewerComponent,
    ArchiveProviderIconComponent,
  ],
  templateUrl: './archive-collection-view.component.html',
  styleUrl: './archive-collection-view.component.scss',
})
export class ArchiveCollectionViewComponent implements OnChanges {
  @Input({ required: true }) collectionId = '';
  @Input() showBack = false;
  @Output() back = new EventEmitter<void>();
  /** Bộ sưu tập hoặc số mục thay đổi - để danh sách bên ngoài làm mới */
  @Output() changed = new EventEmitter<void>();
  @Output() deleted = new EventEmitter<void>();

  private archiveService = inject(ArchiveService);
  private message = inject(NzMessageService);
  private modal = inject(NzModalService);

  collection: IArchiveCollection | null = null;
  items: IArchiveItem[] = [];
  itemCount = 0;
  pageIndex = 0;
  isLoading = false;
  isLoadingMore = false;
  notFound = false;

  viewingIndex: number | null = null;
  isItemFormOpen = false;
  editingItem: IArchiveItem | null = null;
  isCollectionFormOpen = false;

  ngOnChanges(): void {
    this.loadCollection();
  }

  get visibility() {
    return archiveVisibilityOption(this.collection?.Visibility ?? 'Private');
  }

  get viewingItem(): IArchiveItem | null {
    return this.viewingIndex === null ? null : this.items[this.viewingIndex] ?? null;
  }

  get hasMore(): boolean {
    return this.items.length < this.itemCount;
  }

  get shareUrl(): string {
    return `${window.location.origin}/archive/${this.collectionId}`;
  }

  loadCollection(): void {
    if (!this.collectionId) return;

    this.isLoading = true;
    this.notFound = false;
    this.archiveService.collection(this.collectionId).subscribe({
      next: response => {
        if (!response?.Success || !response.Data) {
          this.isLoading = false;
          this.notFound = true;
          return;
        }
        this.collection = response.Data;
        this.loadItems(0);
      },
      error: () => {
        this.isLoading = false;
        this.notFound = true;
      },
    });
  }

  loadMore(): void {
    if (this.isLoadingMore || !this.hasMore) return;
    this.loadItems(this.pageIndex + 1);
  }

  open(index: number): void {
    this.viewingIndex = index;
  }

  closeViewer(): void {
    this.viewingIndex = null;
  }

  step(delta: number): void {
    if (this.viewingIndex === null) return;
    const next = this.viewingIndex + delta;
    if (next >= 0 && next < this.items.length) {
      this.viewingIndex = next;
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (this.viewingIndex === null) return;
    if (event.key === 'ArrowLeft') this.step(-1);
    if (event.key === 'ArrowRight') this.step(1);
  }

  openAddItem(): void {
    this.editingItem = null;
    this.isItemFormOpen = true;
  }

  openEditItem(item: IArchiveItem): void {
    this.viewingIndex = null;
    this.editingItem = item;
    this.isItemFormOpen = true;
  }

  onItemsSaved(): void {
    this.loadItems(0, true);
    this.changed.emit();
  }

  confirmDeleteItem(item: IArchiveItem): void {
    this.modal.confirm({
      nzTitle: 'Xoá mục này?',
      nzContent:
        item.Kind === 'Link'
          ? 'Chỉ xoá khỏi thư viện, nội dung gốc không bị ảnh hưởng.'
          : 'File ảnh/video sẽ bị xoá vĩnh viễn.',
      nzOkText: 'Xoá',
      nzOkDanger: true,
      nzCancelText: 'Huỷ',
      nzOnOk: () => this.deleteItem(item),
    });
  }

  confirmDeleteCollection(): void {
    this.modal.confirm({
      nzTitle: `Xoá bộ sưu tập "${this.collection?.Name ?? ''}"?`,
      nzContent: `Toàn bộ ${this.itemCount} mục bên trong và các file ảnh/video sẽ bị xoá vĩnh viễn.`,
      nzOkText: 'Xoá',
      nzOkDanger: true,
      nzCancelText: 'Huỷ',
      nzOnOk: () => this.deleteCollection(),
    });
  }

  private deleteItem(item: IArchiveItem): void {
    this.archiveService.deleteItem(item.ItemId).subscribe({
      next: response => {
        if (!response?.Success) {
          this.message.error(response?.ErrorMessage || 'Không xoá được mục');
          return;
        }
        this.message.success('Đã xoá');
        this.viewingIndex = null;
        this.loadItems(0, true);
        this.changed.emit();
      },
      error: () => this.message.error('Không xoá được mục'),
    });
  }

  setAsCover(item: IArchiveItem): void {
    if (!this.collection || !item.ThumbnailUrl) return;
    const collection = this.collection;
    this.archiveService
      .updateCollection({
        CollectionId: collection.CollectionId,
        Name: collection.Name,
        Description: collection.Description,
        CoverUrl: item.ThumbnailUrl,
        Visibility: collection.Visibility,
      })
      .subscribe({
        next: response => {
          if (!response?.Success) {
            this.message.error(response?.ErrorMessage || 'Không đặt được ảnh bìa');
            return;
          }
          this.collection = response.Data;
          this.message.success('Đã đặt làm ảnh bìa');
          this.changed.emit();
        },
        error: () => this.message.error('Không đặt được ảnh bìa'),
      });
  }

  onCollectionSaved(collection: IArchiveCollection): void {
    this.collection = collection;
    this.isCollectionFormOpen = false;
    this.changed.emit();
  }

  private deleteCollection(): void {
    this.archiveService.deleteCollection(this.collectionId).subscribe({
      next: response => {
        if (!response?.Success) {
          this.message.error(response?.ErrorMessage || 'Không xoá được bộ sưu tập');
          return;
        }
        this.message.success('Đã xoá bộ sưu tập');
        this.deleted.emit();
      },
      error: () => this.message.error('Không xoá được bộ sưu tập'),
    });
  }

  copyShareLink(): void {
    navigator.clipboard
      .writeText(this.shareUrl)
      .then(() => this.message.success('Đã sao chép link chia sẻ'))
      .catch(() => this.message.info(this.shareUrl));
  }

  formatDuration(seconds: number | null): string {
    if (!seconds) return '';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  /**
   * refresh = true: tải lại trang đầu sau khi thêm/xoá mà không hiện skeleton.
   * Luôn về trang đầu vì phân trang theo offset: giữ trang cũ sau khi thêm/xoá
   * thì lần "Xem thêm" kế tiếp sẽ lặp hoặc sót một mục.
   */
  private loadItems(pageIndex: number, refresh = false): void {
    if (pageIndex === 0 && !refresh) this.isLoading = true;
    if (pageIndex > 0) this.isLoadingMore = true;

    this.archiveService.items(this.collectionId, pageIndex, PAGE_SIZE).subscribe({
      next: response => {
        this.isLoading = false;
        this.isLoadingMore = false;
        if (!response?.Success) {
          this.message.error(response?.ErrorMessage || 'Không tải được danh sách');
          return;
        }
        const page = response.objResult;
        const list = page?.DataList ?? [];
        this.items = pageIndex === 0 ? list : [...this.items, ...list];
        this.itemCount = page?.ItemCount ?? this.items.length;
        this.pageIndex = pageIndex;
        if (this.collection) this.collection.ItemCount = this.itemCount;
      },
      error: () => {
        this.isLoading = false;
        this.isLoadingMore = false;
        this.message.error('Không tải được danh sách');
      },
    });
  }
}
