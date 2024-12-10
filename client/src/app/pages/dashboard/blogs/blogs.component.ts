import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TextEditorComponent } from '../../../components/text-editor/text-editor.component';
import { NzFormModule } from 'ng-zorro-antd/form';
import {
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { ContentChange } from 'ngx-quill';
import { ApiService } from '../../../services/api.service';
import { ShowErrorService } from '../../../services/show-error.service';
import { NzUploadFile, NzUploadModule } from 'ng-zorro-antd/upload';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { CommonModule } from '@angular/common';
import { CloudinaryService } from '../../../services/cloudinary.service';
import { ChatBoxComponent } from '../../../components/chat-box/chat-box.component';
import { NzMentionModule } from 'ng-zorro-antd/mention';
import { NzCascaderModule, NzCascaderOption } from 'ng-zorro-antd/cascader';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { LoadingService } from '../../../services/loading-service.service';
import { delay } from 'rxjs';
import { NzMessageService } from 'ng-zorro-antd/message';
const options = [
  {
    value: 'zhejiang',
    label: 'Zhejiang',
    children: [
      {
        value: 'hangzhou',
        label: 'Hangzhou',
        children: [
          {
            value: 'xihu',
            label: 'West Lake',
            isLeaf: true,
          },
        ],
      },
      {
        value: 'ningbo',
        label: 'Ningbo',
        isLeaf: true,
      },
    ],
  },
  {
    value: 'jiangsu',
    label: 'Jiangsu',
    children: [
      {
        value: 'nanjing',
        label: 'Nanjing',
        children: [
          {
            value: 'zhonghuamen',
            label: 'Zhong Hua Men',
            isLeaf: true,
          },
        ],
      },
    ],
  },
];
@Component({
  selector: 'app-blogs',
  standalone: true,
  imports: [
    RouterOutlet,
    TextEditorComponent,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzUploadModule,
    NzIconModule,
    NzModalModule,
    CommonModule,
    ReactiveFormsModule,
    ChatBoxComponent,
    NzInputModule,
    NzMentionModule,
    NzCascaderModule,
    NzSelectModule,
    NzTreeSelectModule,
  ],
  templateUrl: './blogs.component.html',
  styleUrl: './blogs.component.scss',
})
export class BlogsComponent implements OnInit {
  apiService = inject(ApiService);
  showErrorService = inject(ShowErrorService);
  cloudinary = inject(CloudinaryService);
  loadingService = inject(LoadingService);
  private message = inject(NzMessageService);

  suggestions = [
    'afc163',
    'benjycui',
    'yiminghe',
    'RaoHai',
    '中文',
    'にほんご',
  ];

  nodes: any = [];

  nzOptions: NzCascaderOption[] = options;

  thumnail: any;
  lstRefFileNews: any;
  contentBody: string = '';

  previewVisible: boolean = false;
  previewImage: string | undefined = '';

  validateForm!: FormGroup<{
    Thumbnail: FormControl<string>;
    ContentBody: FormControl<string>;
    ShortTitle: FormControl<string>;
    ShortDescription: FormControl<string>;
    LstHashTagNews: FormControl<any>;
    LstRefFileNews: FormControl<any>;
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
      LstRefFileNews: [''],
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
        next: (data) => {
          this.nodes = data.DataList.reduce((prev: any[], cur: any) => {
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
              const addNodeToParent = (nodes: any[]): boolean => {
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
          }, []);
          this.loadingService.setLoading(false);
        },
        error: (err) => {
          this.loadingService.setLoading(false);
          this.showErrorService.setShowError({
            icon: 'warning',
            message: JSON.stringify(err, null, 2),
            title: err.message,
          });
        },
        complete() {},
      });
  }

  onChanges(values: string[] | null): void {
    console.log(values);
  }

  onSelectedCategoryNews(event: string): void {
    this.validateForm.patchValue({
      CategoryNewsId: event,
    });
  }

  handlePreview = async (file: NzUploadFile | any): Promise<void> => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj!);
    }
    this.previewImage = file.url || file.preview;
    this.previewVisible = true;
  };

  submitForm() {
    if (this.validateForm.valid) {
      console.log('submit', this.thumnail, this.validateForm.value);
      // return;
      this.apiService
        .CreateNews({
          Thumbnail: this.validateForm.value.Thumbnail ?? '',
          CategoryNewsId: this.validateForm.value.CategoryNewsId ?? '',
          ShortTitle: this.validateForm.value.ShortTitle ?? '',
          ShortDescription: this.validateForm.value.ShortDescription ?? '',
          ContentBody: this.validateForm.value.ContentBody ?? '',
          FlagActive: true,
          LstHashTagNews: this.validateForm.value.LstHashTagNews.split(' ').map(
            (item: string) => {
              return {
                HashTagNewsName: item,
              };
            }
          ),
          LstRefFileNews: [
            // {
            //   FileUrl:
            //     'https://pbs.twimg.com/profile_images/1800983169547808768/mV1Emqsi_400x400.jpg',
            // },
          ],
        })
        .subscribe({
          next: (res) => {
            if (res.Success) {
              this.message.create('success', 'Create successfully');
            }
          },
          error: (err) => {
            this.showErrorService.setShowError({
              icon: 'warning',
              message: JSON.stringify(err, null, 2),
              title: err.message,
            });
            throw new Error(err);
          },
        });
    } else {
      Object.values(this.validateForm.controls).forEach((control) => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }

  handleUploadFile = (file: any) => {
    this.cloudinary.uploadImage(file).subscribe({
      next: (res: any) => {
        this.validateForm.patchValue({
          Thumbnail: res.url,
        });
      },
      error: (err) => {},
    });
    return true; // Prevent default behavior
  };

  handleContentChangedEditor({ ev, content }: { ev: any; content: string }) {
    // console.log('Event:', ev);
    // console.log('Content:', content);
    // this.contentBody = content;
    this.validateForm.patchValue({
      ContentBody: content,
    });
  }

  handleResetForm() {
    this.validateForm.reset();
    this.validateForm.value.ContentBody = '';
    this.validateForm.value.Thumbnail = '';
  }
}

const getBase64 = (file: File): Promise<string | ArrayBuffer | null> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
