import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TextEditorComponent } from '../../../components/text-editor/text-editor.component';
import { NzFormModule } from 'ng-zorro-antd/form';
import { FormControl, FormGroup, NonNullableFormBuilder } from '@angular/forms';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { ContentChange } from 'ngx-quill';
import { ApiService } from '../../../services/api.service';
import { ShowErrorService } from '../../../services/show-error.service';

@Component({
  selector: 'app-blogs',
  standalone: true,
  imports: [
    RouterOutlet,
    TextEditorComponent,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
  ],
  templateUrl: './blogs.component.html',
  styleUrl: './blogs.component.scss',
})
export class BlogsComponent {
  apiService = inject(ApiService);
  showErrorService = inject(ShowErrorService);

  contentBody: string = '';
  constructor(private fb: NonNullableFormBuilder) {
    // use `MyValidators`
  }

  submitForm() {
    console.log('clik');
    this.apiService
      .CreateNews({
        Thumbnail:
          'https://i.ytimg.com/vi/yIdjPnEM1AQ/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLBYtPkAj_tDH9SvTv--wIS5TT7n5w',
        CategoryNewsId: 'anime',
        ShortTitle: Math.random().toString(),
        ShortDescription: Math.random().toString(),
        ContentBody: this.contentBody,
        FlagActive: true,
        LstHashTagNews: [
          // {
          //   HashTagNewsName: 'Test',
          // },
        ],
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
  }

  handleContentChangedEditor({ ev, content }: { ev: any; content: string }) {
    console.log('Event:', ev);
    console.log('Content:', content);
    this.contentBody = content;
  }
}
