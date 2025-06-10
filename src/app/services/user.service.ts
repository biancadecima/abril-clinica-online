import { Injectable } from '@angular/core';
import { addDoc, collection, collectionData, doc, Firestore, getDoc, getDocs, query, setDoc, updateDoc, where } from '@angular/fire/firestore';
import { map, Observable } from 'rxjs';
import { Specialist, Patient, User } from '../interfaces/user';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private firestore: Firestore) { }

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
}
