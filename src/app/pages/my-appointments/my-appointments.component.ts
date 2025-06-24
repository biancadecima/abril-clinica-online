import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Firestore } from '@angular/fire/firestore';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { Storage} from '@angular/fire/storage';
import { Observable } from 'rxjs';
import { User } from '../../interfaces/user';
import { AppointmentService } from'../../services/appointment.service';
import Swal from 'sweetalert2'
import { SpinnerService } from '../../services/spinner.service';
import { Router } from '@angular/router';
import { MedicalRecordService } from '../../services/medical-record.service';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-my-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './my-appointments.component.html',
  styleUrl: './my-appointments.component.scss'
})
export class MyAppointmentsComponent {
  specialities: string[] = [];
  specialistsList: any[] = [];
  patientsList: any[] = [];
  filteredSpecialists: any[] = [];
  filteredPatients: any[] = [];
  specialitySelected: string | null = null;
  specialistSelected: any | null = null;
  patientSelected: any | null = null;
  userData: any;
  appointments: any[] = [];
  apptStatus : string = "";
  hasComment : boolean = false;
  filteredAppt: any[] = [];
  stringSearch: string = '';

  constructor(private firestore: Firestore, private authService: AuthService, private userService: UserService, 
    private apptService: AppointmentService, private spinnerService: SpinnerService, private router: Router, private medicalRecordService: MedicalRecordService){}
   
  async ngOnInit(): Promise<void> {
    this.spinnerService.show();

    try {
      this.userData = this.authService.getUserData();
      await this.loadAppointments();

      // Cargar las listas
      await this.loadSpecialities();
      if (this.specialities.length > 0) {
        this.specialitySelected = this.specialities[0];
        this.filterSpecialistsBySpeciality();
      }

      await this.loadSpecialists();
      if (this.filteredSpecialists.length > 0) {
        this.specialistSelected = this.filteredSpecialists[0];
      }

      await this.loadPatients();
      if (this.patientsList.length > 0) {
        this.patientSelected = this.patientsList[0];
      }

    } catch (error) {
      console.error('Error durante la inicialización:', error);
    } finally {
      this.spinnerService.hide();
    }
  }

  onSpecialityChange(speciality: string) {
    this.specialitySelected = speciality;
    this.filterSpecialistsBySpeciality();
    console.log("lista de especialistas filtrados: "+this.filteredSpecialists);
  }

  onSpecialistChange(specialist: any) {
    this.specialistSelected = specialist;
    console.log("especialista seleccionado: "+this.specialistSelected);
  }

  onPatientChange(patient: any) {
    this.patientSelected = patient;
    console.log("paciente seleccionado: "+this.patientSelected);
  }

  async loadSpecialists(): Promise<void>{
    try {
      this.specialistsList = await this.userService.getSpecialists();
      if (this.specialitySelected) {
        console.log(this.specialistsList);
        this.filterSpecialistsBySpeciality();
      }
    } catch (error) {
      console.error('Error al cargar los especialistas en loadSpecialists: ', error);
    }
  }

