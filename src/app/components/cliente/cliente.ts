import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, Usuario } from '../../services/auth.service';
import { ProductoService, Producto } from '../../services/producto.service';
import { PedidoService, Pedido } from '../../services/pedido.service';
import { Router } from '@angular/router';

interface CarritoItem extends Producto {
  cantidad: number;
}

@Component({
  selector: 'app-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cliente.html',
  styleUrl: './cliente.css'
})
export class ClienteComponent implements OnInit {

  usuario: Usuario | null = null;
  productos: Producto[] = [];
  carrito: CarritoItem[] = [];
  pedidos: Pedido[] = [];
  cargando = false;

  constructor(
    private authService: AuthService,
    private productoService: ProductoService,
    private pedidoService: PedidoService,
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

  private async cargarProductos(): Promise<void> {
    try {
      this.cargando = true;
      this.productos = await this.productoService.obtenerProductos();
    } catch (error) {
      console.error('Error al cargar productos:', error);
      alert('Error al cargar productos');
    } finally {
      this.cargando = false;
    }
  }

  private async cargarPedidos(): Promise<void> {
    try {
      if (this.usuario) {
        this.pedidos = await this.pedidoService.obtenerPedidosPorUsuario(this.usuario.uid);
      }
    } catch (error) {
      console.error('Error al cargar pedidos:', error);
    }
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

  async confirmarPedido(): Promise<void> {
    if (this.carrito.length === 0) {
      alert('El carrito está vacío');
      return;
    }

    if (!this.usuario) {
      alert('Error: usuario no identificado');
      return;
    }

    try {
      this.cargando = true;
      const total = this.calcularTotal();
      
      const nuevoPedido: Omit<Pedido, 'id'> = {
        uid: this.usuario.uid,
        estado: 'pendiente',
        total: total,
        fecha: new Date(),
        items: [...this.carrito]
      };

      const pedidoId = await this.pedidoService.crearPedido(nuevoPedido);
      alert(`✓ Pedido confirmado!\nID: ${pedidoId}\nTotal: $${total}\nEstado: Pendiente de preparación`);
      
      this.carrito = [];
      await this.cargarPedidos();
    } catch (error) {
      console.error('Error al confirmar pedido:', error);
      alert('Error al confirmar el pedido');
    } finally {
      this.cargando = false;
    }
  }

  agregarComentario(pedidoId: string): void {
    const comentario = prompt('Escribe tu comentario:');
    if (comentario) {
      alert(`✓ Comentario agregado: "${comentario}"`);
    }
  }

  async cerrarSesion(): Promise<void> {
    await this.authService.cerrarSesion();
    this.router.navigate(['/login']);
  }
}
