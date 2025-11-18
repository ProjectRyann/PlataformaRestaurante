import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, Usuario } from '../../services/auth.service';
import { ProductoService, Producto } from '../../services/producto.service';
import { PedidoService, Pedido } from '../../services/pedido.service';
import { Router } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar';

interface CarritoItem extends Producto {
  cantidad: number;
}

@Component({
  selector: 'app-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './cliente.html',
  styleUrl: './cliente.css'
})
export class ClienteComponent implements OnInit {

  usuario: Usuario | null = null;
  productos: Producto[] = [];
  productosFiltered: Producto[] = [];
  carrito: CarritoItem[] = [];
  pedidos: Pedido[] = [];
  cargando = false;

  categorias: string[] = ['Bebidas', 'Platos fuertes', 'Postres', 'Entradas', 'Ensaladas'];
  categoriaSeleccionada: string = 'todas';

  productoSeleccionado: Producto | null = null;
  mostrarModalDetalles = false;
  // Para mostrar detalles de un pedido enviado
  pedidoSeleccionado: Pedido | null = null;
  mostrarModalPedido = false;

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
      this.aplicarFiltro();
    } catch (error) {
      console.error('Error al cargar productos:', error);
      alert('Error al cargar productos');
    } finally {
      this.cargando = false;
    }
  }

  cambiarCategoria(categoria: string): void {
    this.categoriaSeleccionada = categoria;
    this.aplicarFiltro();
  }

  private aplicarFiltro(): void {
    if (this.categoriaSeleccionada === 'todas') {
      this.productosFiltered = [...this.productos];
    } else {
      this.productosFiltered = this.productos.filter(
        p => p.categoria === this.categoriaSeleccionada
      );
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
      alert(`Pedido confirmado!\nID: ${pedidoId}\nTotal: $${total}\nEstado: Pendiente de preparación`);
      
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
    (async () => {
      try {
        const pedido = this.pedidos.find(p => p.id === pedidoId);
        if (!pedido) {
          alert('Pedido no encontrado');
          return;
        }

        // Si ya existe un comentario, no permitir otro
        if ((pedido as any).comentario) {
          alert('Ya se dejó un comentario para este pedido');
          return;
        }

        const texto = prompt('Escribe tu comentario:');
        if (!texto) {
          return;
        }

        if (!this.usuario) {
          alert('Debes iniciar sesión para dejar un comentario');
          return;
        }

        const nuevoComentario = {
          uid: this.usuario.uid,
          texto: texto,
          fecha: new Date()
        };

        await this.pedidoService.agregarComentarioPedido(pedidoId, nuevoComentario);

        // Actualizar pedido localmente para reflejar el comentario sin recargar todo
        pedido.comentario = nuevoComentario as any;

        alert(`Comentario agregado: "${texto}"`);
      } catch (error) {
        console.error('Error al agregar comentario:', error);
        alert('Error al agregar el comentario');
      }
    })();
  }

  async cerrarSesion(): Promise<void> {
    await this.authService.cerrarSesion();
    this.router.navigate(['/login']);
  }

  irAlCarrito(): void {
    const carritoElement = document.getElementById('cart-section');
    if (carritoElement) {
      carritoElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  abrirDetalles(producto: Producto): void {
    this.productoSeleccionado = producto;
    this.mostrarModalDetalles = true;
  }

  cerrarDetalles(): void {
    this.mostrarModalDetalles = false;
    this.productoSeleccionado = null;
  }

  abrirDetallesPedido(pedido: Pedido): void {
    this.pedidoSeleccionado = pedido;
    this.mostrarModalPedido = true;
  }

  cerrarDetallesPedido(): void {
    this.mostrarModalPedido = false;
    this.pedidoSeleccionado = null;
  }
}
