import { TestBed } from '@angular/core/testing';
import { NewsContentComponent } from './news-content.component';

describe('NewsContentComponent media loading', () => {
  it('defers article media while preserving rich content and clears previous content', () => {
    TestBed.configureTestingModule({ imports: [NewsContentComponent] });
    TestBed.overrideComponent(NewsContentComponent, {
      set: {
        template:
          '<div class="test-content" [innerHTML]="sanitizedContent"></div>',
      },
    });
    const fixture = TestBed.createComponent(NewsContentComponent);
    fixture.componentInstance.content =
      '<figure><img src="photo.jpg" width="800" height="600"></figure><iframe src="about:blank"></iframe><table><tr><td>Đọc bài</td></tr></table>';
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('img')?.loading).toBe('lazy');
    expect(root.querySelector('img')?.decoding).toBe('async');
    expect(root.querySelector('img')?.getAttribute('width')).toBe('800');
    expect(root.querySelector('img')?.style.aspectRatio).toBe('800 / 600');
    expect(root.querySelector('iframe')?.loading).toBe('lazy');
    expect(root.querySelector('td')?.textContent).toBe('Đọc bài');
    fixture.componentInstance.content = '';
    fixture.componentInstance.ngOnChanges();
    fixture.detectChanges();
    expect(root.querySelector('.test-content')?.innerHTML).toBe('');
  });

  it('loads unsized images early so they do not move navigation targets later', () => {
    TestBed.configureTestingModule({ imports: [NewsContentComponent] });
    TestBed.overrideComponent(NewsContentComponent, {
      set: { template: '<div [innerHTML]="sanitizedContent"></div>' },
    });
    const fixture = TestBed.createComponent(NewsContentComponent);
    fixture.componentInstance.content = '<img src="photo.jpg">';
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img').loading).toBe('eager');
  });
});
