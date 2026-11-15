import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AlertController, ToastController, IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonLabel, IonItemSliding, IonItemOptions, IonItemOption,
  IonIcon, IonFab, IonFabButton, IonRefresher, IonRefresherContent, IonSpinner,
  IonModal, IonButtons, IonButton, IonInput, IonSelect, IonSelectOption, IonSearchbar,
  IonBadge, IonBackButton,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, create, trash } from 'ionicons/icons';
import { Materia } from '../../models/materia.model';
import { Maestro } from '../../models/maestro.model';
import { MateriaService } from '../../services/materia.service';
import { MaestroService } from '../../services/maestro.service';
import { AuthService } from '../../core/auth.service';
import { mensajeError } from '../../core/http-error';
import { limpiar } from '../../core/validadores';

@Component({
  selector: 'app-materias',
  templateUrl: 'materias.page.html',
  imports: [
    FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel,
    IonItemSliding, IonItemOptions, IonItemOption, IonIcon, IonFab, IonFabButton,
    IonRefresher, IonRefresherContent, IonSpinner, IonModal, IonButtons, IonButton,
    IonInput, IonSelect, IonSelectOption, IonSearchbar, IonBadge, IonBackButton,
  ],
})
export class MateriasPage {
  private svc = inject(MateriaService);
  private maestroSvc = inject(MaestroService);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);
  auth = inject(AuthService);

  materias: Materia[] = [];
  maestros: Maestro[] = [];
  cargando = false;
  error = false;

  busqueda = '';
  intentado = false;
  guardando = false;

  modalAbierto = false;
  editandoId: number | null = null;

  form = { clave: '', nombre: '', creditos: null as number | null, idMaestro: 0 };

  constructor() {
    addIcons({ add, create, trash });
  }

  get filtradas(): Materia[] {
    const q = this.busqueda.trim().toLowerCase();
    if (!q) return this.materias;
    return this.materias.filter((m) => `${m.clave} ${m.nombre} ${m.maestro ?? ''}`.toLowerCase().includes(q));
  }

  claveInvalida = () => !/^[A-Za-z0-9]{3,10}$/.test(this.form.clave.trim());
  nombreInvalido = () => limpiar(this.form.nombre).length < 3 || limpiar(this.form.nombre).length > 100;
  creditosInvalidos = () => {
    const c = this.form.creditos;
    return c === null || !Number.isInteger(Number(c)) || c < 1 || c > 12;
  };
  get formInvalido() {
    return this.claveInvalida() || this.nombreInvalido() || this.creditosInvalidos();
  }

  ionViewWillEnter() {
    this.cargar();
    this.maestroSvc.obtenerTodos().subscribe({
      next: (r) => (this.maestros = r.status ? (r.value ?? []) : []),
      error: (e) => this.toast(mensajeError(e)),
    });
  }

  cargar(event?: any) {
    this.cargando = !event;
    this.error = false;
    this.svc.obtenerTodos().subscribe({
      next: (r) => {
        if (r.status) { this.materias = r.value ?? []; if (r.msg) this.toast(r.msg); }
        else { this.materias = []; this.toast(r.msg); }
        this.fin(event);
      },
      error: () => { this.error = true; this.fin(event); },
    });
  }

  private fin(event?: any) {
    this.cargando = false;
    event?.target.complete();
  }

  abrirForm(m?: Materia) {
    this.editandoId = m?.idMateria ?? null;
    this.form = { clave: m?.clave ?? '', nombre: m?.nombre ?? '', creditos: m?.creditos ?? null, idMaestro: m?.idMaestro ?? 0 };
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
      clave: f.clave.trim().toUpperCase(),
      nombre: limpiar(f.nombre),
      creditos: Number(f.creditos),
      idMaestro: f.idMaestro ? f.idMaestro : null,
    };
    const editando = this.editandoId !== null;
    const obs: any = editando ? this.svc.actualizar(this.editandoId!, dto) : this.svc.crear(dto);
    this.guardando = true;
    obs.subscribe({
      next: (r: any) => {
        this.guardando = false;
        const msg = editando ? (r.status ? String(r.value) : r.msg) : (r.msg || 'Materia creada');
        this.toast(msg || (r.status ? 'Guardado' : 'Error'));
        if (r.status) { this.modalAbierto = false; this.cargar(); }
      },
      error: (e: unknown) => { this.guardando = false; this.toast(mensajeError(e)); },
    });
  }

  async confirmarEliminar(m: Materia) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar',
      message: `¿Eliminar la materia "${m.nombre}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar', role: 'destructive',
          handler: () => {
            this.svc.eliminar(m.idMateria).subscribe({
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
