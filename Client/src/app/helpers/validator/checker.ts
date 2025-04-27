export class Checker {
  // checking value is valid format code ?
  static isStrCode(value: string): boolean {
    const regex = /^[a-zA-Z0-9]+$/;

    const isValid = regex.test(value);

    if (isValid) {
      return true;
    }
    return false;
  }

  static DownloadFile(hexdump: Blob, fileType: string) {
    const blob = new Blob([hexdump], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const _fileType = fileType + '_' + Date.now();
    a.download = _fileType;
    a.click();
    window.URL.revokeObjectURL(url); // Clean up
  }
}
