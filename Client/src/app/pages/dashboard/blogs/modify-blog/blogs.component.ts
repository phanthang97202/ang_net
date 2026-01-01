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
import {
  INewsCategory,
  INewsCategoryNode,
  IRefFileNews,
} from '../../../../interfaces';
import { NzTreeNode, NzTreeNodeOptions } from 'ng-zorro-antd/tree';
import { Util } from '../../../../helpers';
import { AntdModule, REUSE_COMPONENT_MODULES } from '../../../../modules';
import { ActivatedRoute } from '@angular/router';

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

  mode: 'create' | 'edit' = 'create';
  isDataLoaded = false; // ✅ Thêm flag để track data loading
  newsId: string = ''; // ✅ Store newsId

  nodes: NzTreeNodeOptions[] | NzTreeNode[] = [];

  lstRefFileNews: IRefFileNews[] & NzUploadFile[] = [];
  contentBody = ''; // ✅ Store content để binding vào editor

  previewVisible = false;
  previewImage: ArrayBuffer | string | null = null;

  validateForm!: FormGroup<{
    Thumbnail: FormControl<string>;
    ContentBody: FormControl<string>;
    ShortTitle: FormControl<string>;
    ShortDescription: FormControl<string>;
    LstHashTagNews: FormControl<string>;
    LstRefFileNews: FormControl<IRefFileNews[]>;
    CategoryNewsId: FormControl<string>;
  }>;

  constructor(private fb: NonNullableFormBuilder) {
    this.validateForm = this.fb.group({
      Thumbnail: ['', [Validators.required]],
      CategoryNewsId: ['', [Validators.required]],
      ContentBody: ['', [Validators.required]],
      ShortTitle: ['', [Validators.required]],
      ShortDescription: ['', [Validators.required]],
      LstHashTagNews: [''],
      LstRefFileNews: [[{ FileUrl: '' }]],
    });
  }

  ngOnInit() {
    const queryModeParamUrl = this.route.snapshot.data['mode'];
    this.newsId = this.route.snapshot.params['id'];
    this.mode = queryModeParamUrl;

    this.fetchDataInit();

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
          });

          // ✅ Format hashtags nếu cần
          if (data.Data.LstHashTagNews && data.Data.LstHashTagNews.length > 0) {
            const hashtagString = data.Data.LstHashTagNews.map(
              (tag: any) => tag.HashTagNewsName
            ).join(' ');
            this.validateForm.patchValue({
              LstHashTagNews: hashtagString,
            });
          }

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
          this.nodes = data.DataList.reduce(
            (prev: Partial<INewsCategoryNode>[], cur: INewsCategory) => {
              const newNode = {
                title: cur.NewsCategoryName,
                NewsCategoryIndex: cur.NewsCategoryIndex,
                key: cur.NewsCategoryId,
                NewsCategoryParentId: cur.NewsCategoryParentId,
                children: [],
              };

              if (!cur.NewsCategoryParentId) {
                prev.push(newNode);
              } else {
                const addNodeToParent = (
                  nodes: Partial<INewsCategoryNode>[]
                ): boolean => {
                  for (const node of nodes) {
                    if (node.key === cur.NewsCategoryParentId) {
                      node.children.push(newNode);
                      return true;
                    }
                    if (addNodeToParent(node.children)) {
                      return true;
                    }
                  }
                  return false;
                };
                addNodeToParent(prev);
              }
              return prev;
            },
            []
          ) as NzTreeNodeOptions[] | NzTreeNode[];
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
      FlagActive: true,
      LstHashTagNews: (this.validateForm.value.LstHashTagNews ?? '')
        .split(' ')
        .filter(item => item.trim())
        .map((item: string) => ({
          HashTagNewsName: item.trim(),
        })),
      LstRefFileNews: [],
    };
    console.log('===update data', data);
    // if (this.validateForm.valid) {
    //   this.loadingService.setLoading(true);
    //   const apiCall =
    //     this.mode === 'edit'
    //       ? this.apiService.UpdateNews(this.newsId, {
    //           Thumbnail: this.validateForm.value.Thumbnail ?? '',
    //           CategoryNewsId: this.validateForm.value.CategoryNewsId ?? '',
    //           ShortTitle: this.validateForm.value.ShortTitle ?? '',
    //           ShortDescription: this.validateForm.value.ShortDescription ?? '',
    //           ContentBody: this.validateForm.value.ContentBody ?? '',
    //           FlagActive: true,
    //           LstHashTagNews: (this.validateForm.value.LstHashTagNews ?? '')
    //             .split(' ')
    //             .filter(item => item.trim())
    //             .map((item: string) => ({
    //               HashTagNewsName: item.trim(),
    //             })),
    //           LstRefFileNews: [],
    //         })
    //       : this.apiService.CreateNews({
    //           Thumbnail: this.validateForm.value.Thumbnail ?? '',
    //           CategoryNewsId: this.validateForm.value.CategoryNewsId ?? '',
    //           ShortTitle: this.validateForm.value.ShortTitle ?? '',
    //           ShortDescription: this.validateForm.value.ShortDescription ?? '',
    //           ContentBody: this.validateForm.value.ContentBody ?? '',
    //           FlagActive: true,
    //           LstHashTagNews: (this.validateForm.value.LstHashTagNews ?? '')
    //             .split(' ')
    //             .filter(item => item.trim())
    //             .map((item: string) => ({
    //               HashTagNewsName: item.trim(),
    //             })),
    //           LstRefFileNews: [],
    //         });
    //   apiCall.subscribe({
    //     next: res => {
    //       if (res.Success) {
    //         this.loadingService.setLoading(false);
    //         const action = this.mode === 'edit' ? 'Updated' : 'Created';
    //         this.message.create('success', `${action} successfully`);
    //       }
    //     },
    //     error: err => {
    //       this.loadingService.setLoading(false);
    //       this.showErrorService.setShowError({
    //         icon: 'warning',
    //         message: JSON.stringify(err, null, 2),
    //         title: err.message,
    //       });
    //     },
    //     complete: () => {
    //       this.loadingService.setLoading(false);
    //     },
    //   });
    // } else {
    //   Object.values(this.validateForm.controls).forEach(control => {
    //     if (control.invalid) {
    //       control.markAsDirty();
    //       control.updateValueAndValidity({ onlySelf: true });
    //     }
    //   });
    // }
  }

  handleContentChangedEditor({ content }: { content: string }) {
    this.validateForm.patchValue({
      ContentBody: content,
    });
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
