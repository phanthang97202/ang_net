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
}
