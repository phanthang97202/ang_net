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
} from '../../../services';
import { NzUploadFile } from 'ng-zorro-antd/upload';
import { NzMessageService } from 'ng-zorro-antd/message';
import {
  INewsCategory,
  INewsCategoryNode,
  IRefFileNews,
} from '../../../interfaces';
import { NzTreeNode, NzTreeNodeOptions } from 'ng-zorro-antd/tree';
import { Util } from '../../../helpers';
import { AntdModule, REUSE_COMPONENT_MODULES } from '../../../modules';

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

  nodes: NzTreeNodeOptions[] | NzTreeNode[] = [];

  lstRefFileNews: IRefFileNews[] & NzUploadFile[] = [];
  contentBody = '';

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
    this.fetchDataInit();
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
                // Root-level node
                prev.push(newNode);
              } else {
                // Find parent node recursively and add the current node as a child
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

  // onChanges(values: string[] | null): void {}

  handleUploadFile = (file: any) => {
    this.cloudinary.uploadImage(file).subscribe({
      next: (res: any) => {
        this.validateForm.patchValue({
          Thumbnail: res.secure_url,
        });
      },
      error: err => {},
    });
    return true; // Prevent default behavior
  };

  submitForm() {
    if (this.validateForm.valid) {
      this.loadingService.setLoading(true);
      this.apiService
        .CreateNews({
          Thumbnail: this.validateForm.value.Thumbnail ?? '',
          CategoryNewsId: this.validateForm.value.CategoryNewsId ?? '',
          ShortTitle: this.validateForm.value.ShortTitle ?? '',
          ShortDescription: this.validateForm.value.ShortDescription ?? '',
          ContentBody: this.validateForm.value.ContentBody ?? '',
          FlagActive: true,
          LstHashTagNews: (this.validateForm.value.LstHashTagNews ?? '')
            .split(' ')
            .map((item: string) => {
              return {
                HashTagNewsName: item,
              };
            }),
          LstRefFileNews: [
            // {
            //   FileUrl:
            //     'https://pbs.twimg.com/profile_images/1800983169547808768/mV1Emqsi_400x400.jpg',
            // },
          ],
        })
        .subscribe({
          next: res => {
            if (res.Success) {
              this.loadingService.setLoading(false);
              this.message.create('success', 'Create successfully');
            }
          },
          error: err => {
            this.loadingService.setLoading(false);
            this.showErrorService.setShowError({
              icon: 'warning',
              message: JSON.stringify(err, null, 2),
              title: err.message,
            });
            throw new Error(err);
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

  handleContentChangedEditor({ content }: { content: string }) {
    // this.contentBody = content;
    this.validateForm.patchValue({
      ContentBody: content,
    });
  }

  // Preview ảnh
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
    // debugger;
    this.validateForm.patchValue({
      CategoryNewsId: event,
    });
  }

  handleResetForm() {
    this.validateForm.reset();
    this.validateForm.value.ContentBody = '';
    this.validateForm.value.Thumbnail = '';
  }
}
