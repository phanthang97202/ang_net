import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TextEditorComponent } from '../../../components/text-editor/text-editor.component';

@Component({
  selector: 'app-blogs',
  standalone: true,
  imports: [RouterOutlet, TextEditorComponent],
  templateUrl: './blogs.component.html',
  styleUrl: './blogs.component.scss',
})
export class BlogsComponent {}
