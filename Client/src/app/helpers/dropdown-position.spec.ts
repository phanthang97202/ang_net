import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NZ_ICONS } from 'ng-zorro-antd/icon';
import {
  DownOutline,
  CloseOutline,
  CheckOutline,
} from '@ant-design/icons-angular/icons';

@Component({
  standalone: true,
  imports: [FormsModule, NzSelectModule, NzTreeSelectModule, NzModalModule],
  template: `
    <nz-select class="page-select" nzShowSearch style="width: 240px">
      <nz-option nzValue="day" nzLabel="Day" />
      <nz-option nzValue="night" nzLabel="Night" />
    </nz-select>
    <nz-tree-select
      class="tree-select"
      [nzNodes]="nodes"
      style="width: 240px" />
    <nz-modal [(nzVisible)]="visible" nzTitle="Form" [nzFooter]="null">
      <ng-container *nzModalContent>
        <nz-select class="modal-select" nzShowSearch style="width: 240px">
          <nz-option nzValue="day" nzLabel="Day" />
          <nz-option nzValue="night" nzLabel="Night" />
        </nz-select>
      </ng-container>
    </nz-modal>
  `,
})
class DropdownPositionHost {
  visible = false;
  nodes = [{ title: 'Category', key: 'category', isLeaf: true }];
}

describe('Connected dropdown positioning', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DropdownPositionHost, NoopAnimationsModule],
      providers: [
        {
          provide: NZ_ICONS,
          useValue: [DownOutline, CloseOutline, CheckOutline],
        },
      ],
    });
  });

  for (const selector of ['.page-select', '.tree-select', '.modal-select']) {
    it(`keeps ${selector} inside the anchored pane when its containing height is definite`, async () => {
      const fixture = TestBed.createComponent(DropdownPositionHost);
      if (selector === '.modal-select')
        fixture.componentInstance.visible = true;
      fixture.detectChanges();
      await fixture.whenStable();
      const select =
        document.querySelector(selector) ||
        fixture.nativeElement.querySelector(selector);
      (select.querySelector('.ant-select-selector') as HTMLElement).click();
      fixture.detectChanges();
      await fixture.whenStable();
      const panel = document.querySelector(
        '.cdk-overlay-pane > .ant-select-dropdown'
      ) as HTMLElement;
      expect(panel).not.toBeNull();
      const pane = panel.parentElement!;
      // Safari resolves NG-ZORRO's relative top:100% against this height.
      // A definite height reproduces the unwanted second offset in Chrome too.
      pane.style.height = '180px';
      const gap =
        panel.getBoundingClientRect().top - pane.getBoundingClientRect().top;
      expect(
        Math.abs(gap - parseFloat(getComputedStyle(panel).marginTop))
      ).toBeLessThan(1);
      expect(
        panel.querySelectorAll('.ant-select-item, nz-tree-node').length
      ).toBeGreaterThan(0);
      fixture.destroy();
    });
  }
});
