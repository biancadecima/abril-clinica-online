import { Component } from '@angular/core';
import { SpinnerService } from '../../services/spinner.service';
import { MedicalRecordService } from '../../services/medical-record.service';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2'

@Component({
  selector: 'app-show-records',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './show-records.component.html',
  styleUrl: './show-records.component.scss'
})
export class ShowRecordsComponent {
  medicalRecords: any[] = [];
  Object: any;
  review: any;

  constructor(private spinnerService: SpinnerService, private medicalRecordService: MedicalRecordService){}

  async ngOnInit(){
    this.spinnerService.show();

    try {
      await this.loadMedicalRecords();
      console.log(this.medicalRecords)

    } catch (error) {
      console.error('Error durante la inicialización:', error);
    } finally{
      this.spinnerService.hide();
    }
  }

  async loadMedicalRecords(): Promise<void> {
    try {
      const records = await this.medicalRecordService.getMedicalRecord();
      this.medicalRecords = records.map(record => {
        // Claves fijas conocidas
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
          'id',
          'fechaEmision'
        ];
  
        // Separar datos fijos y dinámicos
        const datosFijos = Object.keys(record)
          .filter(key => clavesFijas.includes(key))
          .reduce((obj, key) => {
            obj[key] = record[key];
            return obj;
          }, {} as Record<string, any>);
  
        const dinamicos = Object.keys(record)
          .filter(key => !clavesFijas.includes(key))
          .reduce((obj, key) => {
            obj[key] = record[key];
            return obj;
          }, {} as Record<string, any>);
  
        return {
          ...datosFijos,
          dinamicos,
        };
      });
    } catch (error) {
      console.error('Error al cargar las historias clínicas:', error);
    }
  }

  objectKeys(obj: any): string[] {
    return Object.keys(obj);
  }

  async showReview(idAppt: string)
  {
    this.review = await this.medicalRecordService.getReviewByIdAppt(idAppt);

    console.log("review: "+this.review);

    Swal.fire({
      title: 'Comentario del Turno',
      text: this.review,
      icon: 'info',
      confirmButtonText: 'Cerrar',
      allowOutsideClick: false,
    });
  }
}
