import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MedicalRecordService } from '../../services/medical-record.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2'

@Component({
  selector: 'app-medical-record',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './medical-record.component.html',
  styleUrl: './medical-record.component.scss'
})
export class MedicalRecordComponent { //esto seria cargar historia clinica
  form!: FormGroup;
  msjError: string = "";
  submitted: boolean = false;

  constructor(private fb: FormBuilder, private router: Router,private medicalRecordService: MedicalRecordService){}

  ngOnInit(): void {
    this.form = this.fb.group({
      altura: ['', [Validators.pattern('^[0-9]*$'), Validators.min(10), Validators.max(300), Validators.required]],
      peso: ['', [Validators.pattern('^[0-9]*$'), Validators.min(0), Validators.max(600), Validators.required]],
      temperatura: ['', [Validators.pattern('^[0-9]*$'), Validators.min(10), Validators.max(45), Validators.required]],
      presion: ['', [Validators.pattern('^[0-9]*$'), Validators.min(80), Validators.max(180), Validators.required]],
      clave1: ['', [Validators.pattern('^[a-zA-Z]+$'), Validators.required]],
      valor1: ['', [Validators.required]],
      clave2: ['', [Validators.pattern('^[a-zA-Z]+$'), Validators.required]],
      valor2: ['', [Validators.required]],
      clave3: ['', [Validators.pattern('^[a-zA-Z]+$')]],
      valor3: [''],
    });
   }


  get altura() {
    return this.form.get('altura');
  }

  get peso() {
    return this.form.get('peso');
  }

  get temperatura() {
    return this.form.get('temperatura');
  }

  get presion() {
    return this.form.get('presion');
  }

  get clave1() {
    return this.form.get('clave1');
  }

  get valor1() {
    return this.form.get('valor1');
  }

  get clave2() {
    return this.form.get('clave2');
  }

  get valor2() {
    return this.form.get('valor2');
  }

  get clave3() {
    return this.form.get('clave2');
  }

  get valor3() {
    return this.form.get('valor2');
  }

  async submitForm() {

    this.submitted = true; // Marca el formulario como enviado

    if (this.form.valid) {
      let value = this.form.getRawValue();

      const medicalRecord: {
        altura: any;
        peso: any;
        temperatura: any;
        presion: any;
        patient: string;
        emailPatient: string;
        emailSpecialist: string;
        specialist: string;
        idAppointment: string;
        speciality: string;
        [key: string]: any; // Permite claves dinámicas
      } = {
        
        emailSpecialist: this.medicalRecordService.emailSpecialist,
        specialist: this.medicalRecordService.specialist,
        emailPatient: this.medicalRecordService.emailPatient,
        patient: this.medicalRecordService.patient,
        altura: value.altura,
        peso: value.peso,
        temperatura: value.temperatura,
        presion: value.presion,
        idAppointment: this.medicalRecordService.idAppointment,
        speciality: this.medicalRecordService.speciality,
        apptDate: this.medicalRecordService.apptDate,
        apptHour: this.medicalRecordService.apptHour,
        fechaEmision: this.formatDate(new Date()),
      };
      
      // Agregar claves dinámicas
      if (value.clave1 && value.valor1) {
        medicalRecord[value.clave1] = value.valor1;
      }
      if (value.clave2 && value.valor2) {
        medicalRecord[value.clave2] = value.valor2;
      }
      if (value.clave3 && value.valor3) {
        medicalRecord[value.clave3] = value.valor3;
      }

      console.log("historia clinica: "+medicalRecord);


      this.medicalRecordService.saveMedicalRecord(medicalRecord).then(() => {

        Swal.fire({
          icon: 'success',
          title: 'Historia clinica cargada con éxito',
          confirmButtonText: 'Aceptar',
          reverseButtons: true,
          allowOutsideClick: false,
        }).then((r) => {
          if (r.isConfirmed) {
            this.form.reset();
            this.router.navigateByUrl('/mis-turnos');
          }
        });

      });
    }
  }

  formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0'); 
    const month = String(date.getMonth() + 1).padStart(2, '0'); 
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }
}
