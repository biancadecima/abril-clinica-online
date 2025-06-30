import { Directive, ElementRef, Input, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appDisableIfEmpty]',
  standalone: true
})
export class DisableIfEmptyDirective {
  @Input('appDisableIfEmpty') items: any[] = []; // Recibe la lista como entrada

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnChanges(): void {
    if (this.items.length === 0) {
      this.renderer.setProperty(this.el.nativeElement, 'disabled', true);
    } else {
      this.renderer.setProperty(this.el.nativeElement, 'disabled', false);
    }
  }

}
