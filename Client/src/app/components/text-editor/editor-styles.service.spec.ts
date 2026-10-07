import { TestBed } from '@angular/core/testing';
import { EditorStylesService } from './editor-styles.service';

describe('EditorStylesService', () => {
  it('shares a pending stylesheet and waits for it to load before resolving', async () => {
    TestBed.configureTestingModule({});
    const append = spyOn(document.head, 'appendChild').and.callFake(
      node => node
    );
    const service = TestBed.inject(EditorStylesService);
    const first = service.load();
    expect(service.load()).toBe(first);
    expect(append).toHaveBeenCalledTimes(1);
    const link = append.calls.mostRecent().args[0] as HTMLLinkElement;
    expect(link.href).toContain('/assets/styles/ckeditor5-editor.css');
    link.dispatchEvent(new Event('load'));
    await first;
    expect(service.load()).toBe(first);
  });
});
