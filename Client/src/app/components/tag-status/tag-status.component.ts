import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { NzTagModule } from 'ng-zorro-antd/tag';
import {
  AuditTrailLevelType,
  AuditTrailTypeType,
  FlagActiveType,
} from '../../types';

@Component({
  standalone: true,
  selector: 'app-tag-status',
  imports: [CommonModule, NzTagModule],
  templateUrl: './tag-status.component.html',
  styleUrl: './tag-status.component.scss',
})
export class TagStatusComponent implements OnChanges {
  @Input() sttValue:
    | AuditTrailLevelType
    | AuditTrailTypeType
    | FlagActiveType
    | 'NULL' = 'NULL';
  @Input() mode: 'closeable' | 'default' | 'checkable' = 'default';
  @Input() color = '#ffffff';
  @Input() bordered = true;

  @Output() _onClose = new EventEmitter<MouseEvent>();
  @Output() _onCheckedChange = new EventEmitter<boolean>();

  ngOnChanges(changes: SimpleChanges): void {
    this.handleColor();
  }

  handleClose(ev: MouseEvent) {
    this._onClose.emit();
  }

  handleCheckedChange(ev: boolean) {
    this._onCheckedChange.emit(ev);
  }

  handleColor() {
    switch (this.sttValue) {
      // FOR FLAGACTIVE
      case 'ACTIVE':
        this.color = 'green'; //
        break;

      case 'INACTIVE':
        this.color = 'red'; //
        break;

      // FOR AUDIT TRAIL TYPE
      case 'DELETE':
        this.color = '#c0c0c0'; // Xám nhạt
        break;
      case 'GET':
        this.color = '#007bff'; // Xanh dương
        break;
      case 'PATCH':
        this.color = '#17a2b8'; // Xanh cyan
        break;
      case 'POST':
        this.color = '#ffc107'; // Vàng
        break;
      case 'PUT':
        this.color = '#dc3545'; // Đỏ
        break;

      // FOR AUDIT TRAIL LEVEL
      case 'TRACE':
        this.color = '#c0c0c0'; // Xám nhạt
        break;
      case 'DEBUG':
        this.color = '#007bff'; // Xanh dương
        break;
      case 'INFORMATION':
        this.color = '#17a2b8'; // Xanh cyan
        break;
      case 'WARNING':
        this.color = '#ffc107'; // Vàng
        break;
      case 'ERROR':
        this.color = '#dc3545'; // Đỏ
        break;
      case 'CRITICAL':
        this.color = '#ffffff'; // Trắng
        break;

      // NULL
      case 'NULL':
        this.color = '#000000'; // Trắng
        break;
      default:
        this.color = '#000000'; // Mặc định: đen
        break;
    }
  }
}
