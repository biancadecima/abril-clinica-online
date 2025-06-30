import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth } from '@angular/fire/auth';
import { addDoc, collection, Firestore } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { SpinnerService } from '../../services/spinner.service';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-log-in',
  standalone: true,
  imports: [FormsModule,CommonModule],
  templateUrl: './log-in.component.html',
  styleUrl: './log-in.component.scss',
  animations: [
    trigger('fadeAnimation', [
    // Animación de entrada: desde abajo hacia su posición original
    transition(':enter', [
      style({ opacity: 0, transform: 'translateY(100vh)' }), // Empieza desde abajo (fuera de pantalla)
      animate('600ms cubic-bezier(0.5, 0.8, 0.5, 1)', style({ opacity: 1, transform: 'translateY(520px)' })),
    ]),
    // Animación de salida: hacia abajo
    transition(':leave', [
      animate('300ms ease-in', style({ opacity: 0, transform: 'translateY(100px)' })),
    ]),
    ]),
  ],
})
export class LogInComponent implements OnInit{
  public userEmail:string = "";
  public userPassword:string = "";
  public errorMessage:string = "";
  patients: any[] = [];
  specialists: any[] = [];
  admins: any[] = [];

  constructor(
    private firestore: Firestore, 
    private router: Router,
    private auth: Auth,
    private authService: AuthService,
    private userService: UserService,
    private spinnerService: SpinnerService
  ){}

  async ngOnInit() {

    this.spinnerService.show();
    /*setTimeout(() => {
      this.spinnerService.hide(); // Ocultarlo después de 3 segundos
    }, 3000);*/

    ///TODO esto es para los accesos directos
   try {
      this.patients = await this.userService.getThreePatients();
      console.log(this.patients);
    } catch (error) {
      console.error('Error al cargar los pacientes:', error);
    }

    try {
      this.specialists = await this.userService.getTwoSpecialists();
      console.log(this.specialists);
    } catch (error) {
      console.error('Error al cargar los especialistas:', error);
    }

    try {
      this.admins = await this.userService.getAdmin();
      console.log(this.admins);
    } catch (error) {
      console.error('Error al cargar los administradores:', error);
    } finally{
      this.spinnerService.hide();
    }
  }

  async Login(): Promise<void> {
    this.spinnerService.show(); 
    this.authService.logIn(this.userEmail, this.userPassword).then((res) => {
      this.router.navigate(["/home"]);

      const now = new Date();
      const fecha = new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(now);
      const hora = new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit', hour12: true }).format(now);

      let col = collection(this.firestore, 'logs');
      addDoc(col, { fecha, hora, email: this.userEmail });
    }).catch((e) => {
      switch (e.code) {
        case "auth/invalid-email":
          this.errorMessage = "Email invalido";
          break;
        case "auth/invalid-credential":
          this.errorMessage = "Los datos son incorrectos";
          break;
        case "auth/missing-password":
          this.errorMessage = "Faltan completar campos";
          break;
        case "auth/email-not-verified":
          this.errorMessage = "No se validó el mail";
          break;
        case "auth/admin-not-verified":
          this.errorMessage = "No se ha validado por un admin";
          break;
        default:
          this.errorMessage = e.message || e.code;
          break;
      }
    });
    this.spinnerService.hide();
  }

  directAccess(email: string, password: string) {
    this.userEmail = email;
    this.userPassword = password;
  }

}

