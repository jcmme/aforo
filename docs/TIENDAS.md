# Publicación en App Store y Google Play

Guía y checklist para someter AFORO a ambas tiendas **y que la aprueben a la
primera**. Se actualiza conforme se completan puntos. Última revisión: Ronda 6.

Regla de oro: **no someter hasta que TODO el checklist esté en verde.** Un
rechazo inicial queda en el historial de la app y endurece las revisiones
siguientes.

---

## 1. Trámites externos (empezar YA, son los más lentos)

> **Situación actual: MABI aún no está constituida** y el proyecto lo lleva
> una persona física. La ruta elegida es **arrancar con cuentas personales y
> migrar a la empresa después** — ambas tiendas permiten transferir la app
> (App Transfer en App Store Connect / transferencia de app en Play Console)
> sin perder usuarios, reseñas ni historial. Nada del trabajo se repite.

### 1.1 Ruta de arranque (persona física, disponible HOY)

| | Apple Developer Program | Google Play Console |
|---|---|---|
| Tipo | **Individual** | **Personal** |
| Costo | $99 USD / año | $25 USD una sola vez |
| Requisitos | Identificación oficial + verificación de identidad en línea | Identificación + verificación |
| Diferencia visible | La ficha muestra el nombre personal como vendedor (hasta transferir a la empresa) | Igual; además algunos datos de contacto del desarrollador se muestran públicos — usar correo/teléfono dedicados al proyecto, no personales |
| Requisito extra | — | **Prueba cerrada obligatoria: 12 testers inscritos durante 14 días** antes de poder publicar. Se cubre con staff/RPs/amigos y sirve como beta real pre-lanzamiento |
| URL | https://developer.apple.com/programs/enroll/ | https://play.google.com/console/signup |

### 1.2 Ruta de la empresa (en paralelo, sin costo)

1. **e.firma del SAT** (si no se tiene): cita presencial. Es el prerequisito
   real de todo lo demás.
