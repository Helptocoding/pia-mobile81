# Programas FACPYA - App móvil (cascarón)

Proyecto base en **Ionic 8 + Angular 20 + Capacitor 8**. Ya trae la barra de pestañas, la pantalla de Inicio y la configuración para llamar a la API `ProgramasFacpya.Api`. Tu actividad es construir las pantallas de **Alumnos**, **Maestros** y **Carreras** y conectarlas a la API.

## Cómo correrlo

1. Levanta la API, que escucha en `http://localhost:5165`.
2. Instala las dependencias (solo la primera vez):
   ```
   npm install
   ```
3. Levanta la app con **F5** en VS Code (abre Chrome solo) o desde la terminal:
   ```
   npm start
   ```
4. Si usaste la terminal, abre http://localhost:4200. Después activa la vista de celular en las herramientas de desarrollador del navegador (F12).

## Estructura

```
src/
├── environments/environment.ts   URL de la API (ya configurada)
└── app/
    ├── tabs/                     Barra de pestañas y sus rutas
    ├── models/                   (vacío) Interfaces de los datos
    ├── services/                 (vacío) Llamadas HTTP a la API
    └── pages/                    Pantallas (solo trae "inicio")
```

## Qué debe hacer tu app

| Pantalla | Listar | Agregar | Editar | Eliminar |
| --- | --- | --- | --- | --- |
| Alumnos | Nombre completo, carrera y fecha de registro | Con un `ion-modal` | Con los datos ya cargados | Pidiendo confirmación |
| Maestros | Nombre completo y fecha de registro | Con un `ion-modal` | Con los datos ya cargados | Pidiendo confirmación |
| Carreras | Descripción | Con un `AlertController` | Con los datos ya cargados | Pidiendo confirmación |

En las tres pantallas:

- El botón flotante `ion-fab` abre el formulario para agregar.
- Las opciones de editar y eliminar aparecen al deslizar el registro (`ion-item-sliding`).
- Se muestra un `ion-spinner` mientras carga y un mensaje si no hay registros o falla la conexión.
- La lista se actualiza al jalarla hacia abajo (`ion-refresher`) y al volver a la pestaña (`ionViewWillEnter`).
- El resultado de cada operación se muestra con `ToastController`.

## Pasos para agregar una pantalla (ejemplo: Alumnos)

1. **Modelo**: en `src/app/models/` crea `api-response.model.ts` (solo una vez) y `alumno.model.ts`, con los mismos campos que regresa y recibe la API.
2. **Servicio**: en `src/app/services/` crea `alumno.service.ts` con `HttpClient` y un método por endpoint. La URL base sale de `environment.endpoint`.
3. **Pantalla**: en `src/app/pages/alumnos/` crea `alumnos.page.ts` y `alumnos.page.html`. Cada componente de Ionic que uses se importa desde `@ionic/angular/standalone` y se agrega al arreglo `imports` del componente.
4. **Ruta**: agrégala en `src/app/tabs/tabs.routes.ts`:
   ```ts
   {
     path: 'alumnos',
     loadComponent: () =>
       import('../pages/alumnos/alumnos.page').then((m) => m.AlumnosPage),
   },
   ```
5. **Pestaña**: agrega el `ion-tab-button` en `src/app/tabs/tabs.page.html`, con `tab="alumnos"` y `href="/tabs/alumnos"`.
6. **Ícono**: regístralo con `addIcons` en `src/app/tabs/tabs.page.ts`. Si no lo registras, no se muestra. Esto aplica también a los íconos que uses dentro de cada pantalla.

Repite los pasos para Maestros y Carreras.

## API

La URL base es `http://localhost:5165/api`. Cambia `{Controlador}` por `Alumno`, `Maestro` o `Carrera`.

| Acción | Método | Ruta |
| --- | --- | --- |
| Listar | GET | `/{Controlador}/ObtenerTodos` |
| Buscar uno | GET | `/{Controlador}/ObtenerPorId/{id}` |
| Agregar | POST | `/{Controlador}/Crear` |
| Editar | PUT | `/{Controlador}/Actualizar/{id}` |
| Eliminar | DELETE | `/{Controlador}/Eliminar/{id}` |

Datos que envías en `Crear` y `Actualizar`:

| Controlador | Campos |
| --- | --- |
| Alumno | `nombre`, `aPaterno`, `aMaterno`, `idCarrera` |
| Maestro | `nombre`, `aPaterno`, `aMaterno` |
| Carrera | `descripcion` |

Todas las respuestas tienen esta forma:

```json
{ "status": true, "value": "...", "msg": "" }
```

## Ten en cuenta

- **Un error de validación no es un error HTTP.** La API responde 200 con `status: false` y el motivo en `msg`. Revisa `status` dentro de `next`; el bloque `error` del `subscribe` solo se ejecuta si falla la conexión.
- **El mensaje de éxito cambia de lugar.** `Crear` lo regresa en `msg` (en `value` viene el id nuevo). `Actualizar` y `Eliminar` lo regresan en `value`.
- **La carrera del alumno es un `ion-select`.** Sus opciones salen de `Carrera/ObtenerTodos`. Por eso Alumnos usa un `ion-modal`: un `Alert` no permite mezclar campos de texto con una lista.
- **Con `ion-modal` usa `[(ngModel)]`.** Agrega `FormsModule` al arreglo `imports` de la pantalla. Cierra el modal solo cuando la API responda `status: true`, para no perder lo que se capturó.
- **Una carrera con alumnos no se puede eliminar.** La API lo rechaza; muestra su mensaje en un toast.
