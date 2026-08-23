import { Component, inject, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  Validators,
} from '@angular/forms';
import {
  ApiService,
  ShowErrorService,
  CloudinaryService,
  LoadingService,
} from '../../../../services';
import { NzUploadFile } from 'ng-zorro-antd/upload';
import { NzMessageService } from 'ng-zorro-antd/message';
import { INewsCategory, IRefFileNews } from '../../../../interfaces';
import { NzTreeNode, NzTreeNodeOptions } from 'ng-zorro-antd/tree';
import { Util } from '../../../../helpers';
import { AntdModule, REUSE_COMPONENT_MODULES } from '../../../../modules';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-blogs',
  standalone: true,
  imports: [AntdModule, ...REUSE_COMPONENT_MODULES],
  templateUrl: './blogs.component.html',
  styleUrl: './blogs.component.scss',
})
export class BlogsComponent implements OnInit {
  apiService = inject(ApiService);
  showErrorService = inject(ShowErrorService);
  cloudinary = inject(CloudinaryService);
  loadingService = inject(LoadingService);
  private message = inject(NzMessageService);
  private route = inject(ActivatedRoute);
  private translate = inject(TranslateService);

  mode: 'create' | 'edit' = 'create';
  isDataLoaded = false; // ✅ Thêm flag để track data loading
  newsId: string = ''; // ✅ Store newsId

  nodes: NzTreeNodeOptions[] | NzTreeNode[] = [];

  lstRefFileNews: IRefFileNews[] & NzUploadFile[] = [];
  contentBody = ''; // ✅ Store content để binding vào editor

  hashtagSuggestions: string[] = [];

  previewVisible = false;
  previewImage: ArrayBuffer | string | null = null;

  validateForm!: FormGroup<{
    Thumbnail: FormControl<string>;
    ContentBody: FormControl<string>;
    ShortTitle: FormControl<string>;
    ShortDescription: FormControl<string>;
    LstHashTagNews: FormControl<string[]>;
    LstRefFileNews: FormControl<IRefFileNews[]>;
    CategoryNewsId: FormControl<string>;
    FlagActive: FormControl<boolean>;
  }>;

  listButtonsHeader: {
    text: string;
    iconType: string;
    onClick: () => void;
  }[] = [];

  constructor(private fb: NonNullableFormBuilder) {
    this.validateForm = this.fb.group({
      Thumbnail: ['', [Validators.required]],
      CategoryNewsId: ['', [Validators.required]],
      ContentBody: ['', [Validators.required]],
      ShortTitle: ['', [Validators.required]],
      ShortDescription: ['', [Validators.required]],
      LstHashTagNews: [[] as string[]],
      LstRefFileNews: [[{ FileUrl: '' }]],
      FlagActive: [true],
    });
  }

  ngOnInit() {
    const queryModeParamUrl = this.route.snapshot.data['mode'];
    this.newsId = this.route.snapshot.params['id'];
    this.mode = queryModeParamUrl;

    this.listButtonsHeader = [
      {
        text: this.translate.instant(
          this.mode === 'edit' ? 'T_UPDATE' : 'T_POST'
        ),
        iconType: 'upload',
        onClick: () => this.submitForm(),
      },
    ];

    this.fetchDataInit();
    this.fetchHashtagSuggestions();

    if (queryModeParamUrl === 'edit' && this.newsId) {
      this.handleBindingUpdateData(this.newsId);
    } else {
      this.isDataLoaded = true; // ✅ Cho phép render editor ngay khi create mode
    }
  }

