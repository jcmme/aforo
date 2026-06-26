# CLAUDE.md — AFORO

Este archivo es la **fuente de verdad** del proyecto. Léelo completo al inicio de cada
sesión y respeta estas reglas en todo el código que generes. Si una petición contradice
este archivo, señálalo antes de proceder.

## 1. Qué es AFORO

AFORO es una plataforma **multi-tenant** de gestión de reservas para la industria del
entretenimiento nocturno (antros) en México. La desarrolla **MABI**, una empresa de
tecnología.

Sirve a varios **corporativos** (grupos empresariales dueños de antros), cada uno con
varios antros, su propio personal y sus propias métricas, todo **aislado** sobre una
misma infraestructura. Meta inicial: ~10 antros de ~4 corporativos en Puebla, con visión
de expandirse.

El producto se organiza en tres capas:

1. **Operación** — reservas, código QR, control de acceso en puerta.
2. **Inteligencia** — detección de reservas fantasma, métricas por corporativo, hitos
   del personal.
3. **Monetización** — suscripción SaaS por niveles, difusión pagada de eventos, gestión
   de promociones.

El diferenciador central es la **detección de reservas fantasma**: clientes que reservan
repetidamente y no se presentan. Todo el sistema de métricas e hitos se apoya en este
motor.

## 2. Principios de arquitectura (NO negociables)

- **Multi-tenant con aislamiento estricto.** Los datos de un corporativo JAMÁS se cruzan
  con los de otro, bajo ninguna petición. El aislamiento se diseña desde la base de datos
  y se valida en el servidor en cada petición.
- **Configuración sin código.** Toda regla de negocio relevante (umbrales, cupos,
  ventanas de tiempo, motivos, cifras de hitos, textos de notificaciones) vive como
  parámetro editable en base de datos, no quemada en el código. Pensado para un panel de
  Súper Admin que edita sin tocar código.
- **Denegación por defecto.** Lo que no está explícitamente permitido para un rol, está
  prohibido. Cada acción sensible se valida contra una matriz de permisos del lado del
  servidor.
- **Feature flags por corporativo.** Qué módulos/funciones ve cada corporativo es
  configuración por tenant, no desarrollo a la medida.
- **Pensar en los cuatro módulos.** El proyecto se construye en 4 secciones (ver §8).
  Aunque un prompt implemente solo una, la base de datos y la estructura deben contemplar
  las demás para no rehacer.

## 3. Seguridad (requisitos mínimos, aplican siempre)

AFORO custodia identidad, datos personales, huella de dispositivo y —a futuro— dinero.
La seguridad no es opcional ni "para después".

- Contraseñas hasheadas con **bcrypt o Argon2**. Nunca en texto plano, nunca en logs.
- **Verificación real** de correo y teléfono en el registro (no solo captura del dato).
- Sesiones con **expiración y revocables**. Límite de intentos de login y de ingreso de
  códigos de invitación.
- **QR firmado criptográficamente**, no un número secuencial ni adivinable. Validación
  del QR siempre del lado del servidor, nunca solo en el dispositivo.
- Todo el tráfico sobre **HTTPS/TLS**. Sin comunicación en texto plano.
- **Cifrado en reposo** de datos sensibles, en particular la huella de dispositivo y los
  datos personales.
- Datos sensibles nunca expuestos en logs, mensajes de error ni respuestas de la API.
- Aislamiento entre cuentas y roles **probado explícitamente**: un RP no ve datos de otro
  RP; un rol de un antro no alcanza datos de otro antro salvo que su nivel lo permita.
- **Cola local de escaneos** en puerta que opere sin señal y sincronice al recuperar
  conexión (la mala conectividad de madrugada es el caso normal).
- **Respaldos automáticos** de la base de datos con restauración probada.

> Nota: este proyecto puede iniciarse como prototipo, pero el sistema de producción que
> maneje datos reales y dinero debe ser revisado/ejecutado por un desarrollador con
> experiencia en backend y seguridad. No comprometer estos puntos por velocidad.

## 4. Jerarquía de roles

De mayor a menor alcance de decisión. El alcance decrece hacia abajo; la participación en
la operación diaria aumenta.

| # | Rol | Función |
|---|-----|---------|
| 1 | Dueño del corporativo | Visibilidad total del corporativo. Estrategia, sin operación. |
| 2 | Socios | Visibilidad total. Consulta y estrategia. |
| 3 | Gerente general | Consolidado de todos los antros del corporativo. |
| 4 | Gerente individual | Su antro completo: métricas, personal, incidencias, promos. |
| 5 | Capitán operativo | Maneja piso y masa; clientes frecuentes. Escanea en mesa. |
| 6 | Capitán social | Difusión en redes; perfil más joven. Mismos permisos que el operativo. |
| 7 | Hostess | Escaneo en puerta; asigna y mueve mesa. |
| 8 | RP | Crea reservas, comparte QR, ve solo lo suyo y el feed social. |
| 9 | Cadenero | Fuera de la jerarquía de decisión. Solo registra ingresos. |
| — | Cajero | Función única de caja: captura consumo + consulta "C. Mínimos". |
| — | Súper Admin (MABI) | Transversal, dos personas. Alta de corporativos, promociones, planes, soporte. |

