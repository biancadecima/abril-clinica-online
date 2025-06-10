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
    }
];
