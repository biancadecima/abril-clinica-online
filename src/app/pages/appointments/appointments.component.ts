import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { AppointmentService } from '../../services/appointment.service'; 
import Swal from 'sweetalert2'
import { SpinnerService } from '../../services/spinner.service';

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './appointments.component.html',
  styleUrl: './appointments.component.scss'
})
export class AppointmentsComponent {
  specialities: string[] = [];
  specialistsList: any[] = [];
  filteredSpecialists: any[] = [];
  specialitySelected: string[] = [];
  specialistSelected: any[] = [];
  userData: any;
  appointments: any[] = [];
  apptStatus : string = "";

  constructor(private userService: UserService, private apptService: AppointmentService, private spinnerService: SpinnerService){}

  async ngOnInit(): Promise<void> {

    this.spinnerService.show();

    try {
      // Cargar las listas
      await this.loadSpecialities();
      if (this.specialities.length > 0) {
        this.specialitySelected = [this.specialities[0]]; 
        this.filterSpecialistsBySpeciality();
      }
  
      await this.loadSpecialists();
      if (this.filteredSpecialists.length > 0) {
        this.specialistSelected = [this.filteredSpecialists[0]]; 
      }

      await this.loadAppointments();
      console.log("turnos cargados: "+this.appointments);

    } catch (error) {
      console.error('Error durante la inicialización:', error);
    } finally {
      this.spinnerService.hide();
    }
  }

  async onSpecialityChange(speciality: string, event: any): Promise<void> {
    if (event.target.checked) {
      this.specialitySelected.push(speciality); 
    } else {
      this.specialitySelected = this.specialitySelected.filter(e => e !== speciality); 
    }
  
    this.filterSpecialistsBySpeciality();
    await this.loadAppointments();
  }
  
  async onSpecialistChange(specialist: any, event: any): Promise<void> {
    if (event.target.checked) {
      this.specialistSelected.push(specialist); 
    } else {
      this.specialistSelected = this.specialistSelected.filter(e => e !== specialist); 
    }
  
    await this.loadAppointments();
  }

  async loadSpecialists(): Promise<void>{
    try {
      this.specialistsList = await this.userService.getSpecialists();
      if (this.specialitySelected) {
        console.log(this.specialistsList);
        this.filterSpecialistsBySpeciality();
      }
    } catch (error) {
      console.error('Error al cargar los especialistas:', error);
    }
  }

  async loadSpecialities(): Promise<void> {
    try {
      this.specialities = await this.userService.getSpecialities();
      console.log(this.specialities); 
    } catch (error) {
      console.error('Error al cargar las especialidades:', error);
    }
  }

  async loadAppointments(): Promise<void> {
    try {
      // if (this.selectedEspecialista.length === 0 || this.selectedEspecialidad.length === 0) {
      //   this.turnos = []; // No cargar turnos si no hay selección
      //   return;
      // }
  
     
      this.appointments = await this.apptService.getFilteredAppts(
        this.specialistSelected.map(specialist => specialist.email),
        this.specialitySelected 
      );
  
      console.log(this.appointments);
    } catch (error) {
      console.error('Error al cargar los turnos:', error);
    }
  }

  filterSpecialistsBySpeciality(): void {
    if (this.specialitySelected.length > 0) {
     
      this.filteredSpecialists = this.specialistsList.filter(specialist => {
        return Array.isArray(specialist.specialities) &&
          specialist.specialities.some((speciality: string) => this.specialitySelected.includes(speciality));
      });
  
  
      this.filteredSpecialists = this.removeDuplicates(this.filteredSpecialists, 'email');
      console.log('Especialistas filtrados únicos:', this.filteredSpecialists);
    } else {
     
      this.filteredSpecialists = this.removeDuplicates(this.specialistsList, 'email');
    }
  }

  removeDuplicates(array: any[], key: string): any[] {
    const unique = new Map();
    array.forEach(item => {
      unique.set(item[key], item);
    });
    return Array.from(unique.values());
  }

  async updateAppointmentStatus(turno: any, accion: string): Promise<void> {

    this.apptStatus = "Cancelado";

    try {
      const result = await Swal.fire({
        icon: 'question',
        title: `¿Quieres ${accion} el turno?`,
        confirmButtonText: 'Confirmar',
        cancelButtonText: 'Cancelar',
        showCancelButton: true,
        reverseButtons: true,
        allowOutsideClick: false,
      });
    
      if (result.isConfirmed) {

        let comment: string | null = "";

        if (accion === 'cancelar') {
          comment = await this.leaveComment(accion);
          if (comment === null) {
            console.log('El usuario canceló el comentario.');
            return; 
          }
        }

        console.log(turno.id);

        await this.apptService.updateAppointmentStatus(
          turno.id,
          this.apptStatus,
          comment
        );
    
    
        const successResult = await Swal.fire({
          icon: 'success',
          title: `Turno ${this.apptStatus}`,
          confirmButtonText: 'Aceptar',
          reverseButtons: true,
          allowOutsideClick: false,
        });
    
  
        if (successResult.isConfirmed) {
          await this.loadAppointments();
        }
      } else {
        await this.loadAppointments();
      }
    } catch (error) {
      console.error(`Error al ${accion} el turno:`, error);
    }
  }

  async leaveComment(accion: string): Promise<string | null> {
    let comment: string = "";
    let msj: string = "";

    switch(accion)
    {
      case "realizar":
        msj = "Deje un comentario de la consulta y el diagnostico realizado";
        break;
      case "rechazar":
        msj = "¿Por qué rechaza el turno?";
        break;
      case "cancelar":
        msj = "¿Por qué cancela el turno?";
        break;
    }
  
    while (!comment) {
      const { value: inputComentario, isDismissed } = await Swal.fire({
        title: msj,
        input: 'textarea',
        inputLabel: 'Comentario',
        inputPlaceholder: 'Escribe tu comentario aquí...',
        inputAttributes: {
          'aria-label': 'Escribe tu comentario aquí',
        },
        showCancelButton: true,
        confirmButtonText: 'Guardar',
        cancelButtonText: 'Cancelar',
        reverseButtons: true,
        allowOutsideClick: false,
      });
  
     
      if (isDismissed) {
        return null;
      }
  

      if (inputComentario && inputComentario.trim().length > 0) {
        comment = inputComentario;
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Comentario requerido',
          text: 'Por favor, escribe un comentario para continuar.',
          confirmButtonText: 'Aceptar',
          allowOutsideClick: false,
        });
      }
    }
  
    return comment;
  }

}
