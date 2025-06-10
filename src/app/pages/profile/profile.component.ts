import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user.service';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2'
import { MedicalRecordService } from '../../services/medical-record.service';
import { Router } from '@angular/router';
/*import { jsPDF } from 'jspdf';*/

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent {
  userData: any = '';
  schedule: { [fecha: string]: { dia: string; horarios: { [especialidad: string]: { inicio: string; fin: string; intervalo: number } } } } = {};
  weekDays: string[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
  selectedDay: string = '';
  selectedDate: string = '';
  minHour: string = '08:00';
  maxHour: string = '18:00';
  msjErrorAux : string = "";
  msjError : string = "";
  apptsAvailable: { [fecha: string]: string[] } = {};
  weekOffset: number = 0;

  constructor(private authService: AuthService, private userService: UserService, private medicalRecordService: MedicalRecordService, private router: Router){}

  async ngOnInit() {
    this.userData = this.authService.getUserData();
    console.log(this.userData.specialities);
 
    /*if(this.userData.role == "Especialista")
    {
      const scheduleLoaded = await this.userService.cargarHorarios(this.userData.email, this.userData.specialities);
    
      const today = new Date();
      for (let i = 0; i < 15; i++) {
        const dateToday = new Date(today);
        dateToday.setDate(today.getDate() + i);
    
        const dayWeek = dateToday.toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase();
        const dayFormat = dayWeek.charAt(0).toUpperCase() + dayWeek.slice(1);
        const dayMonth = dateToday.getDate().toString().padStart(2, '0');
        const month = (dateToday.getMonth() + 1).toString().padStart(2, '0');
        const year = dateToday.getFullYear();
        const completeDate = `${dayMonth}-${month}-${year}`;
    
        // Inicializar si no existe en horariosCargados
        scheduleLoaded[completeDate] = scheduleLoaded[completeDate] || { //TODO dia fecha horarios
          dia: dayFormat,
          fecha: completeDate,
          horarios: {},
        };
    
        // Inicializar horarios para cada especialidad
        this.userData.specialities.forEach((speciality: string) => {
          if (!scheduleLoaded[completeDate].schedule[speciality]) {
            scheduleLoaded[completeDate].schedule[speciality] = { inicio: '', fin: '', intervalo: 0 };
          }
        });
      }
    
      this.schedule = scheduleLoaded;
    }

    this.selectedDay = this.weekDays[0];
    this.selectedDate = this.obtenerFechaDelDia(this.selectedDay);*/
  }

  /*selectDay(date: string) {
    this.selectedDate = date;
    this.selectedDay = this.weekDays[new Date(date.split('/').reverse().join('-')).getDay() - 1];
    console.log(`Fecha seleccionada: ${this.selectedDate}`);
  }

  obtenerFechaDelDia(dia: string): string {
    const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
    const indiceDia = diasSemana.indexOf(dia);
  
    const hoy = new Date();
    const diaHoy = hoy.getDay();
  
   
    const diasHastaLunes = (8 - diaHoy) % 7 || 7;
    const fechaLunes = new Date(hoy);
    fechaLunes.setDate(hoy.getDate() + diasHastaLunes);
  
    
    fechaLunes.setDate(fechaLunes.getDate() + this.semanaOffset * 7);
  
  
    const fechaSeleccionada = new Date(fechaLunes);
    fechaSeleccionada.setDate(fechaLunes.getDate() + indiceDia);
  
    const diaMes = fechaSeleccionada.getDate().toString().padStart(2, '0');
    const mes = (fechaSeleccionada.getMonth() + 1).toString().padStart(2, '0');
    const anio = fechaSeleccionada.getFullYear();
  
   
    return `${diaMes}-${mes}-${anio}`;
  }*/

}
