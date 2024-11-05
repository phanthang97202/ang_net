import { Component, EventEmitter, inject, OnInit, Output } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { environment } from '../../../environments/environment';
import {
  ContentChange,
  EditorChangeContent,
  EditorChangeSelection,
  QuillModule,
} from 'ngx-quill';
import { ApiService } from '../../services/api.service';
import { ShowErrorService } from '../../services/show-error.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'text-editor',
  standalone: true,
  imports: [QuillModule, CommonModule, FormsModule],
  templateUrl: './text-editor.component.html',
  styleUrl: './text-editor.component.scss',
})
export class TextEditorComponent {
  editorContent: string = '';
  content: string = '';
  apiService = inject(ApiService);
  showErrorService = inject(ShowErrorService);
  @Output('onContentChanged')
  onContentChanged: EventEmitter<{ ev: ContentChange; content: string }> =
    new EventEmitter();
  constructor(private sanitizer: DomSanitizer) {}

  byPassHTML(html: string) {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  handleonEditorChanged(ev: EditorChangeContent | EditorChangeSelection) {
    console.log('=====', ev);
  }

  handleContentChanged(ev: ContentChange) {
    console.log('🚀 ~ TextEditorComponent ~ handleContentChanged ~ ev:', ev);
    this.onContentChanged.emit({ ev, content: this.content });
  }
}
// ngOnInit() {
//   this.apiService
//     .GetNewsByKey('toga')
//     .pipe()
//     .subscribe({
//       next: (res) => {
//         this.content = res.Data.ContentBody;
//       },
//       error: (err) => {
//         this.showErrorService.setShowError({
//           icon: 'warning',
//           message: JSON.stringify(err, null, 2),
//           title: err.message,
//         });
//         throw new Error(err);
//       },
//     });
// }
