import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: "full" },
    { path: 'home',
      loadComponent: () => 
        import('./pages/home/home.component').then(
            (c) => c.HomeComponent
        ),
      title: 'Abril Clínica'
    },
    { path: 'ingresar',
      loadComponent: () => 
        import('./pages/log-in/log-in.component').then(
            (c) => c.LogInComponent
        ),
      title: 'Ingresar'
    },
    { path: 'registrarse',
      loadComponent: () => 
        import('./pages/sign-up/sign-up.component').then(
            (c) => c.SignUpComponent
        ),
      title: 'Registrarse'
    },
    { path: 'usuarios',
      loadComponent: () => 
        import('./pages/user/user-info/user-info.component').then(
            (c) => c.UserInfoComponent
        ),
      title: 'Usuarios'
    },
    { path: 'perfil',
      loadComponent: () => 
        import('./pages/profile/profile.component').then(
            (c) => c.ProfileComponent
        ),
      title: 'Mi perfil'
    },
    { path: 'solicitar-turno',
      loadComponent: () => 
        import('./pages/request-appointment/request-appointment.component').then(
            (c) => c.RequestAppointmentComponent
        ),
      title: 'Solicitar turno'
    },
    { path: 'mis-turnos',
      loadComponent: () => 
        import('./pages/my-appointments/my-appointments.component').then(
            (c) => c.MyAppointmentsComponent
        ),
      title: 'Mis turnos'
    },
    { path: 'turnos',
      loadComponent: () => 
        import('./pages/appointments/appointments.component').then(
            (c) => c.AppointmentsComponent
        ),
      title: 'Turnos'
    },
    { path: 'historia-clinica',
      loadComponent: () => 
        import('./pages/medical-record/medical-record.component').then(
            (c) => c.MedicalRecordComponent
        ),
      title: 'Historia Clinica'
    },
    { path: 'mostrar-historial',
      loadComponent: () => 
        import('./pages/show-records/show-records.component').then(
            (c) => c.ShowRecordsComponent
        ),
      title: 'Ver Historias'
    },
    { path: 'pacientes',
      loadComponent: () => 
        import('./pages/patients/patients.component').then(
            (c) => c.PatientsComponent
        ),
      title: 'Pacientes'
    },
    { path: 'informes',
      loadComponent: () => 
        import('./pages/information/information.component').then(
            (c) => c.InformationComponent
        ),
      title: 'Informes'
    }
];
