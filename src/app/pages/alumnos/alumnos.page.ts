import { Component, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AlertController, ToastController, IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonLabel, IonItemSliding, IonItemOptions, IonItemOption,
  IonIcon, IonFab, IonFabButton, IonRefresher, IonRefresherContent, IonSpinner,
  IonModal, IonButtons, IonButton, IonInput, IonSelect, IonSelectOption, IonSearchbar,
  IonBadge, IonNote,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, create, trash } from 'ionicons/icons';
import { Alumno } from '../../models/alumno.model';
import { Carrera } from '../../models/carrera.model';
import { Inscripcion } from '../../models/inscripcion.model';
import { AlumnoService } from '../../services/alumno.service';
import { CarreraService } from '../../services/carrera.service';
import { InscripcionService } from '../../services/inscripcion.service';
import { AuthService } from '../../core/auth.service';
import { mensajeError } from '../../core/http-error';
import {
  correoInvalido, fechaNacimientoInvalida, limpiar, nombreInvalido, telefonoInvalido,
} from '../../core/validadores';

@Component({
  selector: 'app-alumnos',
  templateUrl: 'alumnos.page.html',
  imports: [
    FormsModule, DatePipe, DecimalPipe, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem,
    IonLabel, IonItemSliding, IonItemOptions, IonItemOption, IonIcon, IonFab, IonFabButton,
    IonRefresher, IonRefresherContent, IonSpinner, IonModal, IonButtons, IonButton,
    IonInput, IonSelect, IonSelectOption, IonSearchbar, IonBadge, IonNote,
  ],
})
export class AlumnosPage {
  private svc = inject(AlumnoService);
  private carreraSvc = inject(CarreraService);
  private inscSvc = inject(InscripcionService);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);
  auth = inject(AuthService);

  alumnos: Alumno[] = [];
  carreras: Carrera[] = [];
  cargando = false;
  error = false;

  busqueda = '';
  intentado = false;

  modalAbierto = false;
  editandoId: number | null = null;
  guardando = false;
  form = {
    nombre: '', aPaterno: '', aMaterno: '', idCarrera: null as number | null,
    correo: '', telefono: '', fechaNacimiento: '',
  };

  detalleAbierto = false;
  alumnoSel: Alumno | null = null;
  inscripciones: Inscripcion[] = [];
  cargandoDetalle = false;

  readonly hoy = new Date().toISOString().slice(0, 10);

  nombreInvalido = nombreInvalido;
  correoInvalido = correoInvalido;
  telefonoInvalido = telefonoInvalido;
  fechaNacimientoInvalida = fechaNacimientoInvalida;

  constructor() {
    addIcons({ add, create, trash });
  }

  get filtrados(): Alumno[] {
    const q = this.busqueda.trim().toLowerCase();
    if (!q) return this.alumnos;
    return this.alumnos.filter((a) =>
      `${a.nombre} ${a.aPaterno} ${a.aMaterno} ${a.carrera ?? ''} ${a.matricula ?? ''} ${a.correo ?? ''}`
        .toLowerCase().includes(q),
    );
  }

  get formInvalido(): boolean {
    const f = this.form;
    return nombreInvalido(f.nombre) || nombreInvalido(f.aPaterno) || nombreInvalido(f.aMaterno)
      || f.idCarrera === null || correoInvalido(f.correo) || telefonoInvalido(f.telefono)
      || fechaNacimientoInvalida(f.fechaNacimiento);
  }

  ionViewWillEnter() {
    this.cargar();
    this.cargarCarreras();
  }

  cargar(event?: any) {
    this.cargando = !event;
    this.error = false;
    this.svc.obtenerTodos().subscribe({
      next: (r) => {
        if (r.status) { this.alumnos = r.value ?? []; if (r.msg) this.toast(r.msg); }
        else { this.alumnos = []; this.toast(r.msg); }
        this.fin(event);
      },
      error: () => { this.error = true; this.fin(event); },
    });
  }

  private cargarCarreras() {
    this.carreraSvc.obtenerTodos().subscribe({
      next: (r) => (this.carreras = r.status ? (r.value ?? []) : []),
      error: (e) => this.toast(mensajeError(e)),
    });
  }

  private fin(event?: any) {
    this.cargando = false;
    event?.target.complete();
  }

  abrirForm(a?: Alumno) {
    this.editandoId = a?.idAlumno ?? null;
    this.form = {
      nombre: a?.nombre ?? '',
      aPaterno: a?.aPaterno ?? '',
      aMaterno: a?.aMaterno ?? '',
      idCarrera: a?.idCarrera ?? null,
      correo: a?.correo ?? '',
      telefono: a?.telefono ?? '',
      fechaNacimiento: a?.fechaNacimiento ?? '',
    };
    this.intentado = false;
    this.modalAbierto = true;
  }

  cerrarForm() {
    this.modalAbierto = false;
  }

  guardar() {
    this.intentado = true;
    if (this.formInvalido || this.guardando) return;
    const f = this.form;
    const dto = {
      nombre: limpiar(f.nombre),
      aPaterno: limpiar(f.aPaterno),
      aMaterno: limpiar(f.aMaterno),
      idCarrera: f.idCarrera!,
      correo: limpiar(f.correo) || null,
      telefono: limpiar(f.telefono) || null,
      fechaNacimiento: f.fechaNacimiento || null,
    };
    const editando = this.editandoId !== null;
    const obs: any = editando
      ? this.svc.actualizar(this.editandoId!, dto)
      : this.svc.crear(dto);
    this.guardando = true;
    obs.subscribe({
      next: (r: any) => {
        this.guardando = false;
        const msg = editando ? (r.status ? String(r.value) : r.msg) : (r.msg || 'Alumno creado');
        this.toast(msg || (r.status ? 'Guardado' : 'Error'));
        if (r.status) { this.modalAbierto = false; this.cargar(); }
      },
      error: (e: unknown) => { this.guardando = false; this.toast(mensajeError(e)); },
    });
  }

  verDetalle(a: Alumno) {
    this.alumnoSel = a;
    this.inscripciones = [];
    this.cargandoDetalle = true;
    this.detalleAbierto = true;
    this.inscSvc.obtenerPorAlumno(a.idAlumno).subscribe({
      next: (r) => { this.inscripciones = r.value ?? []; this.cargandoDetalle = false; },
      error: (e) => { this.cargandoDetalle = false; this.toast(mensajeError(e)); },
    });
  }

  colorCalificacion(c: number | null): string {
    return c === null ? 'medium' : c >= 70 ? 'success' : 'danger';
  }

  async confirmarEliminar(a: Alumno) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar',
      message: `¿Eliminar a ${a.nombre} ${a.aPaterno}?` +
        (a.totalMaterias > 0 ? ` También se borrarán sus ${a.totalMaterias} inscripciones.` : ''),
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar', role: 'destructive',
          handler: () => {
            this.svc.eliminar(a.idAlumno).subscribe({
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
