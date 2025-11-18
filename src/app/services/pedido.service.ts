import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where } from '@angular/fire/firestore';
import { ProductoService, Producto } from './producto.service';

export interface Pedido {
  id: string;
  uid: string;
  estado: 'pendiente' | 'en-preparacion' | 'listo' | 'entregado';
  total: number;
  fecha: Date;
  items: Array<Producto & { cantidad: number }>;
  comentario?: { uid: string; texto: string; fecha: Date } | null;
}

@Injectable({
  providedIn: 'root'
})
export class PedidoService {

  private pedidoCollection = 'pedidos';

  constructor(
    private firestore: Firestore,
    private productoService: ProductoService
  ) {}

  /**
   * Obtiene todos los pedidos
   */
  async obtenerPedidos(): Promise<Pedido[]> {
    try {
      const q = query(collection(this.firestore, this.pedidoCollection));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          fecha: data['fecha']?.toDate ? data['fecha'].toDate() : new Date(data['fecha'])
        } as Pedido;
      });
    } catch (error) {
      console.error('Error al obtener pedidos:', error);
      return [];
    }
  }

  /**
   * Obtiene pedidos de un usuario específico
   */
  async obtenerPedidosPorUsuario(uid: string): Promise<Pedido[]> {
    try {
      const q = query(
        collection(this.firestore, this.pedidoCollection),
        where('uid', '==', uid)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          fecha: data['fecha']?.toDate ? data['fecha'].toDate() : new Date(data['fecha'])
        } as Pedido;
      });
    } catch (error) {
      console.error('Error al obtener pedidos del usuario:', error);
      return [];
    }
  }

  /**
   * Crea un nuevo pedido
   */
  async crearPedido(pedido: Omit<Pedido, 'id'>): Promise<string> {
    try {
      const pedidoData = {
        ...pedido,
        fecha: new Date()
      };
      const docRef = await addDoc(
        collection(this.firestore, this.pedidoCollection),
        pedidoData
      );
      return docRef.id;
    } catch (error) {
      console.error('Error al crear pedido:', error);
      throw error;
    }
  }

  /**
   * Actualiza el estado de un pedido
   */
  async actualizarEstadoPedido(id: string, nuevoEstado: Pedido['estado']): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.pedidoCollection, id);
      await updateDoc(docRef, { estado: nuevoEstado });
    } catch (error) {
      console.error('Error al actualizar estado del pedido:', error);
      throw error;
    }
  }

  /**
   * Actualiza un pedido
   */
  async actualizarPedido(id: string, datos: Partial<Pedido>): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.pedidoCollection, id);
      await updateDoc(docRef, datos);
    } catch (error) {
      console.error('Error al actualizar pedido:', error);
      throw error;
    }
  }

  /**
   * Elimina un pedido
   */
  async eliminarPedido(id: string): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.pedidoCollection, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error al eliminar pedido:', error);
      throw error;
    }
  }

  /**
   * Agrega un comentario a un pedido (solo un comentario por pedido)
   */
  async agregarComentarioPedido(id: string, comentario: { uid: string; texto: string; fecha: Date }): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.pedidoCollection, id);
      await updateDoc(docRef, { comentario });
    } catch (error) {
      console.error('Error al agregar comentario al pedido:', error);
      throw error;
    }
  }
}
