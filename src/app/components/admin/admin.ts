import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, Usuario } from '../../services/auth.service';
import { ProductoService, Producto } from '../../services/producto.service';
import { PedidoService, Pedido } from '../../services/pedido.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class AdminComponent implements OnInit {

  usuario: Usuario | null = null;
  productos: Producto[] = [];
  pedidos: Pedido[] = [];
  cargando = false;

  // Para el formulario de productos
  vistaActual: 'dashboard' | 'productos' | 'pedidos' = 'dashboard';
  mostrarFormularioProducto = false;
  productoEnEdicion: Producto | null = null;
  formularioProducto = {
    nombre: '',
    descripcion: '',
    precio: 0,
    categoria: 'Bebidas',
    imagen: '🍽️'
  };

  categorias = ['Bebidas', 'Platos fuertes', 'Postres'];

  constructor(
    private authService: AuthService,
    private productoService: ProductoService,
    private pedidoService: PedidoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.usuario = this.authService.obtenerUsuarioActual();
    
    if (!this.usuario || this.usuario.rol !== 'admin') {
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
      this.pedidos = await this.pedidoService.obtenerPedidos();
    } catch (error) {
      console.error('Error al cargar pedidos:', error);
    }
  }

  // Métodos para gestión de vista
  cambiarVista(vista: 'dashboard' | 'productos' | 'pedidos'): void {
    this.vistaActual = vista;
    this.mostrarFormularioProducto = false;
    this.productoEnEdicion = null;
    if (vista === 'productos') {
      this.cargarProductos();
    } else if (vista === 'pedidos') {
      this.cargarPedidos();
    }
  }

  // Métodos para gestión de productos
  abrirFormularioProducto(): void {
    this.mostrarFormularioProducto = true;
    this.productoEnEdicion = null;
    this.formularioProducto = {
      nombre: '',
      descripcion: '',
      precio: 0,
      categoria: 'Bebidas',
      imagen: '🍽️'
    };
  }

  editarProducto(producto: Producto): void {
    this.mostrarFormularioProducto = true;
    this.productoEnEdicion = producto;
    this.formularioProducto = {
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio: producto.precio,
      categoria: producto.categoria,
      imagen: producto.imagen
    };
  }

  async guardarProducto(): Promise<void> {
    if (!this.formularioProducto.nombre) {
      alert('El nombre del producto es requerido');
      return;
    }

    try {
      this.cargando = true;
      if (this.productoEnEdicion) {
        // Actualizar
        await this.productoService.actualizarProducto(
          this.productoEnEdicion.id,
          this.formularioProducto
        );
        alert('✓ Producto actualizado correctamente');
      } else {
        // Crear
        await this.productoService.crearProducto(this.formularioProducto);
        alert('✓ Producto creado correctamente');
      }
      this.mostrarFormularioProducto = false;
      await this.cargarProductos();
    } catch (error) {
      console.error('Error al guardar producto:', error);
      alert('Error al guardar el producto');
    } finally {
      this.cargando = false;
    }
  }

  async eliminarProducto(id: string): Promise<void> {
    if (confirm('¿Está seguro de que desea eliminar este producto?')) {
      try {
        this.cargando = true;
        await this.productoService.eliminarProducto(id);
        alert('✓ Producto eliminado correctamente');
        await this.cargarProductos();
      } catch (error) {
        console.error('Error al eliminar producto:', error);
        alert('Error al eliminar el producto');
      } finally {
        this.cargando = false;
      }
    }
  }

  cancelarFormulario(): void {
    this.mostrarFormularioProducto = false;
    this.productoEnEdicion = null;
    this.formularioProducto = {
      nombre: '',
      descripcion: '',
      precio: 0,
      categoria: 'Bebidas',
      imagen: '🍽️'
    };
  }

  // Métodos para gestión de pedidos
  async cambiarEstadoPedido(pedido: Pedido, nuevoEstado: Pedido['estado']): Promise<void> {
    try {
      await this.pedidoService.actualizarEstadoPedido(pedido.id, nuevoEstado);
      pedido.estado = nuevoEstado;
      alert('✓ Estado del pedido actualizado');
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      alert('Error al cambiar el estado del pedido');
    }
  }

  obtenerProximoEstado(estadoActual: Pedido['estado']): Pedido['estado'] {
    const secuencia: { [key in Pedido['estado']]: Pedido['estado'] } = {
      'pendiente': 'en-preparacion',
      'en-preparacion': 'listo',
      'listo': 'entregado',
      'entregado': 'entregado'
    };
    return secuencia[estadoActual];
  }

  obtenerColorEstado(estado: Pedido['estado']): string {
    const colores: { [key in Pedido['estado']]: string } = {
      'pendiente': '#ff9800',
      'en-preparacion': '#2196f3',
      'listo': '#4caf50',
      'entregado': '#8bc34a'
    };
    return colores[estado];
  }

  obtenerEtiquetaEstado(estado: Pedido['estado']): string {
    const etiquetas: { [key in Pedido['estado']]: string } = {
      'pendiente': '⏳ Pendiente',
      'en-preparacion': '👨‍🍳 En Preparación',
      'listo': '✅ Listo',
      'entregado': '🚚 Entregado'
    };
    return etiquetas[estado];
  }

  // Métodos de utilidad
  obtenerTotalProductos(): number {
    return this.productos.length;
  }

  obtenerTotalPedidosHoy(): number {
    const hoy = new Date();
    return this.pedidos.filter(p => {
      const fecha = new Date(p.fecha);
      return fecha.toDateString() === hoy.toDateString();
    }).length;
  }

  obtenerProductosMasVendidos(): Array<{ nombre: string; cantidad: number }> {
    const ventas: { [key: string]: number } = {};
    this.pedidos.forEach(pedido => {
      pedido.items.forEach(item => {
        ventas[item.nombre] = (ventas[item.nombre] || 0) + item.cantidad;
      });
    });
    return Object.entries(ventas)
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 3);
  }

  obtenerTotalVentas(): number {
    return this.pedidos.reduce((total, pedido) => total + pedido.total, 0);
  }

  async cerrarSesion(): Promise<void> {
    await this.authService.cerrarSesion();
    this.router.navigate(['/login']);
  }
}
