import { Component, Input } from '@angular/core';

/** Resource-free placeholders: never request a default image while config loads. */
@Component({
  selector: 'app-config-skeleton',
  standalone: true,
  template: `
    <div
      class="placeholder"
      [class]="'placeholder placeholder--' + variant"
      aria-hidden="true">
      @switch (variant) {
        @case ('hero') {
          <span class="bar title"></span><span class="bar title short"></span>
          <span class="bar description"></span
          ><span class="bar description medium"></span>
          <span class="bar button"></span>
        }
        @case ('intro') {
          <div class="row">
            <span class="bar avatar"></span>
            <div class="identity">
              <span class="bar medium"></span><span class="bar short"></span>
            </div>
          </div>
          <span class="bar"></span><span class="bar"></span
          ><span class="bar medium"></span>
        }
        @case ('music') {
          <div class="row">
            <span class="bar art"></span>
            <div class="identity">
              <span class="bar"></span><span class="bar medium"></span>
            </div>
          </div>
          <span class="bar progress"></span>
          <div class="row controls">
            <span class="bar circle"></span><span class="bar circle"></span
            ><span class="bar circle"></span>
          </div>
        }
        @case ('socials') {
          <div class="row">
            <span class="bar circle"></span><span class="bar circle"></span
            ><span class="bar circle"></span><span class="bar circle"></span>
          </div>
        }
        @case ('footer') {
          <span class="bar brand"></span><span class="bar"></span
          ><span class="bar medium"></span>
        }
        @case ('text') {
          <span class="bar medium"></span>
        }
        @default {
          <span class="bar image"></span>
        }
      }
    </div>
  `,
  styleUrl: './config-skeleton.component.scss',
})
export class ConfigSkeletonComponent {
  @Input() variant:
    | 'hero'
    | 'intro'
    | 'music'
    | 'socials'
    | 'footer'
    | 'text'
    | 'image' = 'text';
}
