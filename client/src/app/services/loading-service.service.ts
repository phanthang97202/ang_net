import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<boolean>(false);

  setLoading(isLoading: boolean) {
    this.loadingSubject.next(isLoading);
    // this.loadingSubject.complete();
  }

  getLoading(): Observable<boolean> {
    // return this.loadingSubject.getValue();
    return this.loadingSubject.asObservable();
  }
}
