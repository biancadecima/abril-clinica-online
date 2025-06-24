import { Injectable } from '@angular/core';
import { addDoc, collection, collectionData, doc, Firestore, getDoc, getDocs, query, setDoc, updateDoc, where } from '@angular/fire/firestore';
import { map, Observable } from 'rxjs';
import { Specialist, Patient, User } from '../interfaces/user';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private firestore: Firestore) { }

  async getThreePatients(): Promise<any[]> {
    const patients: any[] = [];
    try {
      const usersCollectionRef = collection(this.firestore, 'users');
      const userQuery = query(usersCollectionRef, where('role', '==', 'Paciente'));
      const querySnapshot = await getDocs(userQuery);

      if (!querySnapshot.empty) {
        patients.push(...querySnapshot.docs.slice(0, 3).map(doc => doc.data()));
      } else {
        console.log('No se encontraron usuarios con rol de Paciente');
      }
    } catch (error) {
      console.error('Error al obtener los usuarios:', error);
      throw error;
    }
    return patients;
  }

  async getTwoSpecialists(): Promise<any[]> {
    const specialists: any[] = [];
    try {
      const usersCollectionRef = collection(this.firestore, 'users');
      const userQuery = query(usersCollectionRef, where('role', '==', 'Especialista'));
      const querySnapshot = await getDocs(userQuery);

      if (!querySnapshot.empty) {
        specialists.push(...querySnapshot.docs.slice(0, 2).map(doc => doc.data()));
      } else {
        console.log('No se encontraron usuarios con rol de Especialista');
      }
    } catch (error) {
      console.error('Error al obtener los usuarios:', error);
      throw error;
    }
    return specialists;
  }

  async getAdmin(): Promise<any[]> {
    const admins: any[] = [];
    try {
      const usersCollectionRef = collection(this.firestore, 'users');
      const userQuery = query(usersCollectionRef, where('role', '==', 'Admin'));
      const querySnapshot = await getDocs(userQuery);

      if (!querySnapshot.empty) {
        admins.push(...querySnapshot.docs.slice(0, 1).map(doc => doc.data()));
      } else {
        console.log('No se encontraron usuarios con rol de Admin');
      }
    } catch (error) {
      console.error('Error al obtener los usuarios:', error);
      throw error;
    }
    return admins;
  }


  async getSpecialities(): Promise<string[]> {
    const specialities: string[] = [];
    try {
      const specialitiesCollectionRef = collection(this.firestore, 'specialities');
      const querySnapshot = await getDocs(specialitiesCollectionRef);
  
      if (!querySnapshot.empty) {
        console.log('el querySnapshot no esta empty');
        // Extrae el campo "specialities" de cada documento
        querySnapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data['speciality']) { // Verifica que el campo exista
            specialities.push(data['speciality']);
          }
        });
      } else {
        console.log('No se encontraron documentos en la colección de specialities');
      }
    } catch (error) {
      console.error('Error al obtener las specialities:', error);
      throw error;
    }
    return specialities;
  }

  async getPatients(): Promise<any[]> {
    const patients: any[] = [];
    try {
      const usersCollectionRef = collection(this.firestore, 'users');
      const userQuery = query(usersCollectionRef, where('role', '==', 'Paciente'), where('isVerifiedEmail', '==', true));
      const querySnapshot = await getDocs(userQuery);

      if (!querySnapshot.empty) {
        patients.push(...querySnapshot.docs.map(doc => doc.data()));
      } else {
        console.log('No se encontraron usuarios con rol de Paciente');
      }
    } catch (error) {
      console.error('Error al obtener los usuarios:', error);
      throw error;
    }
    return patients;
  }

  async getSpecialists(): Promise<any[]> {
    const specialists: any[] = [];
    try {
      const usersCollectionRef = collection(this.firestore, 'users');
      const userQuery = query(usersCollectionRef, where('role', '==', 'Especialista'));
      const querySnapshot = await getDocs(userQuery);

      if (!querySnapshot.empty) {
        specialists.push(...querySnapshot.docs.map(doc => doc.data()));
      } else {
        console.log('No se encontraron usuarios con rol de Especialista');
      }
    } catch (error) {
      console.error('Error al obtener los usuarios:', error);
      throw error;
    }
    return specialists;
  }

  async saveSpecialities(newSpecialities: string[]): Promise<void> {
    const specialitiesCollectionRef = collection(this.firestore, 'specialities');

    for (const speciality of newSpecialities) {
      try {
        await addDoc(specialitiesCollectionRef, { speciality: speciality });
        console.log(`speciality "${speciality}" guardada en Firestore.`);
      } catch (error) {
        console.error(`Error al guardar la speciality "${speciality}":`, error);
      }
    }
  }

  getUsers(): Observable<User[]> {
    const usersCollection = collection(this.firestore, 'users');
    return collectionData(usersCollection, { idField: 'id' }).pipe(
      map(users => users.map(user => {
        switch (user['role']) {
          case 'Especialista':
            return {
              ...user,
              specialities: user['specialities'],
              isVerifiedEmail: user['isVerifiedEmail'],
              isVerifiedAdmin: user['isVerifiedAdmin']
            } as Specialist;
          case 'Paciente':
            return {
              ...user,
              insurance: user['insurance'],
              photo2: user['photo2'],
              isVerifiedEmail: user['isVerifiedEmail']
            } as Patient;
          default:
            return user as User; 
        }
      }))
    ) as Observable<User[]>;
  }

  public async adminChangeUserStatus(email: string, action: string) : Promise<void>{
    try {
      const usersCollectionRef = collection(this.firestore, 'users');
      const userQuery = query(usersCollectionRef, where('email', '==', email));
      const querySnapshot = await getDocs(userQuery);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0]; 

        if(action == "Verificar"){
          await updateDoc(userDoc.ref, { isVerifiedAdmin: true });
          console.log(`Usuario con email ${email} verificado por el admin.`);
        }
        else if(action == "Desverificar"){
          await updateDoc(userDoc.ref, { isVerifiedAdmin: false });
          console.log(`Usuario con email ${email} desverificado por el admin.`);
        }

      } else {
        console.log(`No se encontró ningún usuario con el email ${email}.`);
      }
    } catch (error) {
      console.error('Error al verificar la cuenta como admin:', error);
      throw error;
    }

  }

  async loadSchedules(email: string, specialities: string[]): Promise<any> {
    try {
      const usersCollectionRef = collection(this.firestore, 'users');
      const userQuery = query(usersCollectionRef, where('email', '==', email));
      const querySnapshot = await getDocs(userQuery);
  
      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        const schedule = userData['schedule'];
  
       
        if (!schedule || Object.keys(schedule).length === 0) {
          console.log("especialista sin horarios que entró al if correctamente")
          return this.initializeSchedule(specialities);
        }
  
        return schedule;
      } else {
        console.log(`No se encontró ningún usuario con el email ${email}.`);
        return this.initializeSchedule(specialities);
      }
    } catch (error) {
      console.error('Error al cargar los horarios:', error);
      throw error;
    }
  }

  initializeSchedule(specialities: string[]): any {
    const initialSchedules: any = {};
    const today = new Date();
  
    for (let i = 0; i < 15; i++) {
      const dateToday = new Date(today);
      dateToday.setDate(today.getDate() + i);
  
      const dayWeek = dateToday.toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase();
      const dayFormat = dayWeek.charAt(0).toUpperCase() + dayWeek.slice(1);
      const dayMonth = dateToday.getDate().toString().padStart(2, '0');
      const month = (dateToday.getMonth() + 1).toString().padStart(2, '0');
      const year = dateToday.getFullYear();
      const completeDate = `${dayMonth}/${month}`;
  
     
      initialSchedules[completeDate] = {
        dia: dayFormat,
        fecha: completeDate,
        horarios: {},
      };
  
     
      specialities.forEach((speciality: string) => {
        initialSchedules[completeDate].horarios[speciality] = { inicio: '', fin: '', intervalo: '' };
      });
    }
  
    return initialSchedules;
  }
  
  async saveHorarios(email: string, schedule: any): Promise<void> {
    try {
      const usersCollectionRef = collection(this.firestore, 'users');
      const userQuery = query(usersCollectionRef, where('email', '==', email));
      const querySnapshot = await getDocs(userQuery);
  
      if (!querySnapshot.empty) {
        const userDocRef = querySnapshot.docs[0].ref;
        await updateDoc(userDocRef, { schedule });
        console.log(`Horarios guardados para el usuario con email ${email}.`);
      } else {
        console.log(`No se encontró ningún usuario con el email ${email}.`);
      }
    } catch (error) {
      console.error('Error al guardar los horarios:', error);
      throw error;
    }
  }

   async getDatesWHorariosDisponibles(email: string, speciality: string): Promise<{ fecha: string; horariosDisponibles: string[] }[]> {
    const datesWHorarios: { fecha: string; horariosDisponibles: string[] }[] = [];
    console.log("especialidad:"+ speciality);
  
    try {
      const usersCollectionRef = collection(this.firestore, 'users');
      const userQuery = query(usersCollectionRef, where('email', '==', email));
      const querySnapshot = await getDocs(userQuery);
  
      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        const schedule = userData['schedule']; //TODO esta creo que es schedule
        console.log('schedule del especialista: '+ schedule);
  
        if (!schedule) {
          console.log('No hay horarios configurados para este usuario.');
          return datesWHorarios;
        }
  
        const hoy = new Date();
  
      
        for (let i = 0; i < 14; i++) {
          const fechaActual = new Date(hoy);
          fechaActual.setDate(hoy.getDate() + i);
  
          const diaSemana = fechaActual.getDay();
  
        
          if (diaSemana >= 1 && diaSemana <= 5) {
            const dia = fechaActual.getDate().toString().padStart(2, '0');
            const mes = (fechaActual.getMonth() + 1).toString().padStart(2, '0');
            const anio = fechaActual.getFullYear();
            const fechaFormateada = `${dia}/${mes}`;
            console.log("fecha formateada: "+ fechaFormateada);
  
            
            if (schedule[fechaFormateada] && schedule[fechaFormateada].horarios) {
              const horariosEspecialidad = schedule[fechaFormateada].horarios[speciality];
  
              if (horariosEspecialidad && horariosEspecialidad.horariosDisponibles?.length > 0) {
                datesWHorarios.push({
                  fecha: fechaFormateada,
                  horariosDisponibles: horariosEspecialidad.horariosDisponibles,
                });
              }
            }
          }
        }
      } else {
        console.log(`No se encontró ningún usuario con el email ${email}.`);
      }
    } catch (error) {
      console.error('Error al obtener las fechas con horarios disponibles:', error);
    }
  
    return datesWHorarios;
  }

   async updateHorariosDisponibles(email: string, speciality: string, fecha: string, horarioSeleccionado: string): Promise<void> {
    try {
      const usersCollectionRef = collection(this.firestore, 'users');
      const userQuery = query(usersCollectionRef, where('email', '==', email));
      const querySnapshot = await getDocs(userQuery);
  
      if (!querySnapshot.empty) {
        const userDocRef = querySnapshot.docs[0].ref;
        const userData = querySnapshot.docs[0].data();
        const schedule = userData['schedule'];
  
      
        //const horarioSeleccionado24 = this.convertirHoraFormato24(horarioSeleccionado);
  
      
        if (schedule && schedule[fecha] && schedule[fecha].horarios[speciality]) {
          const horariosDisponibles = schedule[fecha].horarios[speciality].horariosDisponibles;
  
         
          const nuevosHorariosDisponibles = horariosDisponibles.filter((hora: string) => hora !== horarioSeleccionado);
  
          
          schedule[fecha].horarios[speciality].horariosDisponibles = nuevosHorariosDisponibles;
  
          
          await updateDoc(userDocRef, { schedule });
          console.log(`Horario ${horarioSeleccionado} eliminado correctamente de ${fecha} para la especialidad ${speciality}.`);
        } else {
          console.log('No se encontraron horarios para actualizar.');
        }
      } else {
        console.log(`No se encontró ningún usuario con el email ${email}.`);
      }
    } catch (error) {
      console.error('Error al actualizar los horarios disponibles:', error);
    }
  }

  /*convertirHoraFormato24(hora12: string): string {
    const [horaMinutos, periodo] = hora12.split(' ');
    let [hora, minutos] = horaMinutos.split(':').map(Number);
  
    if (periodo === 'PM' && hora !== 12) {
      hora += 12;
    } else if (periodo === 'AM' && hora === 12) {
      hora = 0;
    }
  
    const horaFormateada = hora.toString().padStart(2, '0');
    const minutosFormateados = minutos.toString().padStart(2, '0');
  
    return `${horaFormateada}:${minutosFormateados}`;
  }*/

  async getPatientsTreatedBySpecialists(emailSp: string): Promise<any[]> {
    const patients: any[] = [];
    const uniqueEmails = new Set<string>();

    try {
     
      const turnosCollectionRef = collection(this.firestore, 'appointments');
      const turnosQuery = query(turnosCollectionRef, where('emailSp', '==', emailSp), where('estado', '==', "Realizado"));
      const turnosSnapshot = await getDocs(turnosQuery);
  
      if (!turnosSnapshot.empty) {
    
        const emailsPacientes = turnosSnapshot.docs.map(turnoDoc => turnoDoc.data()['emailPat']);
  
        const usersCollectionRef = collection(this.firestore, 'users');
        for (const emailPaciente of emailsPacientes) {

          if (!uniqueEmails.has(emailPaciente)){

            const userQuery = query(usersCollectionRef, where('email', '==', emailPaciente));
            const userSnapshot = await getDocs(userQuery);
    
            if (!userSnapshot.empty) {
              patients.push(...userSnapshot.docs.map(doc => doc.data()));
              uniqueEmails.add(emailPaciente);
            }

          }

        }
      } else {
        console.log('No se encontraron turnos para el especialista');
      }
    } catch (error) {
      console.error('Error al obtener los pacientes atendidos por el especialista:', error);
      throw error;
    }
    return patients;
  }

}
