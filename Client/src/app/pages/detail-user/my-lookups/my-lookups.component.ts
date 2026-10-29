import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { AuthService } from '../../../services';
import {
  LOOKUP_LIST_PERMISSIONS,
  LookupItem,
  LookupItemRequest,
  LookupKind,
  LookupListCode,
  LookupListService,
} from '../../../services/lookup-list.service';

interface LookupListTab {
  code: LookupListCode;
  labelKey: string;
  icon: string;
}

const LISTS: LookupListTab[] = [
  { code: 'CALENDAR_CATEGORY', labelKey: 'T_LOOKUP_LIST_CALENDAR_CATEGORY', icon: 'tags' },
  { code: 'CALENDAR_STATUS', labelKey: 'T_LOOKUP_LIST_CALENDAR_STATUS', icon: 'check-circle' },
  { code: 'EXPENSE_CATEGORY', labelKey: 'T_LOOKUP_LIST_EXPENSE_CATEGORY', icon: 'wallet' },
  { code: 'CHINESE_TOPIC', labelKey: 'T_LOOKUP_LIST_CHINESE_TOPIC', icon: 'read' },
];

const SWATCHES = ['#7661d8', '#4d87c2', '#2f6fd6', '#2f9fb3', '#3b9d86', '#23855c', '#b7791f', '#d0764a', '#d33a42', '#c2417a', '#6b6b7b', '#8a8a99'];

/**
 * Tab "Danh mục" trong hồ sơ: mỗi người tự quản lý các danh sách chọn của mình
 * (Loại hoạt động, Trạng thái của Lịch; Danh mục thu chi). Danh sách đang mở nằm
 * trong ?list= để link "Quản lý" từ Lịch / Thu chi mở đúng chỗ.
 */
