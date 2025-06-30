import { Injectable } from '@angular/core';
import { collection, Firestore, getDocs } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class LogsService {

  constructor(private firestore: Firestore) { }

  async getLogs(): Promise<any[]> {
    const logs: any[] = [];
    try {
      const col = collection(this.firestore, 'logs');
      const querySnapshot = await getDocs(col);
  
      if (!querySnapshot.empty) {
        
        logs.push(...querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } else {
        console.log('No se encontraron logs.');
      }
    } catch (error) {
      console.error('Error al obtener los logs:', error);
      throw error;
    }
    return logs;
  }
}
