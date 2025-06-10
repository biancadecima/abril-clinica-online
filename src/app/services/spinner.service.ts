import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SpinnerService {
  private spinnerSubject = new BehaviorSubject<boolean>(false);
  spinner$ = this.spinnerSubject.asObservable();

  show(): void {
    this.spinnerSubject.next(true);
  }

  hide(): void {
    this.spinnerSubject.next(false);
  }
}
