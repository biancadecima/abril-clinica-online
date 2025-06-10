import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.scss',
   animations: [
    trigger('fadeAnimation', [
      // Animación de entrada
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
      // Animación de salida
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0, transform: 'translateY(20px)' })),
      ]),
    ]),
  ],
})

export class WelcomeComponent {
  auxObservable$! : Observable<User | null>; //creo un observable que puede ser un usuario o null
  user$! : User | null; //Voy a guardar la respuesta del observable

  constructor(private router: Router, public authService: AuthService){
    this.auxObservable$ = this.authService.getUser();
    this.auxObservable$.subscribe((r)=> 
    {
      this.user$ = r;
    })
  }

  signUp(){
    this.router.navigate(["/registrarse"]);
  }

  logIn(){
    this.router.navigate(["/ingresar"]);
  }
}
