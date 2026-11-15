import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AlertController, ToastController, IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonLabel, IonIcon, IonBadge, IonListHeader } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { bookOutline, clipboardOutline, keyOutline, logOutOutline, personCircleOutline } from 'ionicons/icons';
import { AuthService } from '../../core/auth.service';
import { environment } from '../../../environments/environment';
import { mensajeError } from '../../core/http-error';

@Component({
  selector: 'app-mas',
  templateUrl: 'mas.page.html',
  imports: [RouterLink, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonIcon, IonBadge, IonListHeader],
})
export class MasPage {
  auth = inject(AuthService);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);
  authEnabled = environment.authEnabled;

  constructor() {
    addIcons({ bookOutline, clipboardOutline, keyOutline, logOutOutline, personCircleOutline });
  }

  get descripcionRol(): string {
    switch (this.auth.rol) {
      case 'Admin': return 'Acceso total';
      case 'Capturista': return 'Puede crear y editar, no eliminar';
      case 'Consulta': return 'Solo lectura';
      default: return '';
    }
  }

  async cambiarPassword() {
    const alert = await this.alertCtrl.create({
      header: 'Cambiar contraseña',
      message: 'Mínimo 8 caracteres con mayúscula, minúscula y número.',
      inputs: [
        { name: 'actual', type: 'password', placeholder: 'Contraseña actual' },
        { name: 'nueva', type: 'password', placeholder: 'Nueva contraseña' },
        { name: 'confirmar', type: 'password', placeholder: 'Confirmar nueva contraseña' },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: (d) => {
            if (!d.actual || !d.nueva) { this.toast('Completa todos los campos'); return false; }
            if (d.nueva !== d.confirmar) { this.toast('La confirmación no coincide'); return false; }
            this.auth.cambiarPassword(d.actual, d.nueva).subscribe({
              next: (r) => this.toast(r.status ? String(r.value) : r.msg),
              error: (e) => this.toast(mensajeError(e)),
            });
            return true;
          },
        },
      ],
    });
    await alert.present();
  }

  async salir() {
    const alert = await this.alertCtrl.create({
      header: 'Cerrar sesión',
      message: '¿Quieres salir?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Salir', handler: () => this.auth.logout() },
      ],
    });
    await alert.present();
  }

  private async toast(message: string) {
    (await this.toastCtrl.create({ message, duration: 3500, position: 'bottom' })).present();
  }
}
