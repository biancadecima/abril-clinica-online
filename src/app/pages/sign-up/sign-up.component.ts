import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule, FormsModule, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { addDoc, collection, Firestore } from '@angular/fire/firestore';
import Swal from 'sweetalert2'
import { uploadBytesResumable } from 'firebase/storage';
import { Storage, getDownloadURL, ref, uploadBytes} from '@angular/fire/storage';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { RecaptchaModule, RecaptchaFormsModule } from 'ng-recaptcha';

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [FormsModule, CommonModule, ReactiveFormsModule, RecaptchaModule, RecaptchaFormsModule],
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.scss'
})
export class SignUpComponent implements OnInit{
  form!: FormGroup;
  formPatient!: FormGroup;
  formSpecialist!: FormGroup;
  formAdmin!: FormGroup;
  submitted: boolean = false;
  selectedFileOne: File | null = null;
  selectedFileTwo: File | null = null;
  msjError: string = "";
  selectedRole: string = '';
  specialities: string[] = [];;
  userData: any;
  isAdmin : boolean = false;
  isRoleSelected: boolean = false;
  newSpecialities: string[] = []; 
  captchaToken: string | null = null;

  constructor(private fb:FormBuilder, private router: Router, private firestore: Firestore, 
    private storage: Storage, private authService: AuthService, private userService:UserService){}

