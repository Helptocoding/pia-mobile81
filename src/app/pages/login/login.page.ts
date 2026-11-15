import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  ToastController, IonContent, IonHeader, IonToolbar, IonTitle, IonInput,
  IonButton, IonSpinner,
} from '@ionic/angular/standalone';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: 'login.page.html',
  imports: [FormsModule, IonContent, IonHeader, IonToolbar, IonTitle, IonInput, IonButton, IonSpinner],
})
export class LoginPage {
  private auth = inject(AuthService);
  private router = inject(Router);
  private toastCtrl = inject(ToastController);

  usuario = '';
  password = '';
  intentado = false;
  cargando = false;

  entrar() {
    this.intentado = true;
    if (!this.usuario.trim() || !this.password) return;
    this.cargando = true;
    this.auth.login(this.usuario.trim(), this.password).subscribe({
      next: (r) => {
        this.cargando = false;
        if (r.status) this.router.navigateByUrl('/tabs/inicio');
        else this.toast(r.msg || 'Credenciales incorrectas');
      },
      error: () => { this.cargando = false; this.toast('Error de conexión'); },
    });
  }

  private async toast(message: string) {
    (await this.toastCtrl.create({ message, duration: 2500 })).present();
  }
}
