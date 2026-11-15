import { Component, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonRefresher, IonRefresherContent,
  IonSpinner, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  IonList, IonItem, IonLabel, IonBadge, IonProgressBar, IonNote,
} from '@ionic/angular/standalone';
import { ResumenReporte } from '../../models/reporte.model';
import { ReporteService } from '../../services/reporte.service';

@Component({
  selector: 'app-inicio',
  templateUrl: 'inicio.page.html',
  imports: [
    DecimalPipe, IonHeader, IonToolbar, IonTitle, IonContent, IonRefresher, IonRefresherContent,
    IonSpinner, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonList,
    IonItem, IonLabel, IonBadge, IonProgressBar, IonNote,
  ],
})
export class InicioPage {
  private svc = inject(ReporteService);
  private router = inject(Router);

  cargando = false;
  error = false;
  mensaje = '';
  r: ResumenReporte | null = null;

  ionViewWillEnter() {
    this.cargar();
  }

  cargar(event?: any) {
    this.cargando = !event;
    this.error = false;
    this.mensaje = '';
    this.svc.resumen().subscribe({
      next: (res) => {
        if (res.status) this.r = res.value;
        else { this.r = null; this.mensaje = res.msg; }
        this.cargando = false;
        event?.target.complete();
      },
      error: () => { this.error = true; this.cargando = false; event?.target.complete(); },
    });
  }

  /** Porcentaje de una barra respecto al mayor valor de la lista. */
  fraccion(valor: number, lista: { total: number }[]): number {
    const max = Math.max(1, ...lista.map((x) => x.total));
    return valor / max;
  }

  get calificados(): number {
    return this.r ? this.r.aprobados + this.r.reprobados : 0;
  }

  ir(ruta: string) {
    this.router.navigateByUrl(`/tabs/${ruta}`);
  }
}
