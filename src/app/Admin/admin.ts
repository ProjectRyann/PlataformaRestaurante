// Importamos decoradores y herramientas de Angular y Firebase
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms'; // Para usar [(ngModel)]
import { CommonModule } from '@angular/common'; // Para usar *ngFor, *ngIf

// Importaciones necesarias de Firebase para Firestore
import {
  Firestore,
  collection,
  addDoc,
  collectionData
} from '@angular/fire/firestore';

// Importamos Observable para manejar datos en tiempo real
import { Observable } from 'rxjs';

// Definimos el componente
@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './admin.html',
})
export class Admin {

  // Modelo vinculado al input de texto
  texto: string = '';

  // Inyectamos Firestore de forma moderna (sin usar constructor)
  firestore: Firestore = inject(Firestore);

  // Observable que contiene todas las notas en tiempo real
  notas$: Observable<any[]>;

  constructor() {
    // Referencia a la colección 'notas' en Firestore
    const notasRef = collection(this.firestore, 'notas');

    // Obtenemos los datos en tiempo real con sus IDs
    this.notas$ = collectionData(notasRef, { idField: 'id' });
  }

  // Función para guardar una nueva nota
  guardarNota() {
    const notasRef = collection(this.firestore, 'notas');

    // Verifica que el texto no esté vacío
    if (this.texto.trim() === '') {
      alert('⚠️ Escribe una nota antes de guardar.');
      return;
    }

    // Agrega el nuevo documento a Firestore
    addDoc(notasRef, { contenido: this.texto })
      .then(() => {
        alert('✅ Nota guardada correctamente.');
        this.texto = ''; // Limpiamos el campo
      })
      .catch((error) => {
        console.error('❌ Error al guardar la nota:', error);
        alert('❌ Hubo un error al guardar la nota.');
      });
  }
}