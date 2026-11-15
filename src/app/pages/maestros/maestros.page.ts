import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AlertController, ToastController, IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonLabel, IonItemSliding, IonItemOptions, IonItemOption,
  IonIcon, IonFab, IonFabButton, IonRefresher, IonRefresherContent, IonSpinner,
  IonModal, IonButtons, IonButton, IonInput, IonSearchbar, IonBadge,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, create, trash } from 'ionicons/icons';
import { Maestro } from '../../models/maestro.model';
import { MaestroService } from '../../services/maestro.service';
import { AuthService } from '../../core/auth.service';
import { mensajeError } from '../../core/http-error';
import { correoInvalido, limpiar, nombreInvalido, telefonoInvalido } from '../../core/validadores';

@Component({
  selector: 'app-maestros',
  templateUrl: 'maestros.page.html',
  imports: [
    FormsModule, DatePipe, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem,
    IonLabel, IonItemSliding, IonItemOptions, IonItemOption, IonIcon, IonFab, IonFabButton,
    IonRefresher, IonRefresherContent, IonSpinner, IonModal, IonButtons, IonButton, IonInput,
    IonSearchbar, IonBadge,
  ],
})
export class MaestrosPage {
  private svc = inject(MaestroService);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);
  auth = inject(AuthService);

  maestros: Maestro[] = [];
  cargando = false;
  error = false;

  busqueda = '';
  intentado = false;
  guardando = false;

  modalAbierto = false;
  editandoId: number | null = null;
  form = { nombre: '', aPaterno: '', aMaterno: '', correo: '', telefono: '', especialidad: '' };

  nombreInvalido = nombreInvalido;
  correoInvalido = correoInvalido;
  telefonoInvalido = telefonoInvalido;

  constructor() {
    addIcons({ add, create, trash });
  }

  get filtrados(): Maestro[] {
    const q = this.busqueda.trim().toLowerCase();
    if (!q) return this.maestros;
    return this.maestros.filter((m) =>
      `${m.nombre} ${m.aPaterno} ${m.aMaterno} ${m.especialidad ?? ''} ${m.correo ?? ''}`.toLowerCase().includes(q),
    );
  }

  get formInvalido(): boolean {
    const f = this.form;
    return nombreInvalido(f.nombre) || nombreInvalido(f.aPaterno) || nombreInvalido(f.aMaterno)
      || correoInvalido(f.correo) || telefonoInvalido(f.telefono) || limpiar(f.especialidad).length > 60;
  }

  ionViewWillEnter() {
    this.cargar();
  }

  cargar(event?: any) {
    this.cargando = !event;
    this.error = false;
    this.svc.obtenerTodos().subscribe({
      next: (r) => {
        if (r.status) { this.maestros = r.value ?? []; if (r.msg) this.toast(r.msg); }
        else { this.maestros = []; this.toast(r.msg); }
        this.fin(event);
      },
      error: () => { this.error = true; this.fin(event); },
    });
  }

  private fin(event?: any) {
    this.cargando = false;
    event?.target.complete();
  }

  abrirForm(m?: Maestro) {
    this.editandoId = m?.idMaestro ?? null;
    this.form = {
      nombre: m?.nombre ?? '', aPaterno: m?.aPaterno ?? '', aMaterno: m?.aMaterno ?? '',
      correo: m?.correo ?? '', telefono: m?.telefono ?? '', especialidad: m?.especialidad ?? '',
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
      correo: limpiar(f.correo) || null,
      telefono: limpiar(f.telefono) || null,
      especialidad: limpiar(f.especialidad) || null,
    };
    const editando = this.editandoId !== null;
    const obs: any = editando
      ? this.svc.actualizar(this.editandoId!, dto)
      : this.svc.crear(dto);
    this.guardando = true;
    obs.subscribe({
      next: (r: any) => {
        this.guardando = false;
        const msg = editando ? (r.status ? String(r.value) : r.msg) : (r.msg || 'Maestro creado');
        this.toast(msg || (r.status ? 'Guardado' : 'Error'));
        if (r.status) { this.modalAbierto = false; this.cargar(); }
      },
      error: (e: unknown) => { this.guardando = false; this.toast(mensajeError(e)); },
    });
  }

  async confirmarEliminar(m: Maestro) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar',
      message: `¿Eliminar a ${m.nombre} ${m.aPaterno}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar', role: 'destructive',
          handler: () => {
            this.svc.eliminar(m.idMaestro).subscribe({
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
