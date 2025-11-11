import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, Usuario } from '../../services/auth.service';
import { Router } from '@angular/router';

interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: string;
  imagen: string;
}

interface CarritoItem extends Producto {
  cantidad: number;
}

interface Pedido {
  id: string;
  estado: 'pendiente' | 'en-preparacion' | 'listo' | 'entregado';
  total: number;
  fecha: Date;
  items: CarritoItem[];
}

@Component({
  selector: 'app-cliente',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cliente.html',
  styleUrl: './cliente.css'
})
export class ClienteComponent implements OnInit {

  usuario: Usuario | null = null;
  productos: Producto[] = [];
  carrito: CarritoItem[] = [];
  pedidos: Pedido[] = [];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.usuario = this.authService.obtenerUsuarioActual();
    
    if (!this.usuario || this.usuario.rol !== 'cliente') {
      this.router.navigate(['/login']);
      return;
    }

    this.cargarProductos();
    this.cargarPedidos();
  }

  private cargarProductos(): void {
    // Datos de ejemplo - En producción, estos vendrían de Firebase
    this.productos = [
      {
        id: '1',
        nombre: 'Bandeja Paisa',
        descripcion: 'Plato típico colombiano con carne, chicharrón y más',
        precio: 25000,
        categoria: 'Platos Principales',
        imagen: '🍖'
      },
      {
        id: '2',
        nombre: 'Ajiaco Santandereano',
        descripcion: 'Sopa tradicional con pollo, papa y verduras',
        precio: 18000,
        categoria: 'Sopas',
        imagen: '🍲'
      },
      {
        id: '3',
        nombre: 'Tamales',
        descripcion: 'Tamales caseros envueltos en hoja de plátano',
        precio: 8000,
        categoria: 'Entrada',
        imagen: '🌮'
      },
      {
        id: '4',
        nombre: 'Sancocho de Costilla',
        descripcion: 'Sancocho con costilla y verduras frescas',
        precio: 20000,
        categoria: 'Platos Principales',
        imagen: '🍲'
      },
      {
        id: '5',
        nombre: 'Empanadas',
        descripcion: 'Empanadas rellenas de carne o queso',
        precio: 5000,
        categoria: 'Entrada',
        imagen: '🥟'
      },
      {
        id: '6',
        nombre: 'Arepa con Queso',
        descripcion: 'Arepa tradicional rellena de queso derretido',
        precio: 4000,
        categoria: 'Entrada',
        imagen: '🥯'
      }
    ];
  }

  private cargarPedidos(): void {
    // Datos de ejemplo 
    this.pedidos = [
      {
        id: 'PED001',
        estado: 'entregado',
        total: 45000,
        fecha: new Date('2025-11-08'),
        items: []
      },
      {
        id: 'PED002',
        estado: 'en-preparacion',
        total: 25000,
        fecha: new Date('2025-11-09'),
        items: []
      }
    ];
  }

  agregarAlCarrito(producto: Producto): void {
    const itemExistente = this.carrito.find(item => item.id === producto.id);
    
    if (itemExistente) {
      itemExistente.cantidad++;
    } else {
      this.carrito.push({ ...producto, cantidad: 1 });
    }
  }

  eliminarDelCarrito(index: number): void {
    this.carrito.splice(index, 1);
  }

  calcularTotal(): number {
    return this.carrito.reduce((total, item) => total + (item.precio * item.cantidad), 0);
  }

  confirmarPedido(): void {
    if (this.carrito.length === 0) {
      alert('El carrito está vacío');
      return;
    }

    const total = this.calcularTotal();
    alert(`✓ Pedido confirmado!\nTotal: $${total}\nEstado: Pendiente de preparación`);

    // Aquí se enviaría a Firebase
    const nuevoPedido: Pedido = {
      id: 'PED' + Date.now(),
      estado: 'pendiente',
      total: total,
      fecha: new Date(),
      items: [...this.carrito]
    };

    this.pedidos.unshift(nuevoPedido);
    this.carrito = [];
  }

  agregarComentario(pedidoId: string): void {
    const comentario = prompt('Escribe tu comentario:');
    if (comentario) {
      alert(`✓ Comentario agregado: "${comentario}"`);
      // Aquí se enviaría a Firebase
    }
  }

  async cerrarSesion(): Promise<void> {
    await this.authService.cerrarSesion();
    this.router.navigate(['/login']);
  }
}
