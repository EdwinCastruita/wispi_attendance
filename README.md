# Wispi · XCIEN — Control de Asistencia

App web (Next.js 16) para que los usuarios de Odoo, **internos y portal**, registren la entrada y salida de su jornada. Es solo frontend: todo vive en Odoo y se consume por la API del módulo `wispi_attendance` (`../wispi/wispi_attendance`, controlador `controllers/api.py`).

## Puesta en marcha

```bash
cp .env.example .env.local   # ODOO_URL=https://<host-odoo>
npm install
npm run dev                  # http://localhost:3000
```

`ODOO_URL` es el host de Odoo, sin ruta. Si falta, se usa `https://qa.wispi.cloud`.

**HTTPS obligatorio en producción.** Sin HTTPS el navegador no entrega ni la cámara ni el GPS (`localhost` sí funciona en desarrollo).

## Pantallas

| Ruta | Qué hace |
| --- | --- |
| `/` | Login con el usuario de Odoo |
| `/inicio` | Botón CHECK IN / CHECK OUT, estado del turno, entrada, salida y horas de hoy (en vivo) |
| `/historial` | Registros de los últimos 7, 15 o 31 días, con geocerca y selfie |
| `/perfil` | Datos del empleado y cerrar sesión |

## Cómo registra

1. Al pulsar el botón se pide el GPS (si la empresa tiene *Seguimiento de dispositivo y ubicación*) y, en paralelo, se abre la cámara frontal (si la empresa exige selfie). Solo cámara en vivo; no hay opción de galería.
2. Se envía `POST /punch` con la acción que se mostró en pantalla. Si no coincide con el estado real (doble toque u otro dispositivo), Odoo responde 409 y la pantalla se actualiza sola.
3. Se muestra el `feedback` de Odoo: dentro de la geocerca, fuera (se avisó al jefe) o sin GPS.

Las horas se muestran en la zona horaria del empleado (`employee.tz`), no en la del celular.

## Comunicación con Odoo

Mismo patrón que `portal-frontend`:

- **Proxy same-origin.** El navegador llama a `/api/attendance/*` en este origen y `next.config.ts` lo reenvía a Odoo.
- **Sin cabeceras personalizadas.** La sesión va en `?_sid=` y el cuerpo como `text/plain` con JSON, así no hay preflight CORS. Todo pasa por `apiFetch` (`app/lib/api.ts`).
- **Cookie `asist_sid`.** Guarda el sid de Odoo; la lee `proxy.ts` para proteger `/inicio`, `/historial` y `/perfil`. No puede llamarse `session_id` (es la cookie HttpOnly de Odoo).
- Un 401 o una respuesta HTML de Odoo borra la cookie y regresa al login con `?expired=1`.

## Acceso de los usuarios

- **Internos:** entran con su usuario de Odoo si están ligados a un empleado.
- **Portal:** RH los da de alta desde el empleado con **Dar acceso a la app** (ver README de `wispi_attendance`).
- Usuario sin empleado: Odoo responde 403 `no_employee` y el login lo explica.

## Comandos

```bash
npm run build      # build de producción
npm run lint       # biome check
npx tsc --noEmit   # tipos
```
