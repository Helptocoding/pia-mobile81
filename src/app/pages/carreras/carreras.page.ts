import { Component, inject } from '@angular/core';
import {
  AlertController, ToastController, IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonLabel, IonItemSliding, IonItemOptions, IonItemOption,
  IonIcon, IonFab, IonFabButton, IonRefresher, IonRefresherContent, IonSpinner,
  IonSearchbar, IonModal, IonButtons, IonButton, IonBadge,
} from '@ionic/angular/standalone';
import { AuthService } from '../../core/auth.service';
import { mensajeError } from '../../core/http-error';
import { FormsModule } from '@angular/forms';
import { Alumno } from '../../models/alumno.model';
import { AlumnoService } from '../../services/alumno.service';
import { addIcons } from 'ionicons';
import { add, create, trash } from 'ionicons/icons';
import { Carrera } from '../../models/carrera.model';
import { CarreraService } from '../../services/carrera.service';

@Component({
  selector: 'app-carreras',
  templateUrl: 'carreras.page.html',
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel,
    IonItemSliding, IonItemOptions, IonItemOption, IonIcon, IonFab, IonFabButton,
    IonRefresher, IonRefresherContent, IonSpinner, IonSearchbar, IonModal, IonButtons, IonButton, IonBadge,
    FormsModule,
  ],
})
export class CarrerasPage {
  private svc = inject(CarreraService);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);

  private alumnoSvc = inject(AlumnoService);
  auth = inject(AuthService);

  carreras: Carrera[] = [];
  cargando = false;
  error = false;
  busqueda = '';

  get filtradas(): Carrera[] {
    const q = this.busqueda.trim().toLowerCase();
    return q ? this.carreras.filter((c) => c.descripcion.toLowerCase().includes(q)) : this.carreras;
  }

  detalleAbierto = false;
  carreraSel: Carrera | null = null;
  alumnosCarrera: Alumno[] = [];
  cargandoDetalle = false;

  verAlumnos(c: Carrera) {
    this.carreraSel = c;
    this.alumnosCarrera = [];
    this.cargandoDetalle = true;
    this.detalleAbierto = true;
    this.alumnoSvc.obtenerTodos().subscribe({
      next: (r) => {
        this.alumnosCarrera = (r.value ?? []).filter((a) => a.idCarrera === c.idCarrera);
        this.cargandoDetalle = false;
      },
      error: (e) => { this.cargandoDetalle = false; this.toast(mensajeError(e)); },
    });
  }

  constructor() {
    addIcons({ add, create, trash });
  }

  ionViewWillEnter() {
    this.cargar();
  }

  cargar(event?: any) {
    this.cargando = !event;
    this.error = false;
    this.svc.obtenerTodos().subscribe({
      next: (r) => {
        if (r.status) { this.carreras = r.value ?? []; if (r.msg) this.toast(r.msg); }
        else { this.carreras = []; this.toast(r.msg); }
        this.fin(event);
      },
      error: () => { this.error = true; this.fin(event); },
    });
  }

  private fin(event?: any) {
    this.cargando = false;
    event?.target.complete();
  }

  async abrirForm(carrera?: Carrera) {
    const alert = await this.alertCtrl.create({
      header: carrera ? 'Editar carrera' : 'Nueva carrera',
      inputs: [{ name: 'descripcion', type: 'text', placeholder: 'Descripción', value: carrera?.descripcion ?? '' }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: (data) => {
            const descripcion = String(data.descripcion ?? '').trim();
            if (!descripcion) {
              this.toast('La descripción es obligatoria');
              return false;
            }
            this.guardar(descripcion, carrera);
            return true;
          },
        },
      ],
    });
    await alert.present();
  }

  private guardar(descripcion: string, carrera?: Carrera) {
    const dto = { descripcion };
    if (carrera) {
      this.svc.actualizar(carrera.idCarrera, dto).subscribe({
        next: (r) => { this.toast(r.status ? String(r.value) : r.msg); if (r.status) this.cargar(); },
        error: (e) => this.toast(mensajeError(e)),
      });
    } else {
      this.svc.crear(dto).subscribe({
        next: (r) => { this.toast(r.msg || (r.status ? 'Carrera creada' : 'Error')); if (r.status) this.cargar(); },
        error: (e) => this.toast(mensajeError(e)),
      });
    }
  }

  async confirmarEliminar(c: Carrera) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar',
      message: `¿Eliminar la carrera "${c.descripcion}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar', role: 'destructive',
          handler: () => {
            this.svc.eliminar(c.idCarrera).subscribe({
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
