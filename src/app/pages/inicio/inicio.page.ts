import { Component } from '@angular/core';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-inicio',
  templateUrl: 'inicio.page.html',
  imports: [IonHeader, IonToolbar, IonTitle, IonContent],
})
export class InicioPage {}
