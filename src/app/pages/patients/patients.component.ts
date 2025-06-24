import { Component } from '@angular/core';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { SpinnerService } from '../../services/spinner.service';
import { Router } from '@angular/router';
import { MedicalRecordService } from '../../services/medical-record.service';
/*import { DisableIfEmptyDirective } from '../../directivas/disable-if-empty.directive';*/

@Component({
  selector: 'app-patients',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './patients.component.html',
  styleUrl: './patients.component.scss'
})
export class PatientsComponent {
  patients: any[] = [];
  userData: any;
  selectedPatient: any | null = null; 

  constructor(private userService: UserService, private authService: AuthService, 
    private spinnerService: SpinnerService, private router: Router, private medicalRecordService: MedicalRecordService){}

  async ngOnInit(){
    this.spinnerService.show();

    try {
      this.userData = this.authService.getUserData();

      await this.loadPatients();

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

  showMedicalRecord(){
    this.medicalRecordService.emailPatient = this.selectedPatient.email;
    this.router.navigateByUrl('/mostrar-historial');
  }

}
