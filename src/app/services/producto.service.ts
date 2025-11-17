import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, collectionSnapshots } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: string;
  imagen: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductoService {

  private productoCollection = 'productos';

  constructor(private firestore: Firestore) {}

  /**
   * Obtiene todos los productos
   */
  async obtenerProductos(): Promise<Producto[]> {
    try {
      const q = query(collection(this.firestore, this.productoCollection));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      })) as Producto[];
    } catch (error) {
      console.error('Error al obtener productos:', error);
      return [];
    }
  }

  /**
   * Obtiene productos por categoría
   */
  async obtenerProductosPorCategoria(categoria: string): Promise<Producto[]> {
    try {
      const q = query(
        collection(this.firestore, this.productoCollection),
        where('categoria', '==', categoria)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      })) as Producto[];
    } catch (error) {
      console.error('Error al obtener productos por categoría:', error);
      return [];
    }
  }

  /**
   * Obtiene un producto por ID
   */
  async obtenerProducto(id: string): Promise<Producto | null> {
    try {
      const q = query(
        collection(this.firestore, this.productoCollection),
        where('id', '==', id)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return {
          id: doc.id,
          ...doc.data()
        } as Producto;
      }
      return null;
    } catch (error) {
      console.error('Error al obtener producto:', error);
      return null;
    }
  }

  /**
   * Crea un nuevo producto
   */
  async crearProducto(producto: Omit<Producto, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(
        collection(this.firestore, this.productoCollection),
        producto
      );
      return docRef.id;
    } catch (error) {
      console.error('Error al crear producto:', error);
      throw error;
    }
  }

  /**
   * Actualiza un producto existente
   */
  async actualizarProducto(id: string, datos: Partial<Producto>): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.productoCollection, id);
      await updateDoc(docRef, datos);
    } catch (error) {
      console.error('Error al actualizar producto:', error);
      throw error;
    }
  }

  /**
   * Elimina un producto
   */
  async eliminarProducto(id: string): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.productoCollection, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      throw error;
    }
  }
}