  ngOnInit(): void {
    this.userData = this.authService.getUserData();
    console.log("data del user: "+this.userData);
      
    this.loadSpecialities();

    this.formPatient = this.fb.group({
      name: ['', [Validators.pattern('^[a-zA-Z]+$'), Validators.required]],
      surname: ['', [Validators.pattern('^[a-zA-Z]+$'), Validators.required]],
      dni: ['', [Validators.pattern('^[0-9]*$'), Validators.minLength(8), Validators.maxLength(8), Validators.required]],
      age: ['', [Validators.required, Validators.min(0), Validators.max(99)]],
      insurance: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      photo: ['', [Validators.required]],
      photo2: ['', [Validators.required]]
    });

    this.formSpecialist = this.fb.group({
      name: ['', [Validators.pattern('^[a-zA-Z]+$'), Validators.required]],
      surname: ['', [Validators.pattern('^[a-zA-Z]+$'), Validators.required]],
      dni: ['', [Validators.pattern('^[0-9]*$'), Validators.minLength(8), Validators.maxLength(8), Validators.required]],
      age: ['', [Validators.required, Validators.min(18), Validators.max(99)]],
      specialities: this.fb.array([], Validators.required),
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      photo: ['', [Validators.required]]
    });

    this.formAdmin = this.fb.group({
      name: ['', [Validators.pattern('^[a-zA-Z]+$'), Validators.required]],
      surname: ['', [Validators.pattern('^[a-zA-Z]+$'), Validators.required]],
      dni: ['', [Validators.pattern('^[0-9]*$'), Validators.minLength(8), Validators.maxLength(8), Validators.required]],
      age: ['', [Validators.required, Validators.min(18), Validators.max(99)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      photo: ['', [Validators.required]]
    });

    this.selectedRole = 'Paciente'; // comienza con el rol de paciente predeterminado
    this.form = this.formPatient; // comienza con el form de paciente predeterminado
  }   

  onCaptchaResolved(token: string): void { // TODO conexion con el token
    this.captchaToken = token; // Guarda el token generado por el reCAPTCHA
    console.log('Captcha resuelto con token:', token);
  }

  addSpeciality(newSpeciality: string): void 
   {
    if (newSpeciality && !this.specialities.includes(newSpeciality.trim())) {
      this.newSpecialities.push(newSpeciality);
      this.specialities.push(newSpeciality.trim());
      this.msjError = "";
    }
    else if(newSpeciality == "")
    {
      this.msjError = "No se pudo agregar la especialidad"
    }
    else
    {
      this.msjError = "Esa especialidad ya se encuentra en la lista";
    }
  }

  onSpecialityChange(event: any): void {
    const specialitiesArray = this.formSpecialist.get('specialities') as FormArray;
  
    if (event.target.checked) {
      // Agrega la especialidad al FormArray si está seleccionada
      specialitiesArray.push(new FormControl(event.target.value));
    } else {
      // Encuentra y elimina la especialidad del FormArray si se deselecciona
      const index = specialitiesArray.controls.findIndex((control: { value: any; }) => control.value === event.target.value);
      if (index > -1) {
        specialitiesArray.removeAt(index);
      }
    }
  }

  selectRole(role: string): void {
    this.selectedRole = role;
    this.isRoleSelected = true; // Muestra las pestañas y oculta los botones de selección
  
    // Configura el formulario según el rol seleccionado
    
    if (role === 'Paciente') {
      this.form = this.formPatient;
    } else if (role === 'Especialista') {
      this.form = this.formSpecialist;
      console.log(this.form);
    } else if (role === 'Admin') {
      this.form = this.formAdmin;
    }

    setTimeout(() => this.onTabChange(role), 0); 
  }

  onTabChange(tab: string): void {
    if (tab === 'Paciente') {
      this.form = this.formPatient;
      this.selectedRole = 'Paciente'; // Asigna el rol correspondiente
      this.msjError = ""
      console.log(this.selectedRole);
    } else if (tab === 'Especialista') {
      this.form = this.formSpecialist;
      this.selectedRole = 'Especialista'; // Asigna el rol correspondiente
      this.msjError = ""
    }
    else if (tab === 'Admin') {
      this.form = this.formAdmin;
      this.selectedRole = 'Admin'; // Asigna el rol correspondiente
      console.log(this.selectedRole);
    }
  }

  async loadSpecialities(): Promise<void> {
    try {
      this.specialities = await this.userService.getSpecialities();
      console.log("especialidades: " + this.specialities); // Verifica que has obtenido las especialidades correctamente
    } catch (error) {
      console.error('Error al cargar las especialidades:', error);
    }
  }

  get name() {
    return this.form.get('name');
  }

  get surname() {
    return this.form.get('surname');
  }

  get dni() {
    return this.form.get('dni');
  }

  get age() {
    return this.form.get('age');
  }

  get insurance() {
    return this.form.get('insurance');
  }

  get email() {
    return this.form.get('email');
  }

  get password() {
    return this.form.get('password');
  }

  get photo(){
    return this.form.get('photo');
  }

  get photo2(){
    return this.form.get('photo2');
  }

  submitForm(): void {
    this.submitted = true; // Marca el formulario como enviado
  
    if (this.form.invalid) {
      // Si el formulario es inválido, no hacer nada
      console.log('Formulario inválido');
      return;
    }

    if(!this.captchaToken)
    {
      this.msjError = "Validar Captcha";
      return;
    }

    if(this.selectedRole == "Paciente")
    {
      this.signUpPatient();
    }
    else if(this.selectedRole == "Especialista")
    {
      this.signUpSpecialist();
    }
    else if(this.selectedRole == "Admin")
    {
      this.signUpAdmin();
    }
  }

  runRecaptcha(token: any){
    this.captchaToken = token;
    console.log('Token recibido del reCAPTCHA:', this.captchaToken);
  }

  signUpAdmin() : void{
    if (this.selectedFileOne)
      {
        this.authService.register(this.form.get('email')?.value, this.form.get('password')?.value, true)
        .then((userCredential) => {

          // Solo se procede si el registro fue exitoso
          const filePathOne = `photos/${this.selectedFileOne!.name}`;
          const fileRefOne = ref(this.storage, filePathOne);
          const uploadTaskOne = uploadBytesResumable(fileRefOne, this.selectedFileOne!);
  
          // Subir ambos archivos
          return Promise.all([
            this.fileHandler(uploadTaskOne, 'photo')
          ]).then(async () => {
            // Después de subir archivos, guardar los datos en Firestore
            const col = collection(this.firestore, 'users');
            console.log(this.selectedRole);
            await addDoc(col, {
              email: this.form.value.email,
              password: this.form.value.password,
              name: this.form.value.name,
              surname: this.form.value.surname,
              dni: this.form.value.dni,
              age: this.form.value.age,
              photo: this.form.value.fotoUno,
              role: this.selectedRole,
            });
  
            // Mostrar mensaje de éxito
            Swal.fire({
              icon: 'success',
              title: 'Usuario registrado y archivos cargados con éxito',
              confirmButtonText: 'Aceptar',
              reverseButtons: true,
              allowOutsideClick: false,
            }).then((r) => {
              if (r.isConfirmed) {//si acepta el mensaje de exito reinicia la pagina
                this.resetPage();
              }
            });
          });
        })
        .catch((error) => {
          // Manejo de errores en el registro
          console.error('Error de Firebase:', error); // Mostrar error completo en la consola
          
          this.errorMessage(error)
        });
      }
  }

  signUpSpecialist() : void{
    if (this.selectedFileOne)
    {
      this.authService.register(this.form.get('email')?.value, this.form.get('password')?.value, this.userData)
      .then((userCredential) => {
        // Solo se procede si el registro fue exitoso
        const filePathOne = `photos/${this.selectedFileOne!.name}`;
        const fileRefOne = ref(this.storage, filePathOne);
        const uploadTaskOne = uploadBytesResumable(fileRefOne, this.selectedFileOne!);

        // Subir ambos archivos
        return Promise.all([
          this.fileHandler(uploadTaskOne, 'photo')
        ]).then(async () => {
          // Después de subir archivos, guardar los datos en Firestore
          const col = collection(this.firestore, 'users');

          const userData = {
            email: this.form.value.email,
            password: this.form.value.password,
            name: this.form.value.name,
            surname: this.form.value.surname,
            dni: this.form.value.dni,
            age: this.form.value.age,
            specialities: this.form.value.specialities,
            photo: this.form.value.photo,
            role: this.selectedRole,
            isVerifiedEmail: false,
            isVerifiedAdmin: false
          };
          
          // Ajusta los campos específicos si el usuario es Admin
          if (this.userData?.role === "Admin") {
            userData.isVerifiedEmail = true;
            userData.isVerifiedAdmin = true;
          }
          
          // Agrega el documento a la colección
          await addDoc(col, userData);
          await this.userService.saveSpecialities(this.newSpecialities);

          // Mostrar mensaje de éxito
          if(!userData.isVerifiedEmail && !userData.isVerifiedAdmin)
          {
            Swal.fire({
              icon: 'success',
              title: 'Usuario registrado, debe verificar el mail y ser verificado por un admin',
              confirmButtonText: 'Login',
              cancelButtonText: 'Volver Atrás',
              showCancelButton: true,
              reverseButtons: true,
              allowOutsideClick: false,
            }).then((r) => {
              if (r.isConfirmed) {
                this.goLogIn();//luego de registrarse tiene que loguearse
              } else {
                this.goHome();
              }
            });
          }
          else
          {
            Swal.fire({
              icon: 'success',
              title: 'Especialista registrado y archivos cargados con éxito',
              confirmButtonText: 'Aceptar',
              reverseButtons: true,
              allowOutsideClick: false,
            }).then((r) => {
              if (r.isConfirmed) {
                this.resetPage();
              }
            });
          }
        });
      })
      .catch((error) => {
        // Manejo de errores en el registro
        console.error('Error de Firebase:', error); // Mostrar error completo en la consola
        
        this.errorMessage(error)
      });
    }
  }

  signUpPatient() : void{
    if (this.selectedFileOne && this.selectedFileTwo) {
      if (this.selectedFileOne.name !== this.selectedFileTwo.name) {
        // Llamamos a register para registrar el usuario

        this.authService.register(this.form.get('email')?.value, this.form.get('password')?.value, this.userData)
          .then((userCredential) => {
            // Solo se procede si el registro fue exitoso
            const filePathOne = `photos/${this.selectedFileOne!.name}`;
            const fileRefOne = ref(this.storage, filePathOne);
            const uploadTaskOne = uploadBytesResumable(fileRefOne, this.selectedFileOne!);
    
            const filePathTwo = `photos/${this.selectedFileTwo!.name}`;
            const fileRefTwo = ref(this.storage, filePathTwo);
            const uploadTaskTwo = uploadBytesResumable(fileRefTwo, this.selectedFileTwo!);
    
            // Subir ambos archivos
            return Promise.all([
              this.fileHandler(uploadTaskOne, 'photo'),
              this.fileHandler(uploadTaskTwo, 'photo2')
            ]).then(async () => {
              // Después de subir archivos, guardar los datos en Firestore
              const col = collection(this.firestore, 'users');
              console.log(this.selectedRole);

            const userData = {
              email: this.form.value.email,
              password: this.form.value.password,
              name: this.form.value.name,
              surname: this.form.value.surname,
              dni: this.form.value.dni,
              age: this.form.value.age,
              insurance: this.form.value.insurance,
              photo: this.form.value.photo,
              photo2: this.form.value.photo2,
              role: this.selectedRole,
              isVerifiedEmail: false,
            };

                      // Ajusta los campos específicos si el usuario es Admin
            if (this.userData?.role === "Admin") {
              userData.isVerifiedEmail = true;// si el registro lo hace el admin, el usuario ya está validado
            }
            
            // Agrega el documento a la colección
            await addDoc(col, userData);
  
            // Mostrar mensaje de éxito
            if(!userData.isVerifiedEmail)
              {
                Swal.fire({
                  icon: 'success',
                  title: 'Usuario registrado, Debe verificar el mail',
                  confirmButtonText: 'Login',
                  cancelButtonText: 'Volver Atrás',
                  showCancelButton: true,
                  reverseButtons: true,
                  allowOutsideClick: false,
                }).then((r) => {
                  if (r.isConfirmed) {
                    this.goLogIn();
                  } else {
                    this.goHome();
                  }
                });
              }
              else
              {
                Swal.fire({
                  icon: 'success',
                  title: 'Paciente registrado y archivos cargados con éxito',
                  confirmButtonText: 'Aceptar',
                  reverseButtons: true,
                  allowOutsideClick: false,
                }).then((r) => {
                  if (r.isConfirmed) {
                    this.resetPage();
                  }
                });
              }

            });
          })
          .catch((error) => {
            // Manejo de errores en el registro
            console.error('Error de Firebase:', error); // Mostrar error completo en la consola
            
            this.errorMessage(error)
          });
      } else {
        this.msjError = "La foto debe ser distinta";
      }
    }
    
  }

  errorMessage(error: any) : void{
    switch (error.code) {
      case "auth/invalid-email":
        this.msjError = "Email inválido";
        break;
      case "auth/email-already-in-use":
        this.msjError = "Email ya en uso";
        break;
      case "auth/missing-password":
        this.msjError = "Faltan completar campos";
        break;
      case "auth/weak-password":
        this.msjError = "La contraseña es demasiado débil";
        break;      
      default:
        this.msjError = `Error desconocido: ${error.message}`; // Mostrar mensaje de error completo
        break;
    }
  }

  fileHandler(uploadTask: any, controlName: string): Promise<void> { //TODO entender manejador
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot: any) => {
          // Puedes manejar el progreso aquí si es necesario
        },
        (error: any) => {
          console.error(`Error durante la subida del archivo ${controlName}:`, error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: `Hubo un problema al subir ${controlName}. Inténtalo de nuevo.`,
            confirmButtonText: 'Entendido',
          });
          reject(error);
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            this.form.patchValue({ [controlName]: downloadUrl }); // Actualizamos el formulario con la URL de la imagen subida
            resolve();
          } catch (error) {
            console.log("entre a este errror de la foto");
          }
        }
      );
    });
  }

  saveFirstPhoto(event: any) {
    this.selectedFileOne = event.target.files[0];
    if (this.selectedFileOne) {
      this.form.get('photo')?.setValue(this.selectedFileOne.name);
      this.form.get('photo')?.updateValueAndValidity();
    }
  }

  saveSecondPhoto(event: any) {
    this.selectedFileTwo = event.target.files[0];
    if (this.selectedFileTwo) {
      this.form.get('photo2')?.setValue(this.selectedFileTwo.name);
      this.form.get('photo2')?.updateValueAndValidity();
    }
  }


  resetPage(){
    window.location.reload();
  }

  goLogIn()
  {
    this.router.navigateByUrl('/ingresar');
  }


  goHome()
  {
    this.router.navigateByUrl('/home');
  }
  
}
