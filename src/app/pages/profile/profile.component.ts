import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user.service';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2'
import { MedicalRecordService } from '../../services/medical-record.service';
import { Router } from '@angular/router';
import { jsPDF } from 'jspdf';

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
  specialities: string[] = [];
  selectedSpeciality: string = '';

  constructor(private authService: AuthService, private userService: UserService, private medicalRecordService: MedicalRecordService, private router: Router){}

  async ngOnInit() {
    this.userData = this.authService.getUserData();
    this.loadSpecialities();
    console.log(this.userData.specialities);
 
    if(this.userData.role == "Especialista")
    {
      const scheduleLoaded = await this.userService.loadSchedules(this.userData.email, this.userData.specialities);
    
      const today = new Date();
      for (let i = 0; i < 15; i++) {
        const dateToday = new Date(today);
        dateToday.setDate(today.getDate() + i);
    
        const dayWeek = dateToday.toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase();
        const dayFormat = dayWeek.charAt(0).toUpperCase() + dayWeek.slice(1);
        const dayMonth = dateToday.getDate().toString().padStart(2, '0');
        const month = (dateToday.getMonth() + 1).toString().padStart(2, '0');
        const year = dateToday.getFullYear();
        const completeDate = `${dayMonth}/${month}`;
    
        // Inicializar si no existe en horariosCargados
        scheduleLoaded[completeDate] = scheduleLoaded[completeDate] || { //TODO dia fecha horarios
          dia: dayFormat,
          fecha: completeDate,
          horarios: {},
        };
    
        // Inicializar horarios para cada especialidad
        this.userData.specialities.forEach((speciality: string) => {
          if (!scheduleLoaded[completeDate].horarios[speciality]) {
            scheduleLoaded[completeDate].horarios[speciality] = { inicio: '', fin: '', intervalo: 0 };//TODO inicio fin intervalo
          }
        });
      }
    
      this.schedule = scheduleLoaded;
    }

    this.selectedDay = this.weekDays[0];
    this.selectedDate = this.getDateOfDay(this.selectedDay);
  }

  loadSpecialities(){
     this.userService.getSpecialities().then(data => {
      this.specialities = data;
    });
  }

  /*onSpecialityChange(speciality: string) {
    this.selectedSpeciality = speciality;
  }*/

  

  selectDay(date: string) {
    this.selectedDate = date;
    const completeDate = date.length === 5 ? `${date}/2025` : date;
    const dayIndex = new Date(completeDate.split('/').reverse().join('-')).getDay();
    this.selectedDay = this.weekDays[dayIndex - 1];
    console.log(`Fecha seleccionada: ${this.selectedDate}`);
  }

  getDateOfDay(day: string): string {
    const weekDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
    const indexDay = weekDays.indexOf(day);
  
    const today = new Date();
    const dayToday = today.getDay();
  
    const daysUntilMonday = (8 - dayToday) % 7 || 7;
    const dateMonday = new Date(today);
    dateMonday.setDate(today.getDate() + daysUntilMonday);
  
    dateMonday.setDate(dateMonday.getDate() + this.weekOffset * 7);
  
    const selectedDate = new Date(dateMonday);
    selectedDate.setDate(dateMonday.getDate() + indexDay);
  
    const dayMonth = selectedDate.getDate().toString().padStart(2, '0');
    const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
    const year = selectedDate.getFullYear();
  
   
    return `${dayMonth}/${month}`;
  }

  changeWeek(direction: 'anterior' | 'siguiente') {
    if (direction === 'anterior' && this.weekOffset <= 0) {
      return;
    }

    if (direction === 'anterior') {
      this.weekOffset -= 1;
    } else if (direction === 'siguiente') {
      this.weekOffset += 1;
    }
  }

  onScheduleChange(event: Event, campo: 'inicio' | 'fin', speciality: string) {
    const inputElement = event.target as HTMLInputElement;
    const value = inputElement.value;
    const date = this.selectedDate;
  
    if (date) {
      if (!this.schedule[date]) {
        this.schedule[date] = { dia: '', horarios: {} };
      }
  
      
      if (!this.schedule[date].horarios[speciality]) {
        this.schedule[date].horarios[speciality] = { inicio: '', fin: '', intervalo: 0 }; //TODO inicio fin intervalo
      }
  
     
      this.schedule[date].horarios[speciality][campo] = value;
    }
  }

  async saveSchedule() {
    try {
      // Verificar todos los horarios antes de guardar
      if (!this.verificarTodosLosHorarios()) {
        this.msjError = this.msjErrorAux;
        return;
      }
  
      const schedulesToSave: any = {};
      const today = new Date();
    
      for (let i = 0; i < 15; i++) {
        const dateToday = new Date(today);
        dateToday.setDate(today.getDate() + i);
  
        const weekDay = dateToday.toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase();
        const dayFormat = weekDay.charAt(0).toUpperCase() + weekDay.slice(1);
        const dayMonth = dateToday.getDate().toString().padStart(2, '0');
        const month = (dateToday.getMonth() + 1).toString().padStart(2, '0');
        const year = dateToday.getFullYear();
        const completeDate = `${dayMonth}/${month}`;
    
        if (this.weekDays.includes(dayFormat)) { //TODO dia fecha horarios
         
          schedulesToSave[completeDate] = {
            dia: dayFormat,
            fecha: completeDate,
            horarios: {},
          };
  
          this.userData.specialities.forEach((speciality: string) => {
            const actualSchedule = this.schedule[completeDate]?.horarios[speciality];
      
            if (actualSchedule && actualSchedule.inicio && actualSchedule.fin && actualSchedule.intervalo) {
              const availableSchedules = this.generateAvailableSchedules(
                actualSchedule.inicio,
                actualSchedule.fin,
                actualSchedule.intervalo
              );
  
              schedulesToSave[completeDate].horarios[speciality] = { //TODO inicio fin intervalo horariosdisponibles
                inicio: actualSchedule.inicio,
                fin: actualSchedule.fin,
                intervalo: actualSchedule.intervalo,
                horariosDisponibles: availableSchedules,
              };
            }
          });
        }
      }
  
      await this.userService.saveHorarios(this.userData.email, schedulesToSave); //TODO lo que se guardan son los horarios de las especialidades? no porque se guarda todo scheduleToSave
  
      Swal.fire({
        icon: 'success',
        title: 'Horarios cargados con éxito para los próximos 15 días',
        confirmButtonText: 'Continuar',
        reverseButtons: true,
        allowOutsideClick: false,
      }).then((r) => {
        if (r.isConfirmed) {
          this.reload();
        }
      });
    } catch (error) {
      console.error('Error al guardar horarios:', error);
    }
  }

  generateAvailableSchedules(inicio: string, fin: string, intervalo: number): string[] { //TODO estos si son los horarios de las especialidades
    const schedule: string[] = [];
    let actualHour = this.convertirHoraAMinutos(inicio);
    const endHour = this.convertirHoraAMinutos(fin);

    while (actualHour < endHour) {
      schedule.push(this.convertirMinutosAHora(actualHour));
      actualHour += intervalo;
    }
  
    return schedule;
  }

  convertirHoraAMinutos(hour: string): number {
    const [hours, minutes] = hour.split(':').map(Number);
    return hours * 60 + minutes;
  }

  convertirMinutosAHora(minutos: number): string {
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${horas.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  verificarHorariosPorEspecialidad(horarioActual: any, speciality: string): boolean {
    if (!horarioActual.inicio && !horarioActual.fin) {
      return true;
    }
  
    if (!horarioActual.intervalo || horarioActual.intervalo > 60) {
      this.msjErrorAux = `Error: Debes ingresar un intervalo válido para la especialidad ${speciality}.`;
      return false;
    }
  
    if ((horarioActual.inicio && !horarioActual.fin) || (!horarioActual.inicio && horarioActual.fin)) {
      this.msjErrorAux = `Error: Debes ingresar tanto el horario de inicio como el de fin para la especialidad ${speciality}.`;
      return false;
    }
  
    if (horarioActual.inicio > horarioActual.fin) {
      this.msjErrorAux = `Error: El horario de inicio es posterior al horario de fin en la especialidad ${speciality}.`;
      return false;
    }
  
    if (horarioActual.inicio < '08:00' || horarioActual.fin > '18:00') {
      this.msjErrorAux = `Error: Los horarios de ${speciality} están fuera del rango permitido (08:00 - 18:00).`;
      return false;
    }
  
    return true;
  }

  verificarConflictosEntreEspecialidades(schedulesDay: any): boolean {
    for (const speciality in schedulesDay) {
      const actualSchedule = schedulesDay[speciality];
  
      for (const otherSpeciality in schedulesDay) {
        if (speciality !== otherSpeciality) {
          const otherSchedule = schedulesDay[otherSpeciality];
  
          if (!actualSchedule.inicio || !actualSchedule.fin || !otherSchedule.inicio || !otherSchedule.fin) {
            continue;
          }
  
         
          if (
            actualSchedule.inicio === otherSchedule.inicio &&
            actualSchedule.fin === otherSchedule.fin
          ) {
            this.msjErrorAux = `ERROR: Los horarios de ${speciality} y ${otherSpeciality} son idénticos (${actualSchedule.inicio} - ${actualSchedule.fin}). Ajuste los horarios.`;
            return false;
          }
  

          if (
            actualSchedule.inicio < otherSchedule.fin &&
            actualSchedule.fin > otherSchedule.inicio
          ) {
            this.msjErrorAux = `ERROR: Los horarios de ${speciality} (${actualSchedule.inicio} - ${actualSchedule.fin}) se pisan con ${otherSpeciality} (${otherSchedule.inicio} - ${otherSchedule.fin}). Ajuste los horarios.`;
            return false;
          }
        }
      }
    }
  
    return true;
  }

  verificarTodosLosHorarios(): boolean {
    const today = new Date();
  

    for (let i = 0; i < 15; i++) {
      const actualDate = new Date(today);
      actualDate.setDate(today.getDate() + i);
      const weekDay = actualDate.toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase();
      const dayFormat = weekDay.charAt(0).toUpperCase() + weekDay.slice(1);
      const dayMonth = actualDate.getDate().toString().padStart(2, '0');
      const month = (actualDate.getMonth() + 1).toString().padStart(2, '0');
      const year = actualDate.getFullYear();
      const completeDate = `${dayMonth}/${month}`;
      const schedulesDay = this.schedule[completeDate]?.horarios || {}; //los horarios de una especialidad en un dia
   
      for (const speciality in schedulesDay) {
        const horarioActual = schedulesDay[speciality];
        if (!this.verificarHorariosPorEspecialidad(horarioActual, speciality)) {
          return false;
        }
      }
    
      if (!this.verificarConflictosEntreEspecialidades(schedulesDay)) {
        return false;
      }
    }
  
    return true;
  }

  onIntervaloChange(event: any, speciality: string) {
    const intervalo = parseInt(event.target.value, 10);
    const date = this.selectedDate;
    
    if (isNaN(intervalo) || intervalo <= 0) {
      this.msjErrorAux = `Error: Debes ingresar un intervalo válido para la especialidad ${speciality}.`;
      return;
    }
  
    if (date) {
      if (!this.schedule[date]) {
        this.schedule[date] = { dia: '', horarios: {} };
      }
  
      if (!this.schedule[date].horarios[speciality]) {
        this.schedule[date].horarios[speciality] = { inicio: '', fin: '', intervalo: 0 };
      }
  
      this.schedule[date].horarios[speciality].intervalo = intervalo;
    }
  }

  showMedicalRecord(){
    this.medicalRecordService.emailPatient = this.userData.email;
    this.router.navigateByUrl('/mostrar-historial');
  }

  async downloadPDF(speciality: string) {
    try {
      this.medicalRecordService.emailPatient = this.userData.email;
      const historias: Array<{ [key: string]: any }> = await this.medicalRecordService.getMedicalRecordBySpeciality(speciality);
      
  
      const historiasProcesadas = historias.map(historia => {
        const clavesFijas = [
          'altura',
          'peso',
          'temperatura',
          'presion',
          'patient',
          'emailPatient',
          'emailSpecialist',
          'specialist',
          'idAppointment',
          'speciality',
          'apptDate',
          'apptHour',
          'id', //no sé si tiene id
          'fechaEmision'
        ];
  
        const datosFijos = Object.keys(historia)
          .filter(key => clavesFijas.includes(key))
          .reduce((obj, key) => {
            obj[key] = historia[key];
            return obj;
          }, {} as Record<string, any>); 
  
        const dinamicos = Object.keys(historia)
          .filter(key => !clavesFijas.includes(key))
          .reduce((obj, key) => {
            obj[key] = historia[key];
            return obj;
          }, {} as Record<string, any>);
  
        return {
          ...datosFijos,
          dinamicos,
        };
      });
  
      this.generatePDF(historiasProcesadas);
    } catch (error) {
      console.error("Error al descargar el PDF:", error);
    }
  }

  generatePDF(historias: any[]) {
    const doc = new jsPDF();
  
    const logoUrl = 'assets/logo.png'; 
    const title = 'Informe de Historia Clínica';
  
    historias.forEach((historia, index) => {
      
      if (index > 0) {
        doc.addPage();
      }
  
     
      doc.addImage(logoUrl, 'PNG', 10, 10, 40, 30);
  
     
      doc.setFontSize(22);
      doc.text(title, 70, 20);
  
      let y = 50;
   
      doc.setFontSize(14);
      y += 10;
  
      // Datos fijos
      const datosFijos = [
        `Turno de ${historia.speciality}`,
        `Paciente: ${historia.patient}`,
        `Especialista: ${historia.specialist}`,
        `Fecha del turno: ${historia.apptDate}`,
        `Hora del turno: ${historia.apptHour}`,
        `Altura: ${historia.altura}`,
        `Peso: ${historia.peso}`,
        `Presión: ${historia.presion}`,
        `Temperatura: ${historia.temperatura}`,
        `Fecha de emisión: ${historia.fechaEmision}`
      ];
  
      datosFijos.forEach(text => {
        doc.text(text, 10, y);
        y += 10;
      });
  
      // Datos dinámicos
      if (historia.dinamicos && Object.keys(historia.dinamicos).length > 0) {
        doc.text("Datos Adicionales:", 10, y);
        y += 10;
  
        Object.keys(historia.dinamicos).forEach(key => {
          const value = historia.dinamicos[key];
          if (value !== undefined && value !== null) {
            doc.text(`${key}: ${value}`, 10, y);
            y += 10;
          }
        });
      } else {
        console.log(`No se encontraron datos dinámicos para la historia ${index + 1}.`);
      }
    });
  
    // Descargar el PDF
    doc.save('informe-historias-clinicas.pdf');
  }

  reload(){
    window.location.reload();
  }
}
