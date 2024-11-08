import { Component, inject } from '@angular/core';
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
import { Subscription } from 'rxjs';
import { NzSelectModule } from 'ng-zorro-antd/select';
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
  ],
  templateUrl: './blogs.component.html',
  styleUrl: './blogs.component.scss',
})
export class BlogsComponent {
  apiService = inject(ApiService);
  showErrorService = inject(ShowErrorService);
  cloudinary = inject(CloudinaryService);

  suggestions = [
    'afc163',
    'benjycui',
    'yiminghe',
    'RaoHai',
    '中文',
    'にほんご',
  ];
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

  onChanges(values: string[] | null): void {
    console.log(values);
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
      this.apiService
        .CreateNews({
          Thumbnail: this.validateForm.value.Thumbnail ?? '',
          CategoryNewsId: 'anime',
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
    console.log('🚀 ~ BlogsComponent ~ onFileChange ~ file:', file);

    this.cloudinary.uploadImage(file).subscribe({
      next: (res: any) => {
        this.validateForm.patchValue({
          Thumbnail: res.url,
        });
        console.log('Uploaded successfully!', res);
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
