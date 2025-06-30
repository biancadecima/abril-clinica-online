import { Component } from '@angular/core';
import { LogsService } from '../../services/logs.service';
import { CommonModule } from '@angular/common';
import { SpinnerService } from '../../services/spinner.service';
import { AppointmentService } from '../../services/appointment.service';
import { Chart, registerables } from 'chart.js';
//import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FormsModule } from '@angular/forms';
import { DateFormatPipe } from '../../pipes/date-format.pipe';

@Component({
  selector: 'app-information',
  standalone: true,
  imports: [CommonModule, FormsModule, DateFormatPipe],
  templateUrl: './information.component.html',
  styleUrl: './information.component.scss'
})
export class InformationComponent {
  logs : any[] = [];
  appointments : any[] = [];
  apptsPerSpeciality: { [especialidad: string]: number } = {};
  apptsPerDay: { [fecha: string]: number } = {};
  apptsPerSpecialist: { [medico: string]: number } = {};
  apptsFinishedBySpecialist: { [medico: string]: number } = {};
  chart: any;
  tabSelected: string = 'logs';
  fechaInicio: string | null = null;
  fechaFin: string | null = null;

  constructor(private logsService: LogsService, private spinnerService: SpinnerService, private appointmentService: AppointmentService){
    Chart.register(...registerables); 
  }

  async ngOnInit(){
    this.spinnerService.show();

    try{
      const logsTab = document.getElementById('tab-logs');
      const logsContent = document.getElementById('pills-logs');
    
      if (logsTab && logsContent) {
        logsTab.classList.add('active');
        logsContent.classList.add('show', 'active');
      }
  
      await this.loadLogs();

      await this.loadAppointments();
      await this.loadAppointmentsPerSpeciality();
      this.loadAppointmentsPerDay();
      this.renderGraphicApptsPerSpeciality();
      this.renderGraphicApptsPerDay();
    } catch (error){
      console.log(error);
    } finally {
      this.spinnerService.hide();
    }

  }

  async loadLogs(): Promise<void> {
    try {
      this.logs = await this.logsService.getLogs();
      console.log(this.logs); 
    } catch (error) {
      console.error('Error al cargar los logs:', error);
    }
  }

  async loadAppointments(): Promise<void> {
    this.appointments = await this.appointmentService.getAppointments();
  }

  async loadAppointmentsPerSpeciality(): Promise<void> {
    this.appointments.forEach((appt: any) => {
      const speciality = appt.speciality;
      this.apptsPerSpeciality[speciality] =
        (this.apptsPerSpeciality[speciality] || 0) + 1;
    });
  }

  loadAppointmentsPerDay(): void {
    this.appointments.forEach((appt: any) => {
      const fecha = appt.fecha;
      this.apptsPerDay[fecha] = (this.apptsPerDay[fecha] || 0) + 1;
    });
    console.log('Turnos por día:', this.apptsPerDay);
  }

  loadAppointmentsPerSpecialist(lapsoInicio: string, lapsoFin: string): void {
    this.apptsPerSpecialist = {};
  
    this.appointments.forEach((appt: any) => {
      const fecha = appt.fecha; 
      const specialist = appt.emailSp || 'Sin médico'; 
  
      // Verificar si el turno está dentro del lapso de tiempo
      if (fecha >= lapsoInicio && fecha <= lapsoFin) {
        this.apptsPerSpecialist[specialist] = (this.apptsPerSpecialist[specialist] || 0) + 1;
      }
    });
  
    console.log('Turnos por médico en el lapso:', this.apptsPerSpecialist);
  }

