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
  apptDate: string = '';
  apptHour: string = '';

  constructor(private firestore: Firestore) { }

  async saveMedicalRecord(medicalrecord: any) {  
    try {

      const col = collection(this.firestore, 'medicalrecord');

      await addDoc(col, medicalrecord);

    } catch (error) {
      console.error('Error al guardar la historia clinica:', error);
      throw error;
    }
  }

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

  async getMedicalRecordBySpeciality(speciality: string): Promise<any[]> {
    const records: any[] = [];
    try {
      const col = collection(this.firestore, 'medicalrecord');
      const recordQuery = query(col, 
        where('emailPatient', '==', this.emailPatient), 
        where('speciality', '==', speciality));
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

  /*async getMedicalRecordBySpeciality(speciality: string): Promise<any> {
    try {
      const medicalRecordRef = collection(this.firestore, 'medicalrecord');     
      const q = query(medicalRecordRef,  
        where('emailPatient', '==', this.emailPatient), 
        where('speciality', '==', speciality));
      const querySnapshot = await getDocs(q);
  
      if (!querySnapshot.empty) {
        return querySnapshot.docs[0].data();
      }
  
      return null;
    } catch (error) {
      console.error('Error al obtener la historia clínica:', error);
      return null;
    }
  }*/

  async getMedicalRecordByAppt(idAppointment: string): Promise<any> {
    try {
      
      const medicalRecordRef = collection(this.firestore, 'medicalrecord');
  
     
      const q = query(medicalRecordRef, where('idAppointment', '==', idAppointment));
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

  async getReviewByIdAppt(idAppt: string): Promise<string | null> {
    try {
      const turnosRef = collection(this.firestore, 'appointments');
      const q = query(turnosRef, where('id', '==', idAppt));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const turnoData = querySnapshot.docs[0].data();
        return turnoData['comment'] || null;
      }

      console.log('No se encontró un turno con el idTurno especificado.');
      return null;
    } catch (error) {
      console.error('Error al obtener la reseña por idTurno:', error);
      throw error;
    }
  }
}
