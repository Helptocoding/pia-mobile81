import { Component, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AlertController, ToastController, IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonLabel, IonItemSliding, IonItemOptions, IonItemOption,
  IonIcon, IonFab, IonFabButton, IonRefresher, IonRefresherContent, IonSpinner,
  IonModal, IonButtons, IonButton, IonSelect, IonSelectOption, IonSearchbar,
  IonBadge, IonBackButton,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, ribbon, trash } from 'ionicons/icons';
import { Inscripcion } from '../../models/inscripcion.model';
import { Alumno } from '../../models/alumno.model';
import { Materia } from '../../models/materia.model';
import { InscripcionService } from '../../services/inscripcion.service';
import { AlumnoService } from '../../services/alumno.service';
import { MateriaService } from '../../services/materia.service';
import { AuthService } from '../../core/auth.service';
import { mensajeError } from '../../core/http-error';

@Component({
  selector: 'app-inscripciones',
  templateUrl: 'inscripciones.page.html',
  imports: [
    FormsModule, DatePipe, DecimalPipe, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem,
    IonLabel, IonItemSliding, IonItemOptions, IonItemOption, IonIcon, IonFab, IonFabButton,
    IonRefresher, IonRefresherContent, IonSpinner, IonModal, IonButtons, IonButton,
    IonSelect, IonSelectOption, IonSearchbar, IonBadge, IonBackButton,
  ],
})
export class InscripcionesPage {
  private svc = inject(InscripcionService);
  private alumnoSvc = inject(AlumnoService);
  private materiaSvc = inject(MateriaService);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);
  auth = inject(AuthService);

  inscripciones: Inscripcion[] = [];
  alumnos: Alumno[] = [];
  materias: Materia[] = [];
  cargando = false;
  error = false;

  busqueda = '';
  intentado = false;
  guardando = false;

  modalAbierto = false;
  form = { idAlumno: null as number | null, idMateria: null as number | null };

  constructor() {
    addIcons({ add, ribbon, trash });
  }

  get filtradas(): Inscripcion[] {
    const q = this.busqueda.trim().toLowerCase();
    if (!q) return this.inscripciones;
    return this.inscripciones.filter((i) =>
      `${i.alumno} ${i.matricula ?? ''} ${i.materia} ${i.clave}`.toLowerCase().includes(q),
    );
  }

  ionViewWillEnter() {
    this.cargar();
    this.alumnoSvc.obtenerTodos().subscribe({
      next: (r) => (this.alumnos = r.status ? (r.value ?? []) : []),
      error: (e) => this.toast(mensajeError(e)),
    });
    this.materiaSvc.obtenerTodos().subscribe({
      next: (r) => (this.materias = r.status ? (r.value ?? []) : []),
      error: (e) => this.toast(mensajeError(e)),
    });
  }

  cargar(event?: any) {
    this.cargando = !event;
    this.error = false;
    this.svc.obtenerTodos().subscribe({
      next: (r) => {
        if (r.status) { this.inscripciones = r.value ?? []; if (r.msg) this.toast(r.msg); }
        else { this.inscripciones = []; this.toast(r.msg); }
        this.fin(event);
      },
      error: () => { this.error = true; this.fin(event); },
    });
  }

  private fin(event?: any) {
    this.cargando = false;
    event?.target.complete();
  }

  colorCalificacion(c: number | null): string {
    return c === null ? 'medium' : c >= 70 ? 'success' : 'danger';
  }

  abrirForm() {
    this.form = { idAlumno: null, idMateria: null };
    this.intentado = false;
    this.modalAbierto = true;
  }

  cerrarForm() {
    this.modalAbierto = false;
  }

  guardar() {
    this.intentado = true;
    const { idAlumno, idMateria } = this.form;
    if (idAlumno === null || idMateria === null || this.guardando) return;
    this.guardando = true;
    this.svc.crear({ idAlumno, idMateria }).subscribe({
      next: (r) => {
        this.guardando = false;
        this.toast(r.msg || (r.status ? 'Inscripción creada' : 'Error'));
        if (r.status) { this.modalAbierto = false; this.cargar(); }
      },
      error: (e) => { this.guardando = false; this.toast(mensajeError(e)); },
    });
  }

  async calificar(i: Inscripcion) {
    const alert = await this.alertCtrl.create({
      header: 'Calificación',
      subHeader: `${i.alumno} · ${i.materia}`,
      message: 'De 0 a 100. Déjala vacía para quitarla.',
      inputs: [{
        name: 'cal', type: 'number', min: 0, max: 100, placeholder: 'Calificación',
        value: i.calificacion ?? '',
      }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: (data) => {
            const txt = String(data.cal ?? '').trim();
            const valor = txt === '' ? null : Number(txt);
            if (valor !== null && (isNaN(valor) || valor < 0 || valor > 100)) {
              this.toast('La calificación debe estar entre 0 y 100');
              return false;
            }
            this.svc.calificar(i.idInscripcion, { calificacion: valor }).subscribe({
              next: (r) => { this.toast(r.status ? String(r.value) : r.msg); if (r.status) this.cargar(); },
              error: (e) => this.toast(mensajeError(e)),
            });
            return true;
          },
        },
      ],
    });
    await alert.present();
  }

  async confirmarEliminar(i: Inscripcion) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar',
      message: `¿Quitar a ${i.alumno} de ${i.materia}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar', role: 'destructive',
          handler: () => {
            this.svc.eliminar(i.idInscripcion).subscribe({
              next: (r) => { this.toast(r.status ? String(r.value) : r.msg); if (r.status) this.cargar(); },
              error: (e) => this.toast(mensajeError(e)),
            });
          },
        },
      ],
    });
    await alert.present();
  }

  private async toast(message: string) {
    (await this.toastCtrl.create({ message, duration: 3500, position: 'bottom' })).present();
  }
}
