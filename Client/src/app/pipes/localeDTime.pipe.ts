import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  standalone: true,
  name: 'localeDTime',
})
export class LocalDTime implements PipeTransform {
  transform(value: any, ...args: any[]): string {
    if (value === null || value === undefined) {
      return '';
    } else {
      let date = new Date(value);
      let formattedDate = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      return formattedDate; // Oct 31, 2024
    }
  }
}
