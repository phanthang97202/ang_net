import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { CONSTANTS_APP } from '../../helpers/constants';

@Component({
  selector: 'pagination',
  standalone: true,
  imports: [NzPaginationModule],
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.scss',
})
export class PaginationComponent {
  @Input() size: 'default' | 'small' = 'small';

  @Input() pageIndex: number = CONSTANTS_APP.PAGE_INDEX;
  @Input() pageSize: number = CONSTANTS_APP.PAGE_SIZE;
  @Input() itemCount: number = 0;

  @Output() onPageIndexChange = new EventEmitter<number>();

  constructor() {}

  ngOnInit() {}

  handlePageIndexChange(event: number) {
    const pageIndex = event;

    this.onPageIndexChange.emit(pageIndex - 1);
  }
}
