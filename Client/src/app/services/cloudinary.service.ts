import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class CloudinaryService {
  private cloudName = 'dumdpgmgs';
  private uploadPreset = 'svylrno1';

  constructor(private http: HttpClient) {}

  uploadImage(file: File) {
    // debugger;
    const formData = new FormData();
    formData.append('file', file);
    // formData.append('file', URL.createObjectURL(file));

    // formData.append('cloud_name', this.cloudName);
    formData.append('upload_preset', this.uploadPreset);

    return this.http.post(
      `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`,
      formData
    );
  }
}