  handleBindingUpdateData(newsId: string) {
    this.loadingService.setLoading(true);
    this.apiService
      .GetNewsByKey(newsId)
      .pipe()
      .subscribe({
        next: data => {
          // ✅ Set contentBody trước khi patch form
          this.contentBody = data.Data.ContentBody || '';

          this.validateForm.patchValue({
            CategoryNewsId: data.Data.CategoryNewsId,
            ContentBody: data.Data.ContentBody,
            ShortTitle: data.Data.ShortTitle,
            ShortDescription: data.Data.ShortDescription,
            Thumbnail: data.Data.Thumbnail,
            LstRefFileNews: data.Data.LstRefFileNews,
            FlagActive: data.Data.FlagActive,
          });

          this.validateForm.patchValue({
            LstHashTagNews: this.normalizeHashtags(
              (data.Data.LstHashTagNews ?? []).map(tag => tag.HashTagNewsName)
            ),
          });

          this.isDataLoaded = true; // ✅ Đánh dấu data đã load xong
          this.loadingService.setLoading(false);
        },
        error: err => {
          this.loadingService.setLoading(false);
          this.isDataLoaded = true; // ✅ Vẫn cho render editor dù có lỗi
          this.showErrorService.setShowError({
            icon: 'warning',
            message: JSON.stringify(err, null, 2),
            title: err.message,
          });
        },
        complete: () => {
          this.loadingService.setLoading(false);
        },
      });
  }

  fetchDataInit() {
    this.loadingService.setLoading(true);
    this.apiService
      .GetAllActiveNewsCategory()
      .pipe()
      .subscribe({
        next: data => {
          this.nodes = this.buildCategoryTree(data.DataList);
          this.loadingService.setLoading(false);
        },
        error: err => {
          this.loadingService.setLoading(false);
          this.showErrorService.setShowError({
            icon: 'warning',
            message: JSON.stringify(err, null, 2),
            title: err.message,
          });
        },
        complete: () => {
          this.loadingService.setLoading(false);
        },
      });
  }

  // API trả danh sách phẳng sắp theo NewsCategoryIndex, thứ tự đó không đảm bảo cha
  // đứng trước con. Bản cũ duyệt một lượt và tìm cha trong cây đang dựng dở, nên danh
  // mục nào tới trước cha của nó là bị rơi mất hẳn khỏi kết quả. Dựng map trọn vẹn
  // trước rồi mới nối để không phụ thuộc thứ tự.
  private buildCategoryTree(list: INewsCategory[]): NzTreeNodeOptions[] {
    const nodeById = new Map<string, NzTreeNodeOptions>();
    list.forEach(category =>
      nodeById.set(category.NewsCategoryId, {
        title: category.NewsCategoryName,
        key: category.NewsCategoryId,
        children: [],
      })
    );

    const roots: NzTreeNodeOptions[] = [];
    list.forEach(category => {
      const node = nodeById.get(category.NewsCategoryId)!;
      const parent = nodeById.get(category.NewsCategoryParentId);
      // Cha không tồn tại (đã tắt FlagActive, hoặc dữ liệu tự trỏ vào chính nó) thì
      // đẩy lên gốc - vẫn chọn được, thay vì biến mất như trước.
      if (parent && parent !== node) {
        parent.children!.push(node);
      } else {
        roots.push(node);
      }
    });

    // nz-tree-select vẫn vẽ mũi tên mở rộng nếu children là mảng rỗng.
    nodeById.forEach(node => (node.isLeaf = node.children!.length === 0));
    return roots;
  }

  private fetchHashtagSuggestions() {
    this.apiService.GetTopHashTag().subscribe({
      next: data => {
        this.hashtagSuggestions = this.normalizeHashtags(
          (data.DataList ?? []).map(tag => tag.HashTagNewsName)
        );
      },
      // Gợi ý không có thì ô nhập vẫn gõ tay được, không cần báo lỗi ra màn hình.
      error: () => (this.hashtagSuggestions = []),
    });
  }