- Capitán operativo y social tienen permisos **IDÉNTICOS** en la app; difieren solo en
  perfil/función. El operativo se lista primero por convención.
- Cadenero: ejecuta, no decide. Sus criterios de admisión viven fuera de la app. Permisos
  mínimos.

## 5. Matriz de permisos (denegación por defecto)

Capitán agrupa operativo y social. Gerente agrupa individual y general (difieren en
alcance por aislamiento multi-tenant). `$` = permitido; vacío = denegado.

| Acción | Cliente | Cadenero | Cajero | Hostess | Capitán | Gerente | Súper Admin |
|--------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Crear reserva | $ | | | | $ | $ | $ |
| Compartir QR | | | | | $ | | |
| Cancelar reserva propia | $ | | | | | | |
| Escanear en puerta | | $ | | $ | | | |
| Marcar "llegó" | | $ | | $ | | | |
| Acceso manual con motivo | | $ | | $ | | | |
| Override de amarillo | | $ | | $ | | | |
| Contador sin reserva | | $ | | | | | |
| Capturar consumo de mesa | | | $ | | | | $ |
| Consultar C. Mínimos | | | $ | | | | $ |
| Asignar / mover mesa | | | | $ | $ | $ | |
| Escanear en mesa | | | | | $ | | |
| Hacer cumplir consumo mínimo | | | | | $ | | |
| Acuse "promo aplicada" | | | | | $ | | $ |
| Ver desempeño de RPs | | | | | $ | $ | $ |
| Ver métricas del antro | | | | | | $ | $ |
| Exportar datos extraíbles | | | | | | $ | $ |
| Panel Cadena (incidencias) | | | | | | $ | $ |
| Gestionar personal | | | | | | $ | $ |
| Generar / revocar invitaciones | | | | | $ | $ | $ |
| Crear / cargar promociones | | | | | | | $ |
| Alta de corporativos | | | | | | | $ |
| Feature flags y planes | | | | | | | $ |

## 6. Reglas de negocio clave

### Cuentas e invitaciones

- Toda cuenta nace como **cliente final** (nombre, usuario, contraseña, correo
  confirmado, teléfono).
- No hay botón público de "unirme a un corporativo" ni selección de roles. El acceso de
  personal se recibe **por invitación**, nunca se solicita.
- Escalera de invitación (nadie invita a un rango igual o superior): Capitán → solo RPs.
  Gerente → capitanes, hostess, cajeros, cadeneros, RPs. Súper Admin → del gerente
  individual hacia arriba y cualquier rol.
- La invitación es un código/enlace **no adivinable** con corporativo + antro + rol
  amarrados, de **un solo uso**, con **caducidad** (72h por defecto, editable). Para
  reclutamiento masivo (p. ej. 40+ RPs): usos múltiples con tope.
- Generar la invitación **ES** la aprobación. El invitador puede revocar al instante.
- 3 intentos fallidos de código bloquean temporalmente el ingreso de códigos (editable).
- Existe un campo discreto de "código de invitación" en el perfil. No se anuncia en
  pantallas públicas.

### Reserva

- Confirmación **instantánea**, sin aprobación.
- Dos modalidades, configurables por antro:
  - **Acceso:** garantiza entrada (lugar + QR), sin mesa.
  - **Mesa:** garantiza mesa específica, SIEMPRE con consumo mínimo (monto por mesa,
    configurable con el corporativo).
- **Cupo máximo** configurable por antro y por evento.
- Al llenarse: configurable entre **cerrar** o **lista de espera**. En lista de espera, al
  liberarse un lugar se ofrece al siguiente automáticamente.
- **Ventana de cancelación:** hora límite del mismo día, configurable por antro. Cancelar
  antes = limpio (no penaliza, libera lugar). Cancelar después o no presentarse = no-show.

### QR

- Un QR por cada invitado marcado (5 px = 5 QR).
- Identificador **persistente y firmado** criptográficamente, NO boleto de un solo uso.
  Lo que se consume es el derecho de entrada.
- Modelo **distribuido/reclamado**: el invitado abre el enlace → el QR pasa a
  "distribuido" → ese es el que la puerta espera. Un QR nunca distribuido no penaliza a
  nadie.
