import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { UserService } from '../../../services/user.service';
import { MedicalRecordService } from '../../../services/medical-record.service';
import { Router } from '@angular/router';
import { BooleanPipe } from '../../../pipes/boolean.pipe';
import { DniFormatPipe } from '../../../pipes/dni-format.pipe';
import { AppointmentService } from '../../../services/appointment.service';
import * as XLSX from 'xlsx';
//import { jsPDF } from 'jspdf';

@Component({
  selector: 'app-user-details',
  standalone: true,
  imports: [CommonModule, BooleanPipe, DniFormatPipe],
  templateUrl: './user-details.component.html',
  styleUrl: './user-details.component.scss'
})
export class UserDetailsComponent {
  @Input() user: any;

  constructor(private userService : UserService, private medicalRecordService: MedicalRecordService, private router: Router, private appointmentService: AppointmentService){}

  ngOnInit() : void{}

  getSpecialities(user: any): string {
    return user?.specialities ? user.specialities.join(', ') : '';
  }

  changeUserStatus(action: string): void{
    this.userService.adminChangeUserStatus(this.user.email, action);
  }

  getIsVerifiedEmail(user: any): boolean | null {
    return user.role !== 'Admin' ? user.isVerifiedEmail ?? null : null;
  }

  showMedicalRecord(){
    this.medicalRecordService.emailPatient = this.user.email;
    this.router.navigateByUrl('/mostrar-historial');
  }

  async downloadExcel(): Promise<void> { //
    try{
      const appointments = await this.appointmentService.getPatientAppointments(this.user.email);
       const data = appointments.map(appt => ({
        Fecha: appt.fecha,
        Horario: appt.horario,
        Nombre: appt.namePat,
        Email: appt.emailPat,
        Especialista: appt.nameSp,
        Especialidad: appt.speciality,
        Estado: appt.estado,
        Comentario: appt.comment || '',
      }));
    
      const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Turnos');
      XLSX.writeFile(wb, 'turnos_realizados_paciente.xlsx');
    
    }catch (error) {
      console.error('Error al exportar los turnos:', error);
    }
  }

  /*async downloadPDF() {
    try {
      this.medicalRecordService.emailPatient = this.user.email;
      const records: Array<{ [key: string]: any }> = await this.medicalRecordService.getMedicalRecord();
      const loadedRecords = records.map(record => {
        const fixedKeys = [
          'altura',
          'peso',
          'temperatura',
          'presion',
          'paciente',
          'emailPaciente',
          'emailEspecialista',
          'especialista',
          'idTurno',
          'especialidad',
          'fechaTurno',
          'horaTurno',
          'id',
          'fechaEmision'
        ];
  
        const fixedData = Object.keys(record)
          .filter(key => fixedKeys.includes(key))
          .reduce((obj, key) => {
            obj[key] = record[key];
            return obj;
          }, {} as Record<string, any>); 
  
        const dynamicData = Object.keys(record)
          .filter(key => !fixedKeys.includes(key))
          .reduce((obj, key) => {
            obj[key] = record[key];
            return obj;
          }, {} as Record<string, any>);
  
        return {
          ...fixedData,
          dynamicData,
        };
      });
  
      this.generatePDF(loadedRecords);
    } catch (error) {
      console.error("Error al descargar el PDF:", error);
    }
  }

  generatePDF(records: any[]) {
    const doc = new jsPDF();
    const logoUrl = 'assets/logohospital.png'; 
    const title = 'Informe de Historia Clínica';
  
    records.forEach((record, index) => {
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
      const fixedData = [
        `Turno de ${record.speciality}`,
        `Paciente: ${record.patient}`,
        `Especialista: ${record.specialist}`,
        `Fecha del turno: ${record.apptDate}`,
        `Hora del turno: ${record.apptHour}`,
        `Altura: ${record.altura}`,
        `Peso: ${record.peso}`,
        `Presión: ${record.presion}`,
        `Temperatura: ${record.temperatura}`,
        `Fecha de emisión: ${record.fechaEmision}`
      ];
  
      fixedData.forEach(text => {
        doc.text(text, 10, y);
        y += 10;
      });
  
      // Datos dinámicos
      if (record.dynamicData && Object.keys(record.dynamicData).length > 0) {
        doc.text("Datos Adicionales:", 10, y);
        y += 10;
  
        Object.keys(record.dynamicData).forEach(key => {
          const value = record.dynamicData[key];
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
  }*/
}
