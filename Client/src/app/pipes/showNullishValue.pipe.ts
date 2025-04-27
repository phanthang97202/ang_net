import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  standalone: true,
  name: 'showNullishValue',
})
export class ShowNullishValue implements PipeTransform {
  transform(value: any, ...args: any[]): string {
    if (value === null || value === undefined) {
      return '---';
    } else {
      return value;
    }
  }
}
