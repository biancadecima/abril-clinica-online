import { Component } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2'
import { AppointmentService } from '../../services/appointment.service';
import { SpinnerService } from '../../services/spinner.service';
import { HoverZoomDirective } from '../../directives/hover-zoom.directive';

@Component({
  selector: 'app-request-appointment',
  standalone: true,
  imports: [CommonModule, HoverZoomDirective],
  templateUrl: './request-appointment.component.html',
  styleUrl: './request-appointment.component.scss'
})
export class RequestAppointmentComponent {
  specialities: any[] = [];
  specialistList: any[] = [];
  patientList: any[] = [];
  filteredSpecialities: any[] = [];
  filteredSpecialists: any[] = [];
  selectedSpeciality: string | null = null;
  selectedSpecialist: any | null = null;
  selectedDate: string | null = null;
  selectedSchedule: string | null = null;
  selectedPatient: any | null = null; 
  userData: any;
  showSpecialists: boolean = false; 
  showSpecialities: boolean = true;
  showDate: boolean = false;
  showSchedules: boolean = false;
  showPatients: boolean = false;
  dateWHorarios: { fecha: string; horariosDisponibles: string[] }[] = [];
  horarios: string[] = []; //TODO horarios
  lastSelected: boolean = false;

  constructor(private authService: AuthService, private userService: UserService, private apptService: AppointmentService, private spinnerService: SpinnerService){}

  async ngOnInit(): Promise<void> {
    this.spinnerService.show();

    try {
      this.userData = this.authService.getUserData();
      // Cargar las listas
      await this.loadSpecialities();
      await this.loadSpecialists();

      if(this.userData.role == "Admin")
      {
        await this.loadPatients();
      }

    } catch (error) {
      console.error('Error durante la inicialización:', error);
    } finally{
      this.spinnerService.hide();
    }
  }

  onSpecialistChange(specialist: any) {
    this.selectedSpecialist = specialist;
    this.showSpecialities = false;
  }

  onSpecialityChange(speciality: string) {
    this.selectedSpeciality = speciality;
    console.log(this.selectedSpeciality);
  }

  onDateChange(date: string) {
    this.selectedDate = date;
    this.getSchedules(this.selectedDate);
  }

  onScheduleChange(date: string, schedule: string) {
    this.selectedDate = date;
    this.selectedSchedule = schedule;
  }

  onPatientChange(patient: any){
    this.selectedPatient = patient;
  }

  getSchedules(date: string) { //TODO no sé fijarse si esta bien
    for (let item of this.dateWHorarios) {
      if (item.fecha === date) {
       
        this.horarios = item.horariosDisponibles.map(hora => this.convertHour12Format(hora));
        console.log("this.horarios de getSchedules: "+this.horarios);
        return;
      }
    }
  }

  convertHour12Format(hora24: string): string {
    const [hora, minutos] = hora24.split(':').map(Number);
    const periodo = hora >= 12 ? 'PM' : 'AM';
    const hora12 = hora % 12 || 12; 
    const minutosFormateados = minutos.toString().padStart(2, '0');
  
    return `${hora12.toString().padStart(2, '0')}:${minutosFormateados} ${periodo}`;
  }

  async onNextClick() {
    if(this.showSpecialities && this.selectedSpeciality){
      this.showSpecialities = false;
      this.showSpecialists = true;
      this.selectedSpecialist = null;
      this.filterSpecialistsBySpeciality();
    }else if(this.showSpecialists && this.selectedSpecialist){
      await this.getDatesWHorarios();
      this.showSpecialists = false;
      this.showSchedules = true;
      this.selectedDate = null;
      this.selectedSchedule = null;

      this.selectedPatient = null;
    /*} else if (this.showSchedules && this.selectedDate && this.selectedSchedule){
      //this.showSchedules = false;
      this.selectedPatient = null;*/

      if(this.userData.role != "Admin")
      {
        this.lastSelected = true;
      }

    } else if(this.userData.role == "Admin" && this.showSchedules && this.selectedSchedule){
      this.showSchedules = false;
      this.showPatients = true;
      this.lastSelected = true;
    } else if(this.lastSelected){
      const result = await Swal.fire({
        icon: 'question',
        title: 'Quieres confirmar el turno?',
        confirmButtonText: 'Confirmar',
        cancelButtonText: 'Cancelar',
        showCancelButton: true,
        reverseButtons: true,
        allowOutsideClick: false,
      });

        if (result.isConfirmed) {
          const saved = await this.saveAppointment();

          if (saved){
            await Swal.fire({
              icon: 'success',
              title: 'Turno Confirmado',
              confirmButtonText: 'Aceptar',
              reverseButtons: true,
              allowOutsideClick: false,

            });

            this.reload();
          }else{
            Swal.fire({
              icon: 'error',
              title: 'Error al guardar el turno',
              text: 'Por favor, inténtalo de nuevo.',
              confirmButtonText: 'Aceptar',
            });
          }
          
        }
    }
  }

