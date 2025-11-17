import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, Usuario } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class NavbarComponent {
  @Input() usuario: Usuario | null = null;
  @Input() cartCount: number = 0;
  @Input() categorias: string[] = [];
  @Input() categoriaSeleccionada: string = 'todas';
  @Input() rol: 'cliente' | 'admin' | null = null;

  @Output() categoriaChange = new EventEmitter<string>();
  @Output() logout = new EventEmitter<void>();
  @Output() cartClick = new EventEmitter<void>();

  mostrarMenu = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  seleccionarCategoria(categoria: string): void {
    this.categoriaSeleccionada = categoria;
    this.categoriaChange.emit(categoria);
    this.mostrarMenu = false;
  }

  toggleMenu(): void {
    this.mostrarMenu = !this.mostrarMenu;
  }

  clicCarrito(): void {
    this.cartClick.emit();
    this.mostrarMenu = false;
  }

  async cerrarSesion(): Promise<void> {
    await this.authService.cerrarSesion();
    this.logout.emit();
  }

  irAlAdmin(): void {
    this.router.navigate(['/admin']);
  }

  irAlCliente(): void {
    this.router.navigate(['/cliente']);
  }
}