- Mismo QR, dos usos según rol y etapa: **puerta** (cadenero/hostess, marca llegó y
  descuenta acceso) y **mesa** (capitán, trae promo/mesa/RP). Un escaneo de mesa no sirve
  para entrar por puerta.

### Puerta (validación verde/amarillo/rojo)

- **Verde:** invitado válido, hay cupo → marca llegó, descuenta acceso, registra con hora.
- **Amarillo:** QR de la reserva pero sin accesos restantes → alerta, no bloquea, decide
  el cadenero con motivo.
- **Rojo:** QR no corresponde o ya usado para entrar → no permite acceso.
- Pantalla de puerta muestra: nombre de reserva, RP, px esperados y cuántos faltan
  ("2/3 distribuidos adentro").

### Acceso manual (6 motivos)

Cuando un QR falla pero la persona es de la reserva, se registra ingreso manual con
motivo. Nota opcional siempre; "Otro" exige explicación obligatoria y escala al panel
Cadena.

1. QR no escanea
2. Cliente sin celular / sin batería
3. Invitado extra autorizado
4. La app no abre / error de la app
5. Reserva no aparece / error de sincronización
6. Otro (explicación obligatoria)

El caso de QR que falla se registra como acceso manual **sin alterar** el estado "llegó"
original ni el QR.

### Mesa

- Obligatoria en cada reserva que llega, por protocolo. La asigna la hostess (o
  capitán/gerente) al ingresar.
- **Historial encadenado**, no se sobrescribe: asignación inicial (no se borra) →
  movimientos (con hora y responsable). "Mesa actual" = último eslabón.
- v1: texto libre. Migrar a lista precargada por antro cuando se conozca el reparto.

### Consumo y promociones

- El mesero NO escanea (no usa celular en piso). Solo el capitán escanea en mesa.
- Promociones **preautorizadas** antes de subir → no requieren autorización al aplicar. El
  capitán marca "promo aplicada" como acuse de entrega (registro, no autorización). El
  cliente final nunca lo marca.
- Notificación al RP al escanear en mesa: condicional, solo si se requiere su presencia.
- AFORO muestra y registra la promo pero NO la aplica en el POS del antro (ellos tienen su
  propio POS).
- Las promociones son **exclusivas de los dos Súper Admin** (MABI). Nadie del corporativo
  las sube. Es la palanca de monetización.

### Cajero

- Captura el **consumo real** de cada mesa con reserva al cierre de cuenta (exclusivo del
  cajero y, como soporte, Súper Admin). Alimenta el ranking de consumo.
- Consulta la ventana "C. Mínimos": todas las reservas por app con consumo mínimo y su
  monto, como dato de referencia NO editable.
- El cajero NO valida ni hace cumplir el mínimo.

### Consumo mínimo

- Mesa asegurada = consumo mínimo, siempre. El monto varía por exclusividad de la mesa (se
  define con el corporativo).
- Quien hace cumplir la condición es el **capitán**: si la mesa no cumple, la cambia a una
  menos exclusiva; si no hay, invita a retirarse.
- Comportamiento configurable para eventos masivos (sobre todo regreso a clases).

### Detección de fantasmas

- **No-show** = QR distribuido que nunca fue escaneado en puerta. Los nunca distribuidos
  no penalizan.
- Componentes: huella de identidad (teléfono normalizado, correo, device ID, patrones),
  score de reputación (show rate), alertas automáticas (múltiples reservas mismo
  día/venue, nombres genéricos repetidos, mismo teléfono distintos nombres), acciones
  graduadas (alerta, límite, depósito en garantía [fase posterior], bloqueo).
- Umbral del score configurable desde Súper Admin.

### Cadenero (interfaz mínima)

- Vista distinta a todos: **dos botones**.
- Botón 1 — Escanear QR: cámara → semáforo. Dentro vive la opción de error (6 motivos +
  nota).
- Botón 2 — Contador (sin reserva): clicker. "+1" dominante y grande; "−1" discreto al
  lado para corregir.
- El contador arranca en ceros cada noche pero persiste como métrica por día operativo.
- **Penetración** = entradas con reserva (QR) vs sin reserva (contador). Termómetro de
  adopción.

### Hitos y red social

- Feed tipo red social, visible para roles operativos.
- **Insignias** = logros permanentes en el perfil (no se reinician). Solo dan
  visibilidad/estatus, sin bonos desde AFORO. Cifras configurables. Base:
  - Constancia: 15 reservas completas en una noche.
  - Máquina de ventas: 250 mil en consumo en una noche.
  - Confiabilidad: show rate ≥ 85% sostenido en el mes.
  - Cero fantasmas: un mes sin no-shows.
  - Volumen histórico: 1,000 personas traídas en total.
