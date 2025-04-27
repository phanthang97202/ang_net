import { AbstractControl, ValidationErrors, Validators } from '@angular/forms';
import { Checker } from '../checker';

export class FormValidatorsCommon extends Validators {
  // Required fields
  static Required(objErrorMsg: Record<string, string>) {
    return (control: AbstractControl): ValidationErrors | null => {
      const objError = { objErrorMsg };

      if (!control.value || control.value.trim() === '') {
        return objError;
      }

      return null;
    };
  }

  // Value of field must convention string code
  static StringCode(objErrorMsg: Record<string, string>) {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (!value) {
        return null;
      }

      const isValid = Checker.isStrCode(value);

      const rsErrMsg = {
        objErrorMsg,
      };

      if (!isValid) {
        return rsErrMsg;
      }

      return null;
    };
  }
}
