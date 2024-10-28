import { Component, EventEmitter, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { environment } from '../../../environments/environment';
import { ContentChange, QuillModule } from 'ngx-quill';
import { ApiService } from '../../services/api.service';
import { ShowErrorService } from '../../services/show-error.service';

@Component({
  selector: 'text-editor',
  standalone: true,
  imports: [QuillModule],
  templateUrl: './text-editor.component.html',
  styleUrl: './text-editor.component.scss',
})
export class TextEditorComponent {
  editorContent: string = '';
  content: string = '';
  apiService = inject(ApiService);
  showErrorService = inject(ShowErrorService);

  ngOnInit() {
    this.apiService
      .GetNewsByKey('toga')
      .pipe()
      .subscribe({
        next: (res) => {
          this.content = res.Data.ContentBody;
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

  handleContentChanged(ev: ContentChange) {
    localStorage.setItem('content', JSON.stringify(ev.html));
  }
}
