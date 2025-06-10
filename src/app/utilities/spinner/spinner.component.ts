import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpinnerService } from '../../services/spinner.service';

@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div *ngIf="spinnerService.spinner$ | async" class="loading-overlay">
    <div class="spinner"></div>
  </div>
`,
  styleUrl: './spinner.component.scss'
})
export class SpinnerComponent {
  constructor(public spinnerService: SpinnerService) {}
}