2. **Constituir una SAS** (Sociedad por Acciones Simplificada): gratuita,
   100% en línea en el portal de la Secretaría de Economía
   (https://www.gob.mx/tuempresa), puede ser **unipersonal**. Lista en días.
   Tope de ingresos anuales de varios millones de pesos — suficiente para
   arrancar. Esta entidad se convierte en "MABI".
3. **Número D-U-N-S**: identificador de 9 dígitos de **Dun & Bradstreet**
   que acredita que la empresa existe. Gratuito; tarda de días a ~4 semanas
   en México. Vías: herramienta de Apple
   (https://developer.apple.com/enroll/duns-lookup/ — buscar primero si ya
   existe uno) o directo con D&B (https://www.dnb.com/duns-number.html).
4. **Cuentas de organización** en ambas tiendas → **transferir las apps**
   desde las cuentas personales. Las cuentas de organización de Google
   además no tienen el requisito de los 12 testers.

> **Importante (responsabilidad, no tiendas):** operar el piloto con datos
> reales de los antros y cobrar suscripciones sin entidad significa que la
> responsabilidad legal (LFPDPPP, contratos con corporativos) recae en la
> persona física. La SAS conviene tenerla ANTES del piloto con clientes
> reales, no solo para las tiendas.

### 1.3 Legal (conecta con el pendiente LFPDPPP del CLAUDE.md)

- **Aviso de privacidad** redactado por el abogado y publicado en una URL
  pública. Obligatorio en ambas tiendas ANTES de someter. Debe cubrir:
  datos que se recolectan (identidad, contacto, huella de dispositivo),
  finalidad (operación de reservas + prevención de fraude/no-shows),
  derechos ARCO, y el consentimiento para la huella de dispositivo.
- **Términos y condiciones** de la app (el nivel 1 "general" que ya existe
  como parámetro se sustituye por el texto legal real).
- **Dominio propio** (p. ej. aforo.mx): hospeda el aviso de privacidad, la
  página de soporte que Apple exige, y a futuro los deep links reales
  (Universal Links / App Links) del flujo de invitados por WhatsApp.

---

## 2. Estado del código frente a los requisitos

### Hecho

- [x] **Borrado de cuenta dentro de la app** (App Store 5.1.1(v)):
      perfil → "Eliminar mi cuenta" → confirmación → Edge Function
      `eliminar-cuenta` (anonimiza reservas, borra todo lo personal en cascada).
- [x] **Textos de permisos** declarados en `app.json`: cámara (escaneo de QR)
      y galería (foto de reseña). Sin permisos que no se usan.
- [x] **Cifrado exento** declarado (`usesNonExemptEncryption: false` — solo
      HTTPS estándar), evita el cuestionario de exportación en cada build.
- [x] `eas.json` con perfiles development / preview / production.
- [x] **Enlace al aviso de privacidad DENTRO de la app** (lo exige Google y
      lo revisa Apple): en el registro (consentimiento al crear cuenta) y en
      el perfil. La URL es parámetro editable (`aviso_privacidad_url`,
      migración 0009) — al tener la versión del abogado en el dominio propio
      se cambia sin publicar actualización. Mientras tanto apunta al
      borrador hospedado (`web/aviso-privacidad.html`, marcado BORRADOR).
- [x] **iPhone-only** (`supportsTablet: false`): el caso de uso es 100%
      teléfono; evita que Apple pruebe el layout en iPad. Reversible cuando
      se quiera dar soporte real a tablet.
- [x] Identificadores fijados: `com.aforo.app` (iOS y Android), versión 0.1.0.
- [x] Contraseñas con bcrypt (Supabase Auth), QR firmado, RLS deny-by-default.

### Pendiente de código (bloqueante para someter)

- [ ] **Backend real en producción**: crear el proyecto Supabase de
      producción y aplicar migraciones 0001–0008 + seed + desplegar TODAS las
      Edge Functions (lista en README). La app NO puede someterse en modo
      demo: Apple rechaza por guideline 2.1 (App Completeness) cualquier
      contenido simulado.
- [ ] **Verificación de teléfono real** (proveedor SMS, p. ej. Twilio). Hoy
      el flujo existe pero el SMS está stubeado. Requiere cuenta y
      credenciales de MABI.
- [ ] **Builds nativos**: `eas build --platform ios|android --profile
      production`. Requiere las cuentas de desarrollador (§1.2). Las
      variables `EXPO_PUBLIC_SUPABASE_URL` / `_ANON_KEY` de producción se
      cargan como variables de entorno de EAS, nunca en el repo.
- [ ] **Revisión de seguridad por un desarrollador backend con experiencia**
      antes de manejar datos reales (compromiso del CLAUDE.md §3). Someter a
      tiendas ES pasar a producción.

### Pendiente de formularios (se llenan en las consolas, con esta guía)

- [ ] App Store Connect: ficha, capturas, App Privacy, edad, notas al revisor.
- [ ] Play Console: ficha, capturas, Data Safety, IARC, cuenta de prueba.

---

## 3. Riesgos de rechazo específicos de AFORO y cómo se mitigan

### 3.1 Huella de dispositivo (el punto más delicado)

- **Riesgo**: Apple prohíbe el *device fingerprinting* para rastreo/publicidad
  (guideline 5.1.2 y reglas de ATT); Google lo restringe en su política de
  datos de dispositivo.
- **Nuestra posición (defendible y permitida)**: la huella se usa EXCLUSIVAMENTE
  para **prevención de fraude** (detección de reservas fantasma), nunca para
  publicidad ni para compartir con terceros. Ambas tiendas contemplan esa
  excepción explícitamente.
- **Cómo se declara**:
  - Apple → App Privacy: "Device ID" recolectado, propósito **Fraud
    Prevention**, "not used for tracking" (NO requiere el prompt de ATT
    porque no hay rastreo entre apps ni empresas).
  - Google → Data Safety: "Device or other IDs", propósito **Fraud
    prevention, security, and compliance**, no compartido.
  - Aviso de privacidad: consentimiento explícito (lo redacta el abogado).
- **Nunca** describir la huella como "tracking" en ningún texto público.

### 3.2 Clasificación de edad (antros / alcohol)

- Apple: cuestionario de edad → resultado esperado **17+** (referencias a
  alcohol frecuentes/intensas por el contexto de vida nocturna).
- Google: cuestionario IARC → **18+** en la mayoría de territorios.
- Responder los cuestionarios con honestidad total: subestimar la
  clasificación es causa de rechazo y de strikes posteriores.
- La app NO vende alcohol ni contenido para adultos: es gestión de reservas.
  Decirlo así en las notas al revisor baja la fricción.

### 3.3 App Completeness (Apple 2.1) — la causa #1 de rechazo global

- Cero contenido placeholder: ni "lorem ipsum", ni pantallas "próximamente",
  ni datos de demostración visibles en producción.
- Todos los flujos navegables deben funcionar contra el backend real.
- Los T&C de nivel corporativo/antro que estén vacíos deben mostrar un texto
  real (aunque sea breve), no un marcador.

### 3.4 Cuenta de revisor (obligatoria: la app requiere login)

Preparar en el entorno de producción y poner en "App Review Information"
(Apple) y "App access" (Google):

- Cuenta cliente de prueba con correo verificado y al menos una reserva
  activa con QR, para que el revisor recorra el flujo completo.
- Notas al revisor (borrador):
  > AFORO is a B2B2C reservation platform for nightlife venues in Mexico.
  > Staff roles (door scanning, table management) are invitation-only and
  > cannot be self-assigned; the provided test account demonstrates the
  > full client flow: browse venues → create a reservation → receive signed
  > QR codes → share them. Device data is collected solely for no-show
  > fraud prevention (see privacy policy), never for advertising/tracking.

### 3.5 Otros puntos que revisan siempre

- **Login funcional a la primera** con la cuenta de prueba (probarlo antes de
  someter, desde red externa).
- **Sin crashes en frío**: probar el `.ipa`/`.aab` real en dispositivo físico.
- Enlaces de soporte y privacidad **vivos** (no 404) en la ficha.
- La app pide permisos **solo cuando se usan** (cámara al escanear, galería
  al adjuntar foto) — ya es el comportamiento actual.
- iPad: resuelto — la app es iPhone-only (`supportsTablet: false`), Apple no
  la prueba en iPad.
- El aviso de privacidad del borrador (`web/aviso-privacidad.html`) debe
  sustituirse por la versión del abogado ANTES de someter (está marcado
  BORRADOR a propósito, como recordatorio bloqueante).

---

## 4. Formularios de datos (respuestas preparadas)

Datos que AFORO recolecta, para copiar en App Privacy (Apple) y Data Safety
(Google):

| Dato | Propósito | ¿Vinculado a identidad? | ¿Tracking/compartido? |
|---|---|---|---|
| Nombre, correo, teléfono, usuario | Funcionalidad de la app (cuenta y reservas) | Sí | No |
| Identificador de dispositivo (huella) | Prevención de fraude | Sí | No |
| Historial de reservas / asistencia | Funcionalidad + prevención de fraude | Sí | No |
| Fotos (opcional, reseñas) | Contenido de usuario | Sí | No |
| Datos de uso/diagnóstico | (No se recolectan hoy; actualizar si se agrega analytics) | — | — |

Ambas tiendas exigen declarar también: **los datos se cifran en tránsito**
(sí, TLS) y **el usuario puede solicitar el borrado** (sí, dentro de la app).

---

## 5. Assets de ficha (los genera Claude cuando haya build)

- **Ícono**: existe (`assets/icon.png` 1024×1024, adaptable Android listo).
- **Capturas**: Apple exige 6.9" (iPhone Pro Max) y opcional iPad; Google
  exige teléfono + tablet 7"/10" si se declara soporte. Se generan con la
  app real (no mockups con contenido falso).
- **Textos de ficha**: título (30 car. Apple / 30 Google), subtítulo/desc.
  corta (30/80), descripción larga, keywords (100 car., solo Apple).
- **Gráfico de funciones** (Google, 1024×500).

---

## 6. Orden de ejecución sugerido

1. Persona física, hoy: cuenta de Supabase (gratis) + dominio + cuentas de
   desarrollador individuales (§1.1) + arrancar e.firma/SAS en paralelo
   (§1.2) + abogado (aviso de privacidad).
2. Código: proyecto Supabase de producción + SMS real + revisión de
   seguridad externa.
3. Builds EAS de producción + pruebas en dispositivos físicos + prueba
   cerrada de Google (12 testers × 14 días) con el staff del piloto.
4. Fichas, formularios de privacidad, cuenta de revisor, capturas.
5. Checklist final completo → someter a las dos tiendas el mismo día.
6. Cuando la SAS y su D-U-N-S existan: cuentas de organización y App
   Transfer en ambas tiendas (sin pérdida de usuarios ni reseñas).
