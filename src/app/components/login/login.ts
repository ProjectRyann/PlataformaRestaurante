import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent implements OnInit {

  formularioLoginCliente!: FormGroup;
  formularioRegistroCliente!: FormGroup;

  vistaActual: 'login-cliente' | 'registro-cliente' = 'login-cliente';
  cargando = false;
  mensajeError = '';

  mostrarPasswordCliente = false;
  mostrarPasswordRegistro = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.inicializarFormularios();
  }

  ngOnInit(): void {
    // Si ya hay un usuario autenticado, redirigir
    if (this.authService.obtenerUsuarioActual()) {
      const rol = this.authService.obtenerRolActual();
      if (rol === 'admin') {
        this.router.navigate(['/admin']);
      } else {
        this.router.navigate(['/cliente']);
      }
    }
  }

  private inicializarFormularios(): void {
    this.formularioLoginCliente = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      contraseña: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.formularioRegistroCliente = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      contraseña: ['', [Validators.required, Validators.minLength(6)]],
      nombre: [''],
      apellido: ['']
    });

    // No hay formulario de login por contraseña para admin: el acceso de admin se realiza solo por Google
  }

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
    if (this.formularioLoginCliente.invalid) {
      return;
    }

    this.cargando = true;
    this.mensajeError = '';

    try {
      const { email, contraseña } = this.formularioLoginCliente.value;
      await this.authService.iniciarSesionConCorreo(email, contraseña);
      
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
    if (this.formularioRegistroCliente.invalid) {
      return;
    }

    this.cargando = true;
    this.mensajeError = '';

    try {
      const { email, contraseña, nombre, apellido } = this.formularioRegistroCliente.value;
      
      await this.authService.registrarConCorreo(
        email,
        contraseña,
        'cliente',
        { nombre, apellido }
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