- **Ranking de consumo** = semanal (se reinicia). Top 3: medalla dorada (con
  condecoraciones por rachas), plateada, bronce. En el feed se muestran medallas y
  posiciones, no montos (cifras exactas solo de gerente hacia arriba; cada RP ve las
  suyas).
- Solo cuentan check-ins **verificados**, nunca fantasmas.
- Metas diferenciadas por rol: al RP se le exige volumen alto; al capitán mucho menos.
- "Reserva completa" = se realizó y la persona llegó (lo contrario de fantasma).

### Panel Cadena (incidencias)

- Concentra toda anomalía: accesos manuales, overrides de amarillo, alertas de fantasma,
  motivos "Otro". Con hora y responsable. Lo ve el gerente.
- (El término "Cadena" queda libre para este panel; los antros se agrupan en
  "corporativos".)

### Datos extraíbles

- Ventana "DATOS EXTRAÍBLES" con un botón por reporte. Al pulsar: elegir formato (Excel,
  PDF o ambos) + rango de fechas → Generar.
- 7 reportes: (1) Reservas del periodo, (2) Desempeño de personal, (3) Afluencia y
  penetración, (4) Consumo, (5) Reservas fantasma, (6) Incidencias, (7) Promociones.
- Acceso por matriz: gerente exporta su antro; gerente general el consolidado; Súper Admin
  todo.

## 7. Notificaciones

| Destinatario | Evento | Configurable |
|---|---|---|
| Cliente | Confirmación de reserva | Base |
| Cliente | Recordatorio el día del evento | Base |
| Cliente | Entró a lista de espera | Base |
| Cliente | Se liberó su lugar | Base |
| Cliente | Acuse de cancelación | Base |
| RP | Capitán escanea su mesa (si se requiere presencia) | Sí |
| RP | Desbloquea insignia nueva | Base |
| RP | Entra al top 3 del ranking semanal | Base |
| RP | Un cliente suyo no se presentó | Base |
| Invitador | Alguien reclama su invitación | Base |
| Gerente | Resumen al cierre de la noche | Base |
| Gerente | Incidencia entra al panel Cadena | Base |
| Gerente | Cliente cae en su límite de score (posible fantasma) | Sí (apagada por defecto) |
| Gerente | Se alcanza el cupo del antro | Sí (apagada por defecto) |

## 8. Plan de construcción (4 módulos)

El proyecto se construye en cuatro secciones, en orden. Cada una se apoya en la anterior;
la base de datos contempla las cuatro desde el inicio.

1. **Fundación + App del Cliente** — arquitectura base, multi-tenant, modelo de datos
   completo, seguridad base; registro/login, explorar antros, catálogo de eventos, crear
   reserva (acceso/mesa), QR distribuible, mis reservas, cancelación, base del enlace de
   reclamo del RP.
2. **Operación en piso** — vista de dos botones del cadenero, escaneo de puerta
   (verde/amarillo/rojo) con acceso manual y motivos, contador de penetración,
   asignación/movimiento de mesa de la hostess, escaneo de mesa del capitán con acuse de
   promo y consumo mínimo.
3. **Red social y perfil del staff** — feed, insignias permanentes, ranking semanal de
   consumo, perfil del RP, vista del cajero (captura + "C. Mínimos"), motor de detección
   de fantasmas.
4. **Paneles de gestión** — métricas del antro, panel Cadena, DATOS EXTRAÍBLES (7
   reportes), gestión de invitaciones, panel de Súper Admin (corporativos, promociones,
   planes, parámetros configurables, feature flags).

## 9. Identidad visual

- **App del cliente:** estética de vida nocturna. Modo oscuro por defecto, tipografía
  marcada, alto contraste. El QR es protagonista de la pantalla posterior a la reserva.
- **App del personal:** más utilitaria y densa en datos, tipo tablero.
- Iconografía consistente, **sin emoji**.
- Front-end intuitivo y fácil para todos los perfiles.

## 10. Pendientes externos (no bloquean el código)

- Precios y montos de consumo mínimo por mesa → reunión con el corporativo.
- Revisión legal (LFPDPPP mexicana, NO GDPR; aviso de privacidad, consentimiento de huella
  de dispositivo, contrato con corporativos) → abogado.
- Validación de marca "AFORO" (IMPI, dominio, tiendas).
- Migración del catálogo de mesas (texto libre → lista por antro).
- Plan de piloto.

## 11. Convenciones para Claude Code

- Comenta el código en **español**.
- Antes de implementar algo que contradiga este archivo, dilo y espera confirmación.
- Mantén el aislamiento multi-tenant y la denegación por defecto en CADA endpoint nuevo.
- Cada parámetro de negocio nuevo: ponlo en la tabla de configuración, no quemado en
  código.
- Genera datos de demostración (seed) para poder navegar lo construido.
- Mantén un README con cómo correr el proyecto y un registro de qué módulo está hecho.
