import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dateFormat',
  standalone: true
})
export class DateFormatPipe implements PipeTransform {

  transform(value: string): string {
    // Verifica si tiene formato dd/mm/yyyy
    const parts = value.split('/');
    if (parts.length === 3) {
      const [day, month] = parts;
      return `${day}/${month}`;
    }
    return value; // Si no tiene el formato esperado, devuelve como está
  }

}
