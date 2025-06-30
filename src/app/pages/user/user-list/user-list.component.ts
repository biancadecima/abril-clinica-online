import { Component, EventEmitter, Output } from '@angular/core';
import { UserService } from '../../../services/user.service';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { User } from '../../../interfaces/user';
/*import * as XLSX from 'xlsx';*/
import { HighlightUnverifiedDirective } from '../../../directives/highlight-unverified.directive';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, HighlightUnverifiedDirective],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss'
})
export class UserListComponent {
  usersData$: Observable<User[]> | undefined;
  filteredUsers: User[] = [];
  allUsers: User[] = [];
  selectedRole: any;
  selectedUser: any = null;

  constructor(private userservice : UserService) { }

  ngOnInit(): void {
    this.usersData$ = this.userservice.getUsers();

    this.usersData$.subscribe(users => {
      console.log("data de todos los usuario" + users);
      console.log("largo de todos los usuario" + users.length);
      if (users && users.length > 0) {
        this.selectUser(users[0]); 
        this.allUsers = users;
        this.filteredUsers = users;     

        console.log("data de usuarios filtrados" + this.filteredUsers);
      }
    });
  }

  @Output() selectUserEvent = new EventEmitter<any>();

 
  selectUser(user: any) {
    this.selectUserEvent.emit(user); 
    this.selectedUser = user;
  }

  filterUsers(event: any): void {
    this.selectedRole = event.target.value;
    console.log("allUsers de filterUsers" + this.allUsers);

    if (this.selectedRole) {
      this.filteredUsers = this.allUsers.filter(user => user.role === this.selectedRole);
      console.log(this.filteredUsers[0]);
      this.selectUser(this.filteredUsers[0]);
    } else {
      this.filteredUsers = this.allUsers;
    }
  }

  getIsVerifiedEmail(user: any): boolean | null {
    return user.role !== 'Admin' ? user.isVerifiedEmail ?? null : null;
  }

  /*exportAllUsers(): void {
    if (this.allUsers.length === 0) {
      console.warn('No hay usuarios para exportar.');
      return;
    }

    const dataToExport = this.allUsers.map(user => ({
      Email: user.email,
      Nombre: user.name,
      Apellido: user.surname,
      Edad: user.age,
      DNI: user.dni,
      ObraSocial: 'insurance' in user ? user.insurance : '',
      Rol: user.role,
      Especialidades: 'specialities' in user ? (user.specialities as string[]).join(', ') : ''
    }));

   
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataToExport);


    const wb: XLSX.WorkBook = XLSX.utils.book_new();

   
    XLSX.utils.book_append_sheet(wb, ws, 'Usuarios');

  
    XLSX.writeFile(wb, 'todos_los_usuarios.xlsx');
  }*/

}
