import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  standalone: true,
  name: 'sizeImgCloudinary',
})
export class SizeImgCloudinary implements PipeTransform {
  transform(url: string, height = 400, width = 200): string {
    if (url === null || url === undefined) {
      return '';
    }

    // Kiểm tra URL có phải của Cloudinary không
    if (url.includes('res.cloudinary.com')) {
      return url.replace(
        '/upload/',
        `/upload/w_${width},h_${height},c_fit,q_80/`
      );
    }

    return url;
  }
}