  async loadPatients(): Promise<void>{
    try {
      this.patientsList = await this.userService.getPatients();
      if (this.patientSelected) {
        this.filterSpecialistsBySpeciality();
      }
    } catch (error) {
      console.error('Error al cargar los pacientes:', error);
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

  filterSpecialistsBySpeciality(): void {
    if (this.specialitySelected) {
      this.filteredSpecialists = this.specialistsList.filter(specialist => {
        return Array.isArray(specialist.specialities) && specialist.specialities.includes(this.specialitySelected);
      });
      console.log('Especialistas filtrados:', this.filteredSpecialists);
    }
  }

  filterPatientsBySpeciality(): void {
    if (this.patientSelected) {
      this.filteredPatients = this.patientsList.filter(patient => {
        return Array.isArray(patient.specialities) && patient.specialities.includes(this.patientSelected);
      });
      console.log('Pacientes filtrados:', this.filteredPatients);
    }
  }

  async loadAppointments(): Promise<void>{
    try {
      const loadedAppointments = await this.apptService.getUserAppointments(this.userData.email, `${this.userData.name} ${this.userData.surname}`, this.userData.role);

      this.appointments = loadedAppointments.map(appointment => ({
        ...appointment,
        hasComment: !!appointment.comment && appointment.comment.trim().length > 0,
      }));

      this.filteredAppt = this.appointments;
  
    } catch (error) {
      console.error('Error al cargar los turnos:', error);
    }
  }

  async search() {
    this.filteredAppt = [];
    const term = this.stringSearch.toLowerCase();
  
    const apptsWRecords = await Promise.all(
      this.appointments.map(async (appt) => {
        const apptRecord = await this.medicalRecordService.getMedicalRecordByAppt(appt.id);
        return { appt, apptRecord };
      })
    );
  
    this.filteredAppt = apptsWRecords
      .filter(({ appt, apptRecord }) => {
        let isValid = false;
  
        const fixedData = [ ///TODO datos fijos
          'altura',
          'peso',
          'temperatura',
          'presion',
          'emailSpecialist',
          'emailPatient',
          'speciality',
          'apptDate',
          'apptHour',
          'patient',
        ];
  
        if (apptRecord) {
          for (const key of fixedData) {
            if (
              key.toLowerCase().includes(term) ||
              apptRecord[key]?.toString().toLowerCase().includes(term)
            ) {
              isValid = true;
              break;
            }
          }
  
          for (const [key, value] of Object.entries(apptRecord)) {
            if (
              !fixedData.includes(key) &&
              (key.toLowerCase().includes(term) || value?.toString().toLowerCase().includes(term))
            ) {
              isValid = true;
              break;
            }
          }
        }
  
        if (
          appt.speciality?.toLowerCase().includes(term) ||
          appt.emailSp?.toLowerCase().includes(term) ||
          appt.fecha?.toLowerCase().includes(term) ||
          appt.estado?.toLowerCase().includes(term) ||
          appt.horario?.toLowerCase().includes(term) ||
          appt.emailPat?.toLowerCase().includes(term) ||
          appt.nameSp?.toLowerCase().includes(term) ||
          appt.namePat?.toLowerCase().includes(term)
        ) {
          isValid = true;
        }
  
        return isValid;
      })
      .map(({ appt }) => appt);
  }

  async updateAppointmentStatus(appointment: any, action: string): Promise<void> {
    switch(action)
    {
      case "aceptar":
        this.apptStatus = "Aceptado";
        break;
      case "realizar":
        this.apptStatus = "Realizado";
        break;
      case "rechazar":
        this.apptStatus = "Rechazado";
        break;
      case "cancelar":
        this.apptStatus = "Cancelado";
        break;
    }

    try {
      const result = await Swal.fire({
        icon: 'question',
        title: `¿Quieres ${action} el turno?`,
        confirmButtonText: 'Confirmar',
        cancelButtonText: 'Cancelar',
        showCancelButton: true,
        reverseButtons: true,
        allowOutsideClick: false,
      });
    
      if (result.isConfirmed) {

        let comment: string | null = "";

        if (action === 'realizar' || action === 'rechazar' || action === 'cancelar') {
          comment = await this.leaveComment(action);
          if (comment === null) {
            console.log('El usuario canceló el comentario.');
            return; 
          }
        }

        console.log("id del turno: "+appointment.id);
        console.log("horario del turno: "+appointment.horario);

        await this.apptService.updateAppointmentStatus(
          appointment.id,
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

          if (action === 'realizar'){
            this.medicalRecordService.patient = appointment.namePat;
            this.medicalRecordService.emailSpecialist = appointment.emailSp;
            this.medicalRecordService.specialist = appointment.nameSp;
            this.medicalRecordService.emailPatient = appointment.emailPat;
            this.medicalRecordService.idAppointment = appointment.id;
            this.medicalRecordService.speciality = appointment.speciality;
            this.medicalRecordService.apptDate = appointment.fecha;
            this.medicalRecordService.apptHour = appointment.horario;
  
            this.router.navigateByUrl('/historia-clinica'); ///TODO page donde se carga la historia clienica
          }
          else
          {
            await this.loadAppointments();
          }       
        }
      } else {
        await this.loadAppointments();
      }
    } catch (error) {
      console.error(`Error al ${action} el turno:`, error);
    }
  }

  async leaveComment(action: string): Promise<string | null> {
    let comment: string = "";
    let msj: string = "";

    switch(action)
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

  showComment(appointment: any): void {
    Swal.fire({
      title: 'Comentario del Turno',
      text: appointment.comment,
      icon: 'info',
      confirmButtonText: 'Cerrar',
      allowOutsideClick: false,
    });
  }

  async completeSurvey(appointment: any): Promise<void>{
    let survey: string = "";
  
      const { value: inputEncuesta, isDismissed } = await Swal.fire({
        title: "Complete la encuesta",
        input: 'textarea',
        inputLabel: 'Encuesta',
        inputPlaceholder: 'Escribe tu encuesta aquí...',
        inputAttributes: {
          'aria-label': 'Escribe tu encuesta aquí',
        },
        showCancelButton: true,
        confirmButtonText: 'Guardar',
        cancelButtonText: 'Cancelar',
        reverseButtons: true,
        allowOutsideClick: false,
      });
  

      if (inputEncuesta && inputEncuesta.trim().length > 0) {
        survey = inputEncuesta;
        this.apptService.updateSurvey(appointment.id, survey);

        const successResult = await Swal.fire({
          icon: 'success',
          title: `Encuesta completada`,
          confirmButtonText: 'Aceptar',
          reverseButtons: true,
          allowOutsideClick: false,
        });
    
       
        if (successResult.isConfirmed) {
          await this.loadAppointments();
        }

      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Encuesta requerida',
          text: 'No se guardo la encuesta.',
          confirmButtonText: 'Aceptar',
          allowOutsideClick: false,
        });
      }

  }

  async actualizarCalificacionAtencion(appointment: any): Promise<void>{
    let atencion: string = "";
  
      const { value: inputAtencion, isDismissed } = await Swal.fire({
        title: "Califique la atencion",
        input: 'textarea',
        inputLabel: 'Atencion',
        inputPlaceholder: 'Escribe la atencion aquí...',
        inputAttributes: {
          'aria-label': 'Escribe tu atencion aquí',
        },
        showCancelButton: true,
        confirmButtonText: 'Guardar',
        cancelButtonText: 'Cancelar',
        reverseButtons: true,
        allowOutsideClick: false,
      });
  
   
      if (inputAtencion && inputAtencion.trim().length > 0) {
        atencion = inputAtencion;
        this.apptService.actualizarCalificacionAtencion(appointment.id, atencion);

        const successResult = await Swal.fire({
          icon: 'success',
          title: `Calificacion completada`,
          confirmButtonText: 'Aceptar',
          reverseButtons: true,
          allowOutsideClick: false,
        });
    
    
        if (successResult.isConfirmed) {
          await this.loadAppointments();
        }

      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Calificacion requerida',
          text: 'No se guardo la calificacion',
          confirmButtonText: 'Aceptar',
          allowOutsideClick: false,
        });
      }
  }

  reload(){
    window.location.reload();
  }
  
}