@Component({
  selector: 'app-my-lookups',
  standalone: true,
  imports: [FormsModule, NzIconModule, NzModalModule, TranslateModule],
  templateUrl: './my-lookups.component.html',
  styleUrl: './my-lookups.component.scss',
})
export class MyLookupsComponent implements OnInit {
  private readonly api = inject(LookupListService);
  private readonly auth = inject(AuthService);
  private readonly message = inject(NzMessageService);
  private readonly translate = inject(TranslateService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroy = inject(DestroyRef);

  /** Chỉ danh sách thuộc module người này được dùng */
  readonly lists = LISTS.filter(list => this.auth.hasPermission(LOOKUP_LIST_PERMISSIONS[list.code]));
  readonly swatches = SWATCHES;
  readonly kinds: { value: LookupKind; labelKey: string }[] = [
    { value: 'expense', labelKey: 'T_LOOKUP_KIND_EXPENSE' },
    { value: 'income', labelKey: 'T_LOOKUP_KIND_INCOME' },
    { value: 'both', labelKey: 'T_LOOKUP_KIND_BOTH' },
  ];

  activeList: LookupListCode | null = null;
  items: LookupItem[] = [];
  loading = false;
  loadError = '';
  busyId = '';

  formOpen = false;
  editingItem: LookupItem | null = null;
  draft: LookupItemRequest = this.emptyDraft();
  formError = '';
  saving = false;

  pendingDelete: LookupItem | null = null;
  deleting = false;

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroy)).subscribe(params => {
      const requested = params.get('list');
      const list = this.lists.find(item => item.code === requested)?.code ?? this.lists[0]?.code ?? null;
      if (list !== this.activeList) {
        this.activeList = list;
        this.load();
      }
    });
  }

  get isExpenseList(): boolean {
    return this.activeList === 'EXPENSE_CATEGORY';
  }

  selectList(code: LookupListCode): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: { list: code }, queryParamsHandling: 'merge' });
  }

  load(): void {
    if (!this.activeList) return;
    this.loading = true;
    this.loadError = '';
    this.api
      .list(this.activeList, true)
      .pipe(finalize(() => (this.loading = false)), takeUntilDestroyed(this.destroy))
      .subscribe({
        next: items => (this.items = items),
        error: () => {
          this.items = [];
          this.loadError = 'T_LOOKUP_LOAD_ERROR';
        },
      });
  }

  name(item: LookupItem): string {
    return this.api.name(item);
  }

  /** Tên ở thứ tiếng còn lại, chỉ hiện khi khác tên chính. */
  otherName(item: LookupItem): string {
    const other = this.translate.currentLang === 'en' ? item.NameVi : item.NameEn;
    return other && other !== this.name(item) ? other : '';
  }

  kindLabel(kind: LookupKind): string {
    return this.kinds.find(item => item.value === kind)?.labelKey ?? '';
  }

  openCreate(): void {
    this.editingItem = null;
    this.draft = this.emptyDraft();
    this.formError = '';
    this.formOpen = true;
  }

  openEdit(item: LookupItem): void {
    this.editingItem = item;
    this.draft = { NameVi: item.NameVi, NameEn: item.NameEn, Color: item.Color || SWATCHES[0], Kind: item.Kind || 'both', FlagActive: item.FlagActive };
    this.formError = '';
    this.formOpen = true;
  }

  closeForm(): void {
    if (!this.saving) this.formOpen = false;
  }

  save(): void {
    if (this.saving || !this.activeList) return;
    const nameVi = this.draft.NameVi.trim();
    const nameEn = this.draft.NameEn.trim();
    if ((!nameVi && !nameEn) || nameVi.length > 80 || nameEn.length > 80) {
      this.formError = 'T_LOOKUP_NAME_REQUIRED';
      return;
    }
    const request: LookupItemRequest = { ...this.draft, NameVi: nameVi, NameEn: nameEn, Kind: this.isExpenseList ? this.draft.Kind : '' };
    this.saving = true;
    this.formError = '';
    const call = this.editingItem ? this.api.update(this.editingItem.Id, request) : this.api.create(this.activeList, request);
    call.pipe(finalize(() => (this.saving = false)), takeUntilDestroyed(this.destroy)).subscribe({
      next: () => {
        this.formOpen = false;
        this.message.success(this.translate.instant('T_LOOKUP_SAVED'));
        this.load();
      },
      error: (error: HttpErrorResponse) => {
        this.formError = error.error?.Code === 'TooManyItems' ? 'T_LOOKUP_TOO_MANY' : 'T_LOOKUP_SAVE_ERROR';
      },
    });
  }

  toggleActive(item: LookupItem): void {
    if (this.busyId) return;
    this.busyId = item.Id;
    const request: LookupItemRequest = { NameVi: item.NameVi, NameEn: item.NameEn, Color: item.Color, Kind: item.Kind, FlagActive: !item.FlagActive };
    this.api
      .update(item.Id, request)
      .pipe(finalize(() => (this.busyId = '')), takeUntilDestroyed(this.destroy))
      .subscribe({
        next: () => (item.FlagActive = !item.FlagActive),
        error: () => this.message.error(this.translate.instant('T_LOOKUP_SAVE_ERROR')),
      });
  }

  move(item: LookupItem, direction: 'up' | 'down'): void {
    if (this.busyId) return;
    this.busyId = item.Id;
    this.api
      .move(item.Id, direction)
      .pipe(finalize(() => (this.busyId = '')), takeUntilDestroyed(this.destroy))
      .subscribe({
        next: () => {
          // Đổi chỗ ngay trên danh sách đang xem, không phải tải lại
          const from = this.items.indexOf(item);
          const to = direction === 'up' ? from - 1 : from + 1;
          if (from < 0 || to < 0 || to >= this.items.length) return;
          const next = [...this.items];
          [next[from], next[to]] = [next[to], next[from]];
          this.items = next;
        },
        error: () => this.message.error(this.translate.instant('T_LOOKUP_SAVE_ERROR')),
      });
  }

  confirmDelete(item: LookupItem): void {
    this.pendingDelete = item;
  }

  cancelDelete(): void {
    if (!this.deleting) this.pendingDelete = null;
  }

  runDelete(): void {
    const item = this.pendingDelete;
    if (!item || this.deleting) return;
    this.deleting = true;
    this.api
      .delete(item.Id)
      .pipe(
        finalize(() => {
          this.deleting = false;
          this.pendingDelete = null;
        }),
        takeUntilDestroyed(this.destroy)
      )
      .subscribe({
        next: result => {
          // Đã có dữ liệu dùng thì server chỉ ẩn để dữ liệu cũ vẫn hiện đúng tên
          this.message.success(this.translate.instant(result.Result === 'hidden' ? 'T_LOOKUP_HIDDEN_DONE' : 'T_LOOKUP_DELETED'));
          this.load();
        },
        error: () => this.message.error(this.translate.instant('T_LOOKUP_SAVE_ERROR')),
      });
  }

  private emptyDraft(): LookupItemRequest {
    return { NameVi: '', NameEn: '', Color: SWATCHES[0], Kind: 'expense', FlagActive: true };
  }
}