  loadAppointmentsFinishedBySpecialist(lapsoInicio: string, lapsoFin: string): void {
    this.apptsFinishedBySpecialist = {};
  
    this.appointments.forEach((appt: any) => {
      const fecha = appt.fecha; 
      const specialist = appt.emailSp; 
      const estado = appt.estado;
  
      // Verificar si el turno está dentro del lapso de tiempo
      if (estado === 'Realizado' && fecha >= lapsoInicio && fecha <= lapsoFin) {
        this.apptsFinishedBySpecialist[specialist] = (this.apptsFinishedBySpecialist[specialist] || 0) + 1;
      }
    });
    console.log('Turnos por finalizados médico en el lapso:', this.apptsFinishedBySpecialist);
  }

  filterAppointmentsBySpecialist(): void {
    if (this.fechaInicio && this.fechaFin) {
      const fechaInicioConvertida = this.convertirFechaFormatoSistema(this.fechaInicio);
      const fechaFinConvertida = this.convertirFechaFormatoSistema(this.fechaFin);

      if(this.tabSelected == "turnospormedico")
      {
        this.loadAppointmentsPerSpecialist(fechaInicioConvertida, fechaFinConvertida);
      }
      else if(this.tabSelected == "turnosFinalizadosPorMedico")
      {
        this.loadAppointmentsFinishedBySpecialist(fechaInicioConvertida, fechaFinConvertida);
        
      }

      this.renderGraphicApptsPerSpecialist();

    } else {
      console.error('Debe seleccionar ambas fechas.');
    }
  }

  convertirFechaFormatoSistema(fecha: string): string {//TODO esta conversion de fecha
    const [year, month, day] = fecha.split('-');
    return `${day}/${month}`;
  }


  changeTab(tab: string): void {
    this.tabSelected = tab;
    console.log(this.tabSelected);
  }

