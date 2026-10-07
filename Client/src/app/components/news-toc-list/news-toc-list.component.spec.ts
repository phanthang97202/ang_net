import { TestBed } from '@angular/core/testing';
import { NewsTocListComponent } from './news-toc-list.component';

describe('NewsTocListComponent reading navigation', () => {
  let component: NewsTocListComponent;
  let container: HTMLDivElement;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    container = document.createElement('div');
    container.id = 'audit-content';
    document.body.appendChild(container);
    component = TestBed.runInInjectionContext(() => new NewsTocListComponent());
    component.containerId = container.id;
  });

  afterEach(() => {
    component.ngOnDestroy();
    container.remove();
  });

  it('preserves authored anchors and gives repeated headings unique stable IDs', () => {
    container.innerHTML =
      '<h2 id="intro">Đọc bài</h2><h2>Đọc bài</h2><h2>Đọc bài</h2><h2 id="intro">Khác</h2>';
    component.generateToc();
    const ids = component.tocItems.map(item => item.id);
    expect(ids[0]).toBe('intro');
    expect(new Set(ids).size).toBe(4);
    component.generateToc();
    expect(component.tocItems.map(item => item.id)).toEqual(ids);
    expect(
      component.tocItems.every(
        item => document.getElementById(item.id) === item.element
      )
    ).toBeTrue();
  });

  it('scrolls relative to the document even inside a positioned parent', () => {
    container.style.position = 'relative';
    container.innerHTML = '<h2>Đoạn cần đọc</h2>';
    component.generateToc();
    const heading = component.tocItems[0].element;
    spyOn(heading, 'getBoundingClientRect').and.returnValue({
      top: 640,
    } as DOMRect);
    spyOnProperty(window, 'scrollY', 'get').and.returnValue(120);
    const scroll = spyOn(window, 'scrollTo');
    component.onItemClick(heading.id);
    expect(scroll.calls.mostRecent().args[0]).toEqual(
      jasmine.objectContaining({ top: 680 })
    );
    expect(document.activeElement).toBe(heading);
    expect(component.tocPanel.isOpen$.value).toBeFalse();
  });

  it('clears navigation and removes its scroll handler when the article goes away', () => {
    container.innerHTML = '<h2>Mục lục</h2>';
    component.generateToc();
    component.tocPanel.toggle();
    container.innerHTML = '';
    component.generateToc();
    expect(component.tocPanel.hasItems$.value).toBeFalse();
    expect(component.tocPanel.isOpen$.value).toBeFalse();
    const removeListener = spyOn(
      window,
      'removeEventListener'
    ).and.callThrough();
    component.ngOnDestroy();
    expect(removeListener).toHaveBeenCalledWith(
      'scroll',
      jasmine.any(Function)
    );
  });
});
