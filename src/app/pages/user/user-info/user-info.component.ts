import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SignUpComponent } from '../../sign-up/sign-up.component';
import { AuthService } from '../../../services/auth.service';
import { UserListComponent } from '../user-list/user-list.component';
import { UserDetailsComponent } from '../user-details/user-details.component';

@Component({
  selector: 'app-user-info',
  standalone: true,
  imports: [CommonModule, SignUpComponent, UserListComponent, UserDetailsComponent],
  templateUrl: './user-info.component.html',
  styleUrl: './user-info.component.scss'
})
export class UserInfoComponent implements OnInit{
  selectUserEvent: any;
  showSignUp = false;

  constructor(private authService : AuthService){}

  ngOnInit(): void {
    this.authService.updateVerificationStatusForAllUsers()
  }

  onSelectedUser(user: any) {
    this.selectUserEvent = user;
    console.log(this.selectUserEvent);
  }

  createUser() {
    this.showSignUp = true; 
  }

  closeSignUp() {
    this.showSignUp = false; 
  }
}