  renderGraphicApptsPerSpeciality(): void {
    const labels = Object.keys(this.apptsPerSpeciality);
    const data = Object.values(this.apptsPerSpeciality);
  
    this.chart = new Chart('turnosPorEspecialidadChart', {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Cantidad de Turnos',
            data: data,
            backgroundColor: [
              'rgba(255, 99, 132, 0.2)',
              'rgba(54, 162, 235, 0.2)',
              'rgba(255, 206, 86, 0.2)',
              'rgba(75, 192, 192, 0.2)',
              'rgba(153, 102, 255, 0.2)',
              'rgba(255, 159, 64, 0.2)',
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
              'rgba(255, 159, 64, 1)',
            ],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Turnos por Especialidad',
            font: {
              size: 20,
              weight: 'bold',
              family: 'Arial',
            },
          },
          legend: {
            display: true,
            position: 'top',
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Especialidades',
              font: {
                size: 14,
                weight: 'bold',
              },
            },
          },
          y: {
            title: {
              display: true,
              text: 'Cantidad de Turnos',
              font: {
                size: 14,
                weight: 'bold',
              },
            },
            beginAtZero: true,
          },
        },
      },
    });
  }

  renderGraphicApptsPerDay(): void {
    const labels = Object.keys(this.apptsPerDay);
    const data = Object.values(this.apptsPerDay);
  
    this.chart = new Chart('turnosPorDiaChart', {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Cantidad de Turnos',
            data: data,
            backgroundColor: [
              'rgba(255, 99, 132, 0.2)',
              'rgba(54, 162, 235, 0.2)',
              'rgba(255, 206, 86, 0.2)',
              'rgba(75, 192, 192, 0.2)',
              'rgba(153, 102, 255, 0.2)',
              'rgba(255, 159, 64, 0.2)',
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
              'rgba(255, 159, 64, 1)',
            ],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Turnos por Dia',
            font: {
              size: 20,
              weight: 'bold',
              family: 'Arial',
            },
          },
          legend: {
            display: true,
            position: 'top',
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Dias',
              font: {
                size: 14,
                weight: 'bold',
              },
            },
          },
          y: {
            title: {
              display: true,
              text: 'Cantidad de Turnos',
              font: {
                size: 14,
                weight: 'bold',
              },
            },
            beginAtZero: true,
          },
        },
      },
    });
  }

  renderGraphicApptsPerSpecialist(): void {
    let text = "";
    let chart = "";
    let labels: string[] = [];
    let data: number[] = [];

    if (this.chart) {
      this.chart.destroy();
    }

    if(this.tabSelected == "turnospormedico")
    {
      text = "Turnos por Medico";
      chart = 'turnosPorMedicoChart';
      labels = Object.keys(this.apptsPerSpecialist);
      data = Object.values(this.apptsPerSpecialist);
    }
    else{
      text = "Turnos Finalizados por Medico";
      chart = 'turnosFinalizadosPorMedicoChart';
      labels = Object.keys(this.apptsFinishedBySpecialist);
      data = Object.values(this.apptsFinishedBySpecialist);
    }
  
    this.chart = new Chart(chart, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Cantidad de Turnos por Medico',
            data: data,
            backgroundColor: [
              'rgba(255, 99, 132, 0.2)',
              'rgba(54, 162, 235, 0.2)',
              'rgba(255, 206, 86, 0.2)',
              'rgba(75, 192, 192, 0.2)',
              'rgba(153, 102, 255, 0.2)',
              'rgba(255, 159, 64, 0.2)',
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
              'rgba(255, 159, 64, 1)',
            ],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: text,
            font: {
              size: 20,
              weight: 'bold',
              family: 'Arial',
            },
          },
          legend: {
            display: true,
            position: 'top',
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Medicos',
              font: {
                size: 14,
                weight: 'bold',
              },
            },
          },
          y: {
            title: {
              display: true,
              text: 'Cantidad de Turnos',
              font: {
                size: 14,
                weight: 'bold',
              },
            },
            beginAtZero: true,
          },
        },
      },
    });
  }

  exportPdf(): void {
    const doc = new jsPDF();
    let datos: any[] = [];
    let canvas: any;

    switch(this.tabSelected){
      case 'logs':
        doc.text('Log de Ingresos', 10, 10);
  
        datos = this.logs.map(log => [log.email, log.fecha, log.hora]);
        autoTable(doc, {
          head: [['Email', 'Fecha', 'Hora']],
          body: datos,
        });
        break;
      case 'turnosPorEspecialidad':
        doc.text('Turnos por Especialidad', 10, 10);
    
        canvas = document.getElementById('turnosPorEspecialidadChart') as HTMLCanvasElement;
        if (canvas) {
          const imgData = canvas.toDataURL('image/png'); // Convertir el canvas a imagen
          doc.addImage(imgData, 'PNG', 10, 20, 180, 100); // Agregar la imagen al PDF
        } else {
          console.error('Canvas del gráfico no encontrado.');
        }
        break;
      case 'turnosPorDia':
      doc.text('Turnos por Dia', 10, 10);
    
      canvas = document.getElementById('turnosPorDiaChart') as HTMLCanvasElement;
      if (canvas) {
        const imgData = canvas.toDataURL('image/png'); 
        doc.addImage(imgData, 'PNG', 10, 20, 180, 100); 
      } else {
        console.error('Canvas del gráfico no encontrado.');
      }
      break;
      case 'turnospormedico':
        doc.text('Turnos por Medico', 10, 10);
    
        canvas = document.getElementById('turnosPorMedicoChart') as HTMLCanvasElement;
        if (canvas) {
          const imgData = canvas.toDataURL('image/png'); 
          doc.addImage(imgData, 'PNG', 10, 20, 180, 100); 
        } else {
          console.error('Canvas del gráfico no encontrado.');
        }
        break;
        case 'turnosFinalizadosPorMedico':
                  canvas = document.getElementById('turnosFinalizadosPorMedicoChart') as HTMLCanvasElement;
        if (canvas) {
          const imgData = canvas.toDataURL('image/png'); 
          doc.addImage(imgData, 'PNG', 10, 20, 180, 100); 
        } else {
          console.error('Canvas del gráfico no encontrado.');
        }
          break;
    }

    doc.save(`${this.tabSelected}.pdf`);
  }

}
