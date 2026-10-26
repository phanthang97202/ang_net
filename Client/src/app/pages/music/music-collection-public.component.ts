import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { MusicCollectionPickerComponent } from '../../components/music-library/music-collection-picker.component';
import { MusicSaveToastComponent } from '../../components/music-library/music-save-toast.component';
import { MusicLibraryComponent } from './music-library.component';

/** Trang mở từ link chia sẻ /music/collection/:collectionId. */
@Component({
  selector: 'app-music-collection-public',
  standalone: true,
  imports: [
    MusicLibraryComponent,
    MusicSaveToastComponent,
    MusicCollectionPickerComponent,
  ],
  template: `
    <main class="music-page">
      @if (collectionId(); as id) {
        <app-music-library [sharedCollectionId]="id" />
      }
      <app-music-save-toast />
      <app-music-collection-picker />
    </main>
  `,
  styleUrl: './music.component.scss',
})
export class MusicCollectionPublicComponent {
  private route = inject(ActivatedRoute);

  collectionId = toSignal(
    this.route.paramMap.pipe(map(params => params.get('collectionId') ?? '')),
    { initialValue: '' }
  );
}
