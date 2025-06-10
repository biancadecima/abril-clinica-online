import { Injectable } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, signOut, User, onAuthStateChanged, authState } from '@angular/fire/auth';
import { collection, doc, Firestore, getDoc, getDocs, query, updateDoc, where } from '@angular/fire/firestore';
import { from, Observable, of, switchMap } from 'rxjs';
import { SpinnerService } from './spinner.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private storageKey = 'userData';

  constructor(private auth: Auth, private firestore: Firestore, private spinnerService: SpinnerService) { }

  getUserData(): any {
    const data = sessionStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : null;
  }

  public register(email : string, password: string, userData: any)
  {
    this.spinnerService.show();
    return createUserWithEmailAndPassword(this.auth, email, password)
      .then((userCredential) => {
        if (userCredential.user) {
          console.log(`en el servicio register ${userData?.role}`);
  
          if (userData?.role != "Admin") {
            // Cierra sesión si el registro no es realizado por el administrador
            this.auth.signOut();
          } else{
            // Volver a autenticar al administrador después del registro
            return signInWithEmailAndPassword(this.auth, userData?.email, userData?.password);
          }
  
          // Enviar correo de verificación si no es necesario restaurar la sesión del administrador
          return sendEmailVerification(userCredential.user).then(() => userCredential);
        }
        return userCredential;
      })
      .catch((error) => {
        console.error('Error de registro:', error); // Manejo de errores
        throw error;
      })
      .finally(() => {
        this.spinnerService.hide(); // Oculta el loading al finalizar el registro
      });
  }

  public async logIn(email: string, password: string): Promise<void> {
    console.log("acá entra antes del try");
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      console.log(userCredential +" esa fue la user credential");
      const user = userCredential.user;

      // Verificar en la colección de usuarios usando el email como identificador
      const usersCollectionRef = collection(this.firestore, 'users');
      const userQuery = query(usersCollectionRef, where('email', '==', email));
      const querySnapshot = await getDocs(userQuery);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0]; // Asumimos que el email es único
        const userData = userDoc.data();

        if (userCredential.user.emailVerified) {////////////////////////////////////////
          
          // Actualizar campo "isVerified" a true si el email está verificado
          await updateDoc(userDoc.ref, { isVerifiedEmail: true });
          userData['isVerifiedEmail'] = true;
        }

        if ((userData['role'] == 'Especialista' || userData['role'] == 'Paciente') && !userData['isVerifiedEmail']) {
          await this.auth.signOut();
          throw { code: 'auth/email-not-verified', message: 'No se validó el mail' };       
        }
        
        if (userData['role'] == 'Especialista' && !userData['isVerifiedAdmin']) {
          await this.auth.signOut();
          throw { code: 'auth/admin-not-verified', message: 'No se ha validado por un admin' };
          
        }

        console.log("hasta aca llegamos?");

        this.saveSession(userData);

      } else {
        throw { code: 'auth/user-data-not-found', message: 'User data not found' };
      }
    } catch (error) {
      console.log("error");
      await this.auth.signOut();
      throw error;
    }
  }

  private saveSession(userData: any) : void{
    if (!userData.isVerifiedEmail || (userData.role === 'Especialista' && !userData.isVerifiedAdmin)) {
      console.warn("No se guardará la sesión porque el usuario no está completamente verificado.");
      return;
    }

    const sessionData: any = {
      name: userData['name'],
      surname: userData['surname'],
      age: userData['age'],
      dni: userData['dni'],
      email: userData['email'],
      password: userData['password'],
      role: userData['role'],
      photo: userData['photo']
    };

    switch (userData['role']) {
      case 'Especialista':
        sessionData.specialities = userData['specialities'];
        break;
      case 'Paciente':
        sessionData.insurance = userData['insurance'];
        sessionData.photo2 = userData['photo2'];
        break;
    }

    sessionStorage.setItem(this.storageKey, JSON.stringify(sessionData));

    console.log(this.getUserData());
  }

  getUser(): Observable<any | null> {
    // Observar el estado de autenticación y obtener el email cuando el usuario está autenticado
    return authState(this.auth).pipe( //el pipe se utiliza para aplicar operadores de transformacion y manipulacion a los datos que tira el authState
      switchMap((user: User | null) => { //el switchMap remplaza el valor anterior por un nuevo observable
        if (user && user.email) {
          // Crear una consulta para encontrar el usuario por correo electrónico
          const usersCollectionRef = collection(this.firestore, 'users');
          const userQuery = query(usersCollectionRef, where('email', '==', user.email));

          // Obtener el documento del usuario que coincide con el correo
          return from(getDocs(userQuery)).pipe( //se ejecta la consulta y devuelve una promesa. Se utiliza el from para convertir la promesa en un observable
            switchMap((querySnapshot) => { //utilizamos el switchMap para acceder a los resultados de la consulta
              if (!querySnapshot.empty) {
                // Retorna los datos del primer documento encontrado
                const userData = querySnapshot.docs[0].data();
                return of({ ...userData, email: user.email }); //retornamos un observable con los datos del usuario y el campo email
              }
              return of(null); //retornamos null si no hay usuario autenticado
            })
          );
        } else {
          return of(null); //retornamos null si no hay usuario autenticado
        }
      })
    );
  }

  logOut():Observable<void> {
    const promise = signOut(this.auth);
    sessionStorage.removeItem(this.storageKey);     
    return from (promise);
  }

  public async updateVerificationStatusForAllUsers(): Promise<void> {
    const usersCollectionRef = collection(this.firestore, 'users');
    const userDocs = await getDocs(usersCollectionRef);

    for (const userDoc of userDocs.docs) {
      const userData = userDoc.data();
      const userEmail = userData['email'];
      const userAuthRef = query(collection(this.firestore, 'auth'), where('email', '==', userEmail));
      const authDocs = await getDocs(userAuthRef);
      
      for (const authDoc of authDocs.docs) {
        const authData = authDoc.data();
        if (authData && authData['emailVerified']) {
          await updateDoc(userDoc.ref, { isVerifiedEmail: true });
        }
      }
    }
  }
}
