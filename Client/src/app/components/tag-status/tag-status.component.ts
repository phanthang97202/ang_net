import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NzTagModule } from 'ng-zorro-antd/tag';

@Component({
  standalone: true,
  selector: 'app-tag-status',
  imports: [CommonModule, NzTagModule],
  templateUrl: './tag-status.component.html',
  styleUrl: './tag-status.component.scss',
})
export class TagStatusComponent {
  @Input() boolData = false;
  @Input() mode: 'closeable' | 'default' | 'checkable' = 'default';
  @Input() color = '#ffffff';
  @Input() bordered = true;

  @Output() _onClose = new EventEmitter<MouseEvent>();
  @Output() _onCheckedChange = new EventEmitter<boolean>();

  // ngOnChanges(changes: SimpleChanges): void {}

  handleClose(ev: MouseEvent) {
    this._onClose.emit();
  }

  handleCheckedChange(ev: boolean) {
    this._onCheckedChange.emit(ev);
  }
}
