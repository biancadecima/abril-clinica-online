import { Injectable } from '@angular/core';
import { addDoc, collection, doc, Firestore, getDocs, query, updateDoc, where } from '@angular/fire/firestore';
import { SpinnerService } from './spinner.service';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {

  constructor(private firestore: Firestore, private spinnerService: SpinnerService) { }

  async saveAppointment(emailSp: string, nameSp: string, speciality: string, emailPat: string,
    namePat: string, fecha: string, horario: string): Promise<void> {

    this.spinnerService.show();

    try {
      const col = collection(this.firestore, 'appointments');
      const newDocRef = doc(col); 
      const id = newDocRef.id; 
      
        await addDoc(col, {
          id: id,
          emailSp: emailSp,
          nameSp: nameSp,
          speciality: speciality,
          emailPat: emailPat,
          namePat: namePat,
          fecha: fecha,
          horario: horario,
          estado: 'Pendiente',
        });
    } catch (error) {
      console.error('Error al guardar los horarios:', error);
      throw error;
    } finally{
      this.spinnerService.hide(); 
    };
  }

  async getAppointments(): Promise<any[]> {
    const appointments: any[] = [];
    try {
      const col = collection(this.firestore, 'appointments');
      const querySnapshot = await getDocs(col);
    
      if (!querySnapshot.empty) {
        appointments.push(...querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } else {
        console.log('No se encontraron turnos.');
      }
    } catch (error) {
      console.error('Error al obtener los turnos:', error);
      throw error;
    }
    return appointments;
  }

  async getPatientAppointments(emailPat: string): Promise<any[]> {
    try {
      const appointmentsRef = collection(this.firestore, 'appointments');
      const q = query(
        appointmentsRef,
        where('emailPat', '==', emailPat),
        where('estado', '==', 'Realizado')
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        console.log(`No se encontraron turnos realizados para ${emailPat}`);
        return [];
      }

      const appointments = snapshot.docs.map(doc => doc.data());
      return appointments;

    } catch (error) {
      console.error('Error al obtener los turnos realizados del paciente:', error);
      throw error;
    }
  }

  async getUserAppointments(email: string, completeName: string, role: string): Promise<any[]> {
    const appointments: any[] = [];

    try {
      const apptCollectionRef = collection(this.firestore, 'appointments');
      let apptsQuery: any;

      if(role == "Especialista"){
        apptsQuery = query(apptCollectionRef, where('emailSp', '==', email));
      
      } else if(role == "Paciente"){
        apptsQuery = query(apptCollectionRef, where('namePat', '==', completeName));
      }
      
      const querySnapshot = await getDocs(apptsQuery);

      if (!querySnapshot.empty) {
        appointments.push(...querySnapshot.docs.map(doc => doc.data()));
      } else {
        console.log('No se encontraron turnos de ese usuario');
      }
    } catch (error) {
      console.error('Error al obtener los usuarios:', error);
      throw error;
    }
    return appointments;
  }

  async getFinishedAppointmentsOfPatient(emailSp: string, emailPat: string): Promise<any[]> {
    //console.log("getFinishedAppointment emailsp: "+emailSp);
    //console.log("getFinishedAppointment emailPat: "+emailPat);
    try {
      const apptCollectionRef = collection(this.firestore, 'appointments');
      const apptsQuery = query(
        apptCollectionRef,
        where('emailSp', '==', emailSp),
        where('emailPat', '==', emailPat),
        where('estado', '==', "Realizado"),
      );

      const querySnapshot = await getDocs(apptsQuery);

      if (querySnapshot.empty) {
        return [];
      }

      const appointments = querySnapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            ...data,
            parsedDate: this.parseDateString(data['fecha'])
          };
        })
        .sort((a, b) => b.parsedDate.getTime() - a.parsedDate.getTime());
        //.slice(0, 3); // Últimos 3 turnos

        console.log("getFinishedAppointmentsOfPatient: "+appointments);

      return appointments;
    } catch (error) {
      console.error('Error al obtener turnos del paciente:', error);
      throw error;
    }
  }


  async updateAppointmentStatus(id: string, nuevoEstado: string, comentario: string): Promise<void> {
    try {
      const turnosCollectionRef = collection(this.firestore, 'appointments');

      const turnoQuery = query(
        turnosCollectionRef,
        where('id', '==', id),
      );
     
      const querySnapshot = await getDocs(turnoQuery);
  
      if (!querySnapshot.empty) {
        
        for (const docSnapshot of querySnapshot.docs) {
          const turnoRef = docSnapshot.ref;
          await updateDoc(turnoRef, { estado: nuevoEstado, comment: comentario });
        }
      } else {
        console.log('No se encontró el turno especificado.');
      }
    } catch (error) {
      console.error('Error al aceptar el turno:', error);
      throw error;
    }
  }

  async updateSurvey(id: string, survey: string) : Promise<void>{
    try {
      const turnosCollectionRef = collection(this.firestore, 'appointments');
  
      const turnoQuery = query(
        turnosCollectionRef,
        where('id', '==', id),
      );
     
      const querySnapshot = await getDocs(turnoQuery);
  
      if (!querySnapshot.empty) {
       
        for (const docSnapshot of querySnapshot.docs) {
          const turnoRef = docSnapshot.ref;
          await updateDoc(turnoRef, { survey: survey });
        }
      } else {
        console.log('No se encontró el turno especificado.');
      }
    } catch (error) {
      console.error('Error al aceptar el turno:', error);
      throw error;
    }

  }

   async actualizarCalificacionAtencion(id: string, atencion: string) : Promise<void>{
    try {
      const turnosCollectionRef = collection(this.firestore, 'appointments');
  
      const turnoQuery = query(
        turnosCollectionRef,
        where('id', '==', id),
      );
    
      const querySnapshot = await getDocs(turnoQuery);
  
      if (!querySnapshot.empty) {
       
        for (const docSnapshot of querySnapshot.docs) {
          const turnoRef = docSnapshot.ref;
          await updateDoc(turnoRef, { atencion: atencion });
        }
      } else {
        console.log('No se encontró el turno especificado.');
      }
    } catch (error) {
      console.error('Error al aceptar el turno:', error);
      throw error;
    }

  }

  async getFilteredAppts(emailSpecialists: string[], specialities: string[]): Promise<any[]> {
    const turnosCollectionRef = collection(this.firestore, 'appointments');
    let turnoQuery;
    
    if (emailSpecialists.length > 0 && specialities.length > 0) {
      turnoQuery = query(
        turnosCollectionRef,
        where('emailSp', 'in', emailSpecialists),
        where('speciality', 'in', specialities)
      );
    } else if (emailSpecialists.length > 0) {
      
      turnoQuery = query(
        turnosCollectionRef,
        where('emailSp', 'in', emailSpecialists)
      );
    } else if (specialities.length > 0) {
     
      turnoQuery = query(
        turnosCollectionRef,
        where('speciality', 'in', specialities)
      );
    } else {
      
      turnoQuery = turnosCollectionRef;
    }
  
    const querySnapshot = await getDocs(turnoQuery);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  parseDateString(dateStr: string): Date {
  const [day, month] = dateStr.split('/').map(Number);
  const currentYear = new Date().getFullYear();
  return new Date(currentYear, month - 1, day);
}

}
