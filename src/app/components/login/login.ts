import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { filter, take } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent implements OnInit {

  // Modelos para template-driven forms
  loginModel = {
    email: '',
    contrasena: ''
  };

  registerModel = {
    nombre: '',
    apellido: '',
    email: '',
    contrasena: ''
  };

  vistaActual: 'login-cliente' | 'registro-cliente' = 'login-cliente';
  cargando = false;
  mensajeError = '';

  mostrarPasswordCliente = false;
  mostrarPasswordRegistro = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Espera a que el servicio termine de verificar la sesión antes de redirigir
    this.authService.cargando$.pipe(
      filter(cargando => cargando === false),
      take(1)
    ).subscribe(() => {
      const usuario = this.authService.obtenerUsuarioActual();
      if (usuario) {
        const rol = this.authService.obtenerRolActual();
        if (rol === 'admin') {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/cliente']);
        }
      }
    });
  }

  // No usamos Reactive Forms: template-driven con ngModel

  cambiarVista(vista: 'login-cliente' | 'registro-cliente'): void {
    this.vistaActual = vista;
    this.mensajeError = '';
  }

  async iniciarSesionGoogle(): Promise<void> {
    this.cargando = true;
    this.mensajeError = '';

    try {
      const usuario = await this.authService.iniciarSesionConGoogle();
      const email = (usuario?.email || '').toLowerCase();

      // Normalizar lista de admins
      const admins = (environment.adminEmails || []).map((e) => e.toLowerCase());

      if (admins.includes(email)) {
        // Si el usuario aún no tiene rol admin en Firestore, asignarlo
        if (usuario.rol !== 'admin') {
          await this.authService.asignarRolAdmin(usuario.uid);
        }
        this.router.navigate(['/admin']);
      } else {
        this.router.navigate(['/cliente']);
      }
    } catch (error: any) {
      this.mensajeError = error.message || 'Error al iniciar sesión con Google';
      console.error(error);
    } finally {
      this.cargando = false;
    }
  }

  async loginClienteCorreo(): Promise<void> {
    // Validación básica en cliente (se confía en la validación del formulario en plantilla)
    if (!this.loginModel.email || this.loginModel.contrasena.length < 6) {
      this.mensajeError = 'Ingresa correo y contraseña válidos (mín. 6 caracteres)';
      return;
    }

    this.cargando = true;
    this.mensajeError = '';

    try {
  await this.authService.iniciarSesionConCorreo(this.loginModel.email, this.loginModel.contrasena);
      
      const usuario = this.authService.obtenerUsuarioActual();
      if (usuario?.rol !== 'cliente') {
        await this.authService.cerrarSesion();
        this.mensajeError = 'Este usuario no es un cliente';
        return;
      }

      this.router.navigate(['/cliente']);
    } catch (error: any) {
      this.mensajeError = error.message || 'Error al iniciar sesión';
      console.error(error);
    } finally {
      this.cargando = false;
    }
  }

  async registroClienteCorreo(): Promise<void> {
    // Validación básica
    if (!this.registerModel.email || this.registerModel.contrasena.length < 6) {
      this.mensajeError = 'Ingresa un correo válido y una contraseña (mín. 6 caracteres)';
      return;
    }

    this.cargando = true;
    this.mensajeError = '';

    try {
      await this.authService.registrarConCorreo(
        this.registerModel.email,
        this.registerModel.contrasena,
        'cliente',
        { nombre: this.registerModel.nombre, apellido: this.registerModel.apellido }
      );

      this.router.navigate(['/cliente']);
    } catch (error: any) {
      this.mensajeError = error.message || 'Error al registrarse';
      console.error(error);
    } finally {
      this.cargando = false;
    }
  }

  // El login de administrador por contraseña fue removido: admin debe ingresar mediante Google
}
