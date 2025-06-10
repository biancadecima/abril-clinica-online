import { Injectable } from '@angular/core';
import { addDoc, collection, doc, Firestore, getDoc, getDocs, query, where } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class MedicalRecordService {
  emailSpecialist: string = '';
  specialist: string = '';
  emailPatient: string = '';
  patient: string = '';
  idAppointment: string = '';
  speciality: string = '';
  appointmentDate: string = '';
  appointmentHour: string = '';

  constructor(private firestore: Firestore) { }

  /*async guardarHistoriaClinica(historial: any) {  
    try {

      const col = collection(this.firestore, 'historia-clinica');

      await addDoc(col, historial);

    } catch (error) {
      console.error('Error al guardar la historia clinica:', error);
      throw error;
    }
  }*/

  async getMedicalRecord(): Promise<any[]> {
    const records: any[] = [];
    try {
      const col = collection(this.firestore, 'medicalrecord');
      const recordQuery = query(col, where('emailPatient', '==', this.emailPatient));
      const querySnapshot = await getDocs(recordQuery);

      if (!querySnapshot.empty) {
        records.push(...querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } else {
        console.log('No se encontraron historias clínicas para los criterios especificados.');
      }
    } catch (error) {
      console.error('Error al obtener la historia clínica:', error);
      throw error;
    }
    return records;
  }

  /*async getHistoriaClinicaPorTurno(idTurno: string): Promise<any> {
    try {
      
      const historiaClinicaRef = collection(this.firestore, 'historia-clinica');
  
     
      const q = query(historiaClinicaRef, where('idTurno', '==', idTurno));
      const querySnapshot = await getDocs(q);
  
     
      if (!querySnapshot.empty) {
        return querySnapshot.docs[0].data();
      }
  
      
      return null;
    } catch (error) {
      console.error('Error al obtener la historia clínica:', error);
      return null;
    }
  }

  async getReseñaPorIdTurno(idTurno: string): Promise<string | null> {
    try {
      const turnosRef = collection(this.firestore, 'turnos');
      const q = query(turnosRef, where('id', '==', idTurno));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const turnoData = querySnapshot.docs[0].data();
        return turnoData['comentario'] || null;
      }

      console.log('No se encontró un turno con el idTurno especificado.');
      return null;
    } catch (error) {
      console.error('Error al obtener la reseña por idTurno:', error);
      throw error;
    }
  }*/
}