  onBackClick() {
    if(this.showPatients){
      this.showPatients = false;
      this.showSchedules = true;
      this.selectedPatient = null;
    } else if(this.showSchedules) {
      this.showSchedules = false;
      this.showSpecialists = true;
      this.selectedSchedule = null;
    } else if (this.showSpecialists) {
      // Volver de horarios a especialidades
      this.showSpecialists = false;
      this.showSpecialities = true;
      this.selectedSpecialist = null;
    }
  }

  async loadPatients(): Promise<void>{
    try {
      this.patientList = await this.userService.getPatients();
      console.log("lista de pacientes: "+this.patientList);
    } catch (error) {
      console.error('Error al cargar los pacientes:', error);
    }
  }

  async loadSpecialists(): Promise<void>{
    try {
      this.specialistList = await this.userService.getSpecialists();
      console.log("lista de especialistas: "+this.specialistList);
    } catch (error) {
      console.error('Error al cargar los especialistas:', error);
    }
  }

  async loadSpecialities(): Promise<void> {
    try {
      this.specialities = await this.userService.getSpecialities();
      /*if(this.selectedSpecialist){
        this.filterSpecialitiesBySpecialists();
      }
      console.log("lista de especialidades: "+this.specialities);*/
    } catch (error) {
      console.error('Error al cargar las especialidades:', error);
    }
  }

  filterSpecialistsBySpeciality(): void {
    if (this.selectedSpeciality) {
      this.filteredSpecialists = this.specialistList.filter(specialist => {
        return Array.isArray(specialist.specialities) && specialist.specialities.includes(this.selectedSpeciality);
      });
      console.log('Especialistas filtrados:', this.filteredSpecialists);
    }
  }



  getSpecialityPhoto(speciality: string): string {
    const specialityPhotos: { [key: string]: string } = { 
      kinesiologia: 'assets/kinesiologia.webp',
      pediatría: 'assets/pediatria.jpg',
      traumatologia: 'assets/traumatologia.jpg',
      psicologia: 'assets/psicologia.jpg',
    };
    return specialityPhotos[speciality.toLowerCase()] || 'assets/medicina.jpg';
  }

  async getDatesWHorarios() {
    if (this.selectedSpecialist && this.selectedSpeciality) {
      this.dateWHorarios = await this.userService.getDatesWHorariosDisponibles(
        this.selectedSpecialist.email,
        this.selectedSpeciality
      );
      console.log('Fechas con horarios disponibles:', this.dateWHorarios);
    }
  }

  async saveAppointment() : Promise<boolean> {
    if (!this.selectedSpecialist) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Por favor, seleccioná un especialista antes de confirmar el turno.',
        confirmButtonText: 'Ok',
      });
      return false;
    }
  
    if (!this.selectedSpeciality) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Por favor, seleccioná una especialidad antes de confirmar el turno.',
        confirmButtonText: 'Ok',
      });
      return false;
    }
  
    if (!this.selectedDate) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Por favor, seleccioná una fecha antes de confirmar el turno.',
        confirmButtonText: 'Ok',
      });
      return false;
    }
  
    if (!this.selectedSchedule) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Por favor, seleccioná un horario antes de confirmar el turno.',
        confirmButtonText: 'Ok',
      });
      return false;
    }

    if(this.userData.role == "Admin")
    {
      await this.apptService.saveAppointment(this.selectedSpecialist.email,  `${this.selectedSpecialist.name} ${this.selectedSpecialist.surname}`, 
        this.selectedSpeciality, this.selectedPatient.email,`${this.selectedPatient.name} ${this.selectedPatient.surname}`, this.selectedDate, this.selectedSchedule);
    }
    else{
      await this.apptService.saveAppointment(this.selectedSpecialist.email,  `${this.selectedSpecialist.name} ${this.selectedSpecialist.surname}`, 
        this.selectedSpeciality, this.userData.email,`${this.userData.name} ${this.userData.surname}`, this.selectedDate, this.selectedSchedule);
    }
      await this.userService.updateHorariosDisponibles(
        this.selectedSpecialist.email,
        this.selectedSpeciality,
        this.selectedDate,
        this.selectedSchedule
      );

      return true;
  }

  reload(){
    window.location.reload();
  }

}
