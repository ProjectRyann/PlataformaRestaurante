import { Injectable } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, signInWithPopup, GoogleAuthProvider, setPersistence, browserLocalPersistence } from '@angular/fire/auth';
import { Firestore, collection, query, where, getDocs, setDoc, doc, getDoc } from '@angular/fire/firestore';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Usuario {
  uid: string;
  email: string;
  nombre?: string;
  rol: 'cliente' | 'admin';
  apellido?: string;
  telefono?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  
  private usuarioSubject = new BehaviorSubject<Usuario | null>(null);
  public usuario$: Observable<Usuario | null> = this.usuarioSubject.asObservable();
  
  private cargandoSubject = new BehaviorSubject<boolean>(true);
  public cargando$: Observable<boolean> = this.cargandoSubject.asObservable();

  constructor(private auth: Auth, private firestore: Firestore) {
    this.inicializarPersistencia();
  }

  /**
   * Asigna el rol de admin a un usuario (actualiza Firestore y el sujeto local)
   */
  async asignarRolAdmin(uid: string): Promise<Usuario | null> {
    try {
      const docRef = doc(this.firestore, 'usuarios', uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const datos = docSnap.data() as Usuario;
        const actualizado: Usuario = { ...datos, rol: 'admin' };
        await setDoc(docRef, actualizado, { merge: true });
        this.usuarioSubject.next(actualizado);
        return actualizado;
      }

      return null;
    } catch (error) {
      console.error('Error asignando rol admin:', error);
      return null;
    }
  }

  /**
   * Inicializa la persistencia local para mantener la sesión
   */
  private inicializarPersistencia(): void {
    setPersistence(this.auth, browserLocalPersistence)
      .then(() => {
        this.verificarSesion();
      })
      .catch((error) => {
        console.error('Error al establecer persistencia:', error);
        // Aún así verifica la sesión aunque falle la persistencia
        this.verificarSesion();
      });
  }

  /**
   * Verifica si hay una sesión activa y mantiene la persistencia
   */
  private verificarSesion(): void {
    this.auth.onAuthStateChanged(async (usuario) => {
      if (usuario) {
        const usuarioDatos = await this.obtenerDatosUsuario(usuario.uid);
        this.usuarioSubject.next(usuarioDatos);
        this.cargandoSubject.next(false);
      } else {
        this.usuarioSubject.next(null);
        this.cargandoSubject.next(false);
      }
    });
  }

  /**
   * Obtiene los datos del usuario desde Firestore
   */
  private async obtenerDatosUsuario(uid: string): Promise<Usuario | null> {
    try {
      const docRef = doc(this.firestore, 'usuarios', uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as Usuario;
      }
      return null;
    } catch (error) {
      console.error('Error obteniendo datos del usuario:', error);
      return null;
    }
  }

  /**
   * Registra un nuevo usuario con correo y contraseña
   */
  async registrarConCorreo(email: string, contraseña: string, rol: 'cliente' | 'admin', datos?: Partial<Usuario>): Promise<void> {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, contraseña);
      
      const usuario: Usuario = {
        uid: userCredential.user.uid,
        email: userCredential.user.email || email,
        rol: rol,
        nombre: datos?.nombre || '',
        apellido: datos?.apellido || '',
        telefono: datos?.telefono || ''
      };

      await setDoc(doc(this.firestore, 'usuarios', userCredential.user.uid), usuario);
      this.usuarioSubject.next(usuario);
    } catch (error: any) {
      throw new Error(this.traducirErrorAuth(error.code));
    }
  }

  /**
   * Inicia sesión con correo y contraseña
   */
  async iniciarSesionConCorreo(email: string, contraseña: string): Promise<void> {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, contraseña);
      const usuarioDatos = await this.obtenerDatosUsuario(userCredential.user.uid);
      this.usuarioSubject.next(usuarioDatos);
    } catch (error: any) {
      throw new Error(this.traducirErrorAuth(error.code));
    }
  }

  /**
   * Inicia sesión con Google
   * Retorna el Usuario (creado o existente) para que el llamador pueda verificar el rol / email
   */
  async iniciarSesionConGoogle(): Promise<Usuario> {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(this.auth, provider);

      // Verificar si el usuario ya existe en Firestore
      const usuarioDatos = await this.obtenerDatosUsuario(result.user.uid);

      if (!usuarioDatos) {
        // Si no existe, crear nuevo documento de usuario como cliente
        const nuevoUsuario: Usuario = {
          uid: result.user.uid,
          email: result.user.email || '',
          nombre: result.user.displayName?.split(' ')[0] || '',
          apellido: result.user.displayName?.split(' ').slice(1).join(' ') || '',
          rol: 'cliente'
        };

        await setDoc(doc(this.firestore, 'usuarios', result.user.uid), nuevoUsuario);
        this.usuarioSubject.next(nuevoUsuario);
        return nuevoUsuario;
      } else {
        this.usuarioSubject.next(usuarioDatos);
        return usuarioDatos;
      }
    } catch (error: any) {
      throw new Error('Error al iniciar sesión con Google: ' + (error?.message || error));
    }
  }

  /**
   * Cierra sesión
   */
  async cerrarSesion(): Promise<void> {
    try {
      await signOut(this.auth);
      this.usuarioSubject.next(null);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      throw error;
    }
  }

  /**
   * Obtiene el usuario actual
   */
  obtenerUsuarioActual(): Usuario | null {
    return this.usuarioSubject.value;
  }

  /**
   * Obtiene el rol del usuario actual
   */
  obtenerRolActual(): 'cliente' | 'admin' | null {
    return this.usuarioSubject.value?.rol || null;
  }

  /**
   * Traduce códigos de error de Firebase a mensajes en español
   */
  private traducirErrorAuth(codigo: string): string {
    const errores: { [key: string]: string } = {
      'auth/email-already-in-use': 'Este correo ya está registrado',
      'auth/invalid-email': 'Correo inválido',
      'auth/operation-not-allowed': 'Operación no permitida',
      'auth/weak-password': 'La contraseña es muy débil (mín. 6 caracteres)',
      'auth/user-disabled': 'Usuario deshabilitado',
      'auth/user-not-found': 'Usuario no encontrado',
      'auth/wrong-password': 'Contraseña incorrecta',
      'auth/invalid-credential': 'Credenciales inválidas',
      'auth/too-many-requests': 'Demasiados intentos de acceso. Intenta más tarde'
    };
    return errores[codigo] || 'Error de autenticación: ' + codigo;
  }
}
