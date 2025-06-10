import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Observable } from 'rxjs';
import { User } from '@angular/fire/auth';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnInit, OnDestroy{
  title = 'Abril Clínica';
  userData$: Observable<any | null>; 
  role: string = ""; 

  constructor(private authService: AuthService, private router: Router) {
    this.userData$ = this.authService.getUser();
  }

  ngOnInit(): void {
    this.userData$.subscribe((userData) => {      
      if (userData) {
        this.role = userData.role;
      } else {
        this.role = "";
      }
    });
  }

  logOut(): void {
    this.authService.logOut();
    this.router.navigateByUrl('/home');
    console.log("Sesión Cerrada");
  }

  ngOnDestroy(): void {
    this.logOut();
  }
}
