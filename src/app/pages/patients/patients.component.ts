import { Component } from '@angular/core';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { AppointmentService } from '../../services/appointment.service';
import { CommonModule } from '@angular/common';
import { SpinnerService } from '../../services/spinner.service';
import { Router } from '@angular/router';
import { MedicalRecordService } from '../../services/medical-record.service';
import { DisableIfEmptyDirective } from '../../directives/disable-if-empty.directive';

@Component({
  selector: 'app-patients',
  standalone: true,
  imports: [CommonModule, DisableIfEmptyDirective],
  templateUrl: './patients.component.html',
  styleUrl: './patients.component.scss'
})
export class PatientsComponent {
  patients: any[] = [];
  userData: any;
  selectedPatient: any | null = null; 
  lastThreeAppointments: any[] = [];
  patientAppointments: { [email: string]: any[] } = {}

  constructor(private userService: UserService, private authService: AuthService, 
    private spinnerService: SpinnerService, private router: Router, private medicalRecordService: MedicalRecordService, private appointmentService: AppointmentService){}

  async ngOnInit(){
    this.spinnerService.show();

    try {
      this.userData = this.authService.getUserData();

      await this.loadPatients();
      await this.getFinishedAppointmentsOfPatient();

      this.selectedPatient = this.patients[0];

    } catch (error) {
      console.error('Error durante la inicialización:', error);
    } finally{
      this.spinnerService.hide();
    }
  }

  async loadPatients(): Promise<void>{
    try {
      this.patients = await this.userService.getPatientsTreatedBySpecialists(this.userData.email);
    } catch (error) {
      console.error('Error al cargar los pacientes:', error);
    }
  }

  onPatientChange(paciente: any){
    this.selectedPatient = paciente;
  }

  /*getPatientNames(): string[] {
  return Object.keys(this.patientAppointments);
  }*/

  async getFinishedAppointmentsOfPatient(){
    for (const patient of this.patients) {
      console.log("email del pacietne en getFinishedAppointmentsOfPatient"+ patient.email);
      console.log("email del esp en getFinishedAppointmentsOfPatient"+ this.userData.email);
      //const fullName = `${patient.name} ${patient.surname}`;
      const appts = await this.appointmentService.getFinishedAppointmentsOfPatient(this.userData.email, patient.email);
      const lastThreeAppts = appts.slice(0,3);
      this.patientAppointments[patient.email] = lastThreeAppts;
    }
      
  }

  showMedicalRecord(){
    this.medicalRecordService.emailPatient = this.selectedPatient.email;
    this.router.navigateByUrl('/mostrar-historial');
  }

}