  // Bỏ dấu # người dùng quen gõ, cắt khoảng trắng, loại rỗng và loại trùng không
  // phân biệt hoa thường (giữ lại cách viết của lần xuất hiện đầu tiên).
  private normalizeHashtags(values: string[]): string[] {
    const seen = new Set<string>();
    const result: string[] = [];
    values.forEach(value => {
      const name = (value ?? '').trim().replace(/^#+/, '').trim();
      if (!name) return;
      const dedupeKey = name.toLowerCase();
      if (seen.has(dedupeKey)) return;
      seen.add(dedupeKey);
      result.push(name);
    });
    return result;
  }

  handleUploadFile = (file: any) => {
    this.cloudinary.uploadImage(file).subscribe({
      next: (res: any) => {
        this.validateForm.patchValue({
          Thumbnail: res.secure_url,
        });
      },
      error: err => {},
    });
    return true;
  };

  submitForm() {
    const data = {
      Thumbnail: this.validateForm.value.Thumbnail ?? '',
      CategoryNewsId: this.validateForm.value.CategoryNewsId ?? '',
      ShortTitle: this.validateForm.value.ShortTitle ?? '',
      ShortDescription: this.validateForm.value.ShortDescription ?? '',
      ContentBody: this.validateForm.value.ContentBody ?? '',
      FlagActive: this.validateForm.value.FlagActive ?? true,
      LstHashTagNews: this.normalizeHashtags(
        this.validateForm.value.LstHashTagNews ?? []
      ).map(name => ({ HashTagNewsName: name })),
      LstRefFileNews: [],
    };
    console.log('===update data', this.mode, data);
    if (this.validateForm.valid) {
      this.loadingService.setLoading(true);
      const apiCall =
        this.mode === 'edit'
          ? this.apiService.UpdateNews(this.newsId, {
              Thumbnail: data.Thumbnail ?? '',
              CategoryNewsId: data.CategoryNewsId ?? '',
              ShortTitle: data.ShortTitle ?? '',
              ShortDescription: data.ShortDescription ?? '',
              ContentBody: data.ContentBody ?? '',
              FlagActive: data.FlagActive,
              LstHashTagNews: data.LstHashTagNews ?? '',
              LstRefFileNews: [],
            })
          : this.apiService.CreateNews({
              Thumbnail: data.Thumbnail ?? '',
              CategoryNewsId: data.CategoryNewsId ?? '',
              ShortTitle: data.ShortTitle ?? '',
              ShortDescription: data.ShortDescription ?? '',
              ContentBody: data.ContentBody ?? '',
              FlagActive: data.FlagActive,
              LstHashTagNews: data.LstHashTagNews ?? '',
              LstRefFileNews: [],
            });
      apiCall.subscribe({
        next: res => {
          if (res.Success) {
            this.loadingService.setLoading(false);
            const action = this.mode === 'edit' ? 'Updated' : 'Created';
            this.message.create('success', `${action} successfully`);
          }
        },
        error: err => {
          this.loadingService.setLoading(false);
          this.showErrorService.setShowError({
            icon: 'warning',
            message: JSON.stringify(err, null, 2),
            title: err.message,
          });
        },
        complete: () => {
          this.loadingService.setLoading(false);
        },
      });
    } else {
      Object.values(this.validateForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }

  // ✅ Chỉ update form khi user thực sự type, không trigger ngược lại editor
  handleContentChangedEditor({ content }: { content: string }) {
    // Guard: chỉ patch nếu giá trị thực sự khác
    if (this.validateForm.value.ContentBody !== content) {
      this.validateForm.patchValue({ ContentBody: content });
    }
  }

  handlePreview = async (file: NzUploadFile): Promise<void> => {
    const extendedFile = file as NzUploadFile & {
      url: string;
      preview: ArrayBuffer | string | null;
      originFileObj: string;
      previewImage: ArrayBuffer | string | null;
    };

    if (!extendedFile.url && !extendedFile.preview) {
      extendedFile.preview = await Util.getBase64(extendedFile.originFileObj!);
    }
    this.previewImage = extendedFile.url || extendedFile.preview;
    this.previewVisible = true;
  };

  onSelectedCategoryNews(event: string): void {
    this.validateForm.patchValue({
      CategoryNewsId: event,
    });
  }

  handleResetForm() {
    this.validateForm.reset();
    this.contentBody = ''; // ✅ Reset content body
  }
}
