import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dniFormat',
  standalone: true
})
export class DniFormatPipe implements PipeTransform {

  transform(value: number | string): string {
    if (!value){
      return '';
    } 
    const dni = value.toString();
    return dni.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

}
