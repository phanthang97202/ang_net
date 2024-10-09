import { Component } from '@angular/core';
import { ChatBoxComponent } from '../../components/chat-box/chat-box.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [ChatBoxComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {}
