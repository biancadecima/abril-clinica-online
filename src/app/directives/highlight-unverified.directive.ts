import { Directive, ElementRef, Input, OnChanges, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appHighlightUnverified]',
  standalone: true
})
export class HighlightUnverifiedDirective implements OnChanges {
  @Input('appHighlightUnverified') isVerifiedEmail!: boolean | null; // Recibe el estado de verificación

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnChanges(): void {
    
    if (this.isVerifiedEmail === false) {
      this.renderer.setStyle(this.el.nativeElement, 'background-color', '#f8d7da');
      this.renderer.setStyle(this.el.nativeElement, 'color', 'black'); 
    } else {
      this.renderer.removeStyle(this.el.nativeElement, 'background-color');
      this.renderer.removeStyle(this.el.nativeElement, 'color');
    }
  }

}
