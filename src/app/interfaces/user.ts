export interface User {
    name: string;
    surname: string;
    age: number;
    dni: number;
    email: string;
    password: string;
    photo: string;
    role: string;
}

export interface Specialist extends User {
    specialities: string[];
    isVerifiedEmail: boolean;
    isVerifiedAdmin: boolean;
}

  export interface Patient extends User {
    insurance: string;
    photo2: string;
    isVerifiedEmail: boolean;
}