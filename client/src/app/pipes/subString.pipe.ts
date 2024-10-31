import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  standalone: true,
  name: 'subString',
})
export class SubString implements PipeTransform {
  transform(value: any, ...args: any[]): string {
    if (value === null || value === undefined) {
      return '';
    } else {
      return value.substring(0, 30);
    }
  }
}
