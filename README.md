# RiesgoTI — Frontend (`riesgoti-front`)

Aplicación web de **RiesgoTI**, la plataforma de gestión de incidencias operativas y gobierno de riesgos de Seguridad de la Información alineada con ISO/IEC 27005, 27001 y 27002.

Este repositorio es el submódulo `front/` del superproyecto `riesgoti`. Necesita la API del submódulo `back/` en marcha; la guía completa de arranque, los usuarios semilla y la solución de problemas están en el [README raíz](../README.md).

| Área | Tecnología |
| --- | --- |
| UI | React 19, TypeScript 6, Tailwind CSS 4 (`@tailwindcss/typography`), lucide-react, sonner |
| Bundler | Vite 8 (`@vitejs/plugin-react`), alias `@/` → `src/` |
| Estado y red | Redux Toolkit + RTK Query (caché por tags, polling, renovación automática del JWT) |
| Formularios | React Hook Form + Zod (`@hookform/resolvers`) |
| Contenido | react-markdown + remark-gfm + rehype-sanitize; react-dropzone para PDFs y evidencias |
| Calidad | ESLint 10 + typescript-eslint, `eslint-plugin-react-hooks` |

---

## 1. Requisitos

- Node.js **20.19+ o 22.12+** (lo exige Vite 8).
- pnpm 9+ (el repositorio incluye `pnpm-lock.yaml`) o npm 10+.
- La API corriendo en `http://localhost:8000` (ver `back/README.md`).

---

## 2. Puesta en marcha

```bash
cp .env.example .env          # PowerShell: Copy-Item .env.example .env
pnpm install                  # o: npm install
pnpm dev                      # o: npm run dev
```

Abre http://localhost:5173. El puerto está fijado en `vite.config.ts` y debe figurar en `CORS_ALLOWED_ORIGINS` del backend.

### Variables de entorno

| Variable | Valor por defecto | Descripción |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `http://localhost:8000/api/v1` | URL base de la API. |
| `VITE_APP_NAME` | `RiesgoTI — Gestión de Incidencias y Riesgos ISO 27005` | Nombre que muestra la aplicación. |
| `VITE_DEMO_PASSWORD` | (comentada) | Solo desarrollo. Con la contraseña de los usuarios semilla, el login muestra accesos de un clic por perfil. No la versiones. |

### Scripts

| Script | Qué hace |
| --- | --- |
| `pnpm dev` | Servidor de desarrollo con recarga en caliente. |
| `pnpm build` | Revisión de tipos (`tsc -b`) y compilación de producción en `dist/`. |
| `pnpm lint` | ESLint sobre todo el proyecto y guardián del sistema de diseño (`scripts/check-design-tokens.mjs`). |
| `pnpm preview` | Sirve localmente la compilación de `dist/`. |
| `pnpm test:e2e` | Suite E2E completa (Playwright): recrea el stack Docker aislado, ejecuta los flujos de los tres roles y lo destruye. |
| `pnpm test:e2e:keep` | Igual que `test:e2e`, pero deja el stack E2E levantado al terminar para inspeccionarlo. |
| `pnpm test:e2e:reuse` | Usa el stack E2E si ya responde (o lo levanta si no) y no lo destruye. Útil para iterar sobre una prueba. |
| `pnpm test:e2e:smoke` | Solo la prueba de humo del login, sin Docker. |
| `pnpm test:e2e:ui` | Modo interactivo de Playwright (UI Mode) sobre el stack reutilizado. |
| `pnpm test:e2e:report` | Abre el último reporte HTML (`playwright-report/`). |

Antes de cada commit ejecuta `pnpm build && pnpm lint`.

### Pruebas E2E (Playwright)

Las pruebas usan la aplicación como lo haría una persona: escriben en los campos, pulsan botones, usan el teclado, adjuntan archivos desde el selector y esperan a que la IA responda, contra el backend real (Django + Celery + PostgreSQL + FAISS).

**No hace falta levantar Docker a mano.** `e2e/support/global-setup.ts` levanta el stack aislado de `docker-compose.e2e.yml` (proyecto `riesgoti-e2e`) y espera a que esté sano (`migrate` + `seed_riesgoti` + worker respondiendo). Solo debe estar abierto Docker Desktop.

- **Aislado de desarrollo:** base de datos en memoria, `storage/` propio (PDF, evidencias e índices FAISS), API en `http://localhost:8001` y front en `http://localhost:5174`. Tus datos de `docker compose up` (puertos 8000 / 5173) nunca se tocan, y ambos stacks pueden convivir.
- **Reutiliza** la imagen `riesgo_ti-backend` y la caché del modelo de embeddings, así que no reconstruye ni descarga nada. El arranque tarda alrededor de 1 minuto; la suite completa, unos 4 a 5 minutos.
- **Determinista:** sin API key en la BD sembrada, la IA trabaja en modo extractivo local (no consume la cuota de Gemini). Los textos de las incidencias que dependen de la búsqueda semántica son fijos (`e2e/support/incidents.ts`), con su similitud medida contra la semilla.
- **Modo del stack** (`E2E_STACK`, lo fijan los scripts mediante `e2e/support/run.mjs`): `fresh` (por defecto), `keep`, `reuse` u `off`. En `reuse` el estado puede venir sucio de una ejecución anterior; las decisiones de riesgo son irreversibles, así que para repetir `risk-workflow.spec.ts` usa `fresh`.
- **Instalación inicial del navegador** (una vez por equipo): `pnpm exec playwright install chromium`.

| Archivo | Cubre |
| --- | --- |
| `e2e/auth.setup.ts` | Inicia sesión por formulario con cada usuario semilla y guarda la sesión en `e2e/.auth/` (ignorado por Git). |
| `e2e/smoke.spec.ts` | Login público: título SEO, `<main>`, un único `<h1>` y formulario accesible. |
| `e2e/auth.spec.ts` | Credenciales inválidas, mostrar/ocultar contraseña, menú por rol, sesión al recargar, «Salir», «Saltar al contenido» y «Mi cuenta». |
| `e2e/reporter.spec.ts` | Validaciones del formulario, evidencias, orientación con citas y panel de fuente, «Sí, funcionó» (INV-02), «No funcionó», `SIN_RESPALDO` (INV-01), caso sensible, búsqueda/filtros/orden/paginación y confidencialidad. |
| `e2e/analyst.spec.ts` | Ciclo N2 completo con tres sesiones (reportante, analista asignado y otro analista), reintento del análisis de riesgo, filtros de la cola e historial, resumen y consultas de solo lectura. |
| `e2e/risk-workflow.spec.ts` | Retirar/restaurar incidencias, cambio de activo justificado, matriz 5×5 con ratón y teclado, validación con y sin fuentes, corrección (v+1) y rechazo, registro de riesgos y comparación de versiones. |
| `e2e/admin.spec.ts` | Panel, activos, matriz (descartar y publicar), carga y procesamiento real de PDF con previsualización/autorización/activación/nueva versión, reintento de PDF con error, configuración IA/RAG, usuarios (alta, login y desactivación), roles con segregación de funciones, auditoría y modo lectura (INV-05). |

Guías: skills `testing-playwright` y `playwright-best-practices` (`agents/skills_index.md`).

---

## 3. Portales por rol

Tras el login, `App.tsx` carga en diferido (`lazy`) solo el portal del rol autenticado (claim `rol_codigo` del JWT). La navegación usa **React Router** (`react-router-dom`, `BrowserRouter`) con URLs limpias (`/documents`, `/my-incidents/42`, `/proposals/7`): recargar, compartir el enlace o usar atrás/adelante conserva la vista.

- **Rutas centralizadas:** todas las rutas salen de `src/constants/routes.constants.ts` (`ROUTE_PATHS` para declarar `<Route path>`, `ROUTES` para navegar, con constructores tipados como `ROUTES.RISK_DETAIL(id)`); los textos del menú, de `src/constants/navigation.constants.ts`. Nunca escribas una ruta a mano (skills `react-router-dom-patterns` y `constants-no-magic-strings`). La suite E2E importa las mismas constantes (`e2e/support/routes.ts`).
- **Guardias:** `ProtectedRoute` envía a `/login` sin sesión y, tras autenticarse, vuelve a la ruta pedida; `PermissionRoute` redirige al inicio del portal si falta el permiso RBAC (por ejemplo, el Administrador no puede abrir `/support`, INV-05). Las rutas inexistentes también llevan al inicio del portal.
- **Detalles:** cada detalle cuelga de su sección (`/incidents/:incidentId`, `/support/:incidentId`, `/risks/:riskId`, `/proposals/:versionId`), que queda resaltada en el menú (`NavLink`). Las páginas reciben el id por props (`RouteIdParam`) y no dependen del router.
- **Despliegue:** el servidor que publique `dist/` debe responder `index.html` a cualquier ruta desconocida (*SPA fallback*). `pnpm dev` y `pnpm preview` ya lo hacen.

| Rol | Portal | Secciones |
| --- | --- | --- |
| Reportante | `pages/reporter/ReporterPortal.tsx` | Inicio (reportar incidencia), Mis incidencias con orientación de la IA y citas, Mi cuenta |
| Analista | `pages/staff/AnalystPortal.tsx` | Resumen, Incidencias, Atención de incidencias (cola N2), Propuestas de riesgo (agrupación, evaluación 5×5 y decisión), Registro de riesgos, Activos, Matriz, Mi cuenta |
| Administrador | `pages/admin/AdminPortal.tsx` | Resumen, consulta de incidencias, riesgos y propuestas; Activos, Matriz, Documentos, Configuración IA/RAG, Usuarios, Roles y permisos, Auditoría, Mi cuenta |

Cada sección se muestra u oculta según los permisos del token (`riesgo.consultar`, `documento.administrar`, etc.). `RequirePermission` protege las acciones y, con `forbidAdminSoD`, impide que el Administrador evalúe o decida riesgos (segregación de funciones, ISO/IEC 27001). El manual de cada rol está en `docs/manuales/` del superproyecto.

---

## 4. Arquitectura

El código sigue una arquitectura limpia de 5 capas. **Ninguna página ni componente hace llamadas de red directamente**: no se usa `fetch` ni `axios` fuera de RTK Query.

```text
Servicio API (RTK Query) → Mapper/Adapter → Custom Hook (caso de uso) → Página contenedora → Componente presentacional
     src/app/api/             src/mappers/        src/hooks/                 src/pages/            src/components/
```

```text
src/
├── app/
│   ├── api/            # baseApi (fetchBaseQuery + reautenticación) y authApi, adminApi, incidentsApi, risksApi
│   ├── store.ts        # store de Redux
│   └── hooks.ts        # useAppDispatch / useAppSelector tipados
├── types/
│   ├── api.types.ts    # DTOs tal como los envía/recibe la API (snake_case)
│   └── domain.types.ts # modelos de dominio que consume la UI
├── mappers/            # fromApiToDomain / fromDomainToApi por módulo (*.mapper.ts)
├── schemas/            # esquemas Zod de formularios (*.schema.ts)
├── hooks/              # casos de uso: admin/, incidents/, risks/ y hooks de sesión y navegación
├── pages/              # contenedores: LoginPage, AccountPage y portales admin/, reporter/, staff/, risk/
├── components/         # presentacionales por dominio + PageMeta (seo/), AppShell (layout/), CitationDrawer
├── features/           # slices de Redux: auth (sesión y RequirePermission) y ui
└── lib/                # utilidades: errores de API, formato, etiquetas, descargas
```

| Capa | Responsabilidad | Ejemplo |
| --- | --- | --- |
| Servicio API | Declara endpoints con `baseApi.injectEndpoints` y los tags que proveen o invalidan. | `incidentsApi.ts` |
| Mapper | Convierte DTOs ↔ dominio; absorbe cambios del contrato para no romper la UI. | `incidents.mapper.ts` |
| Custom Hook | Orquesta queries, mutaciones, polling y estado de la vista. | `useOperationalGuidance.ts` |
| Página | Usa el hook, define `<PageMeta />` y el `<h1>`, y pasa props a los componentes. | `IncidentDetailPage.tsx` |
| Componente | Solo presenta datos y emite eventos; sin acceso a red ni a Redux. | `OperationalGuidanceSection.tsx` |

### Sesión y caché

- Los tokens se guardan en el slice `auth` (persistido en `localStorage`). `baseApi` añade `Authorization: Bearer` y, ante un `401`, renueva una sola vez con `auth/refresh/` aunque haya peticiones concurrentes. Si la renovación falla, cierra la sesión.
- Tags de caché: `AIConfig`, `DocumentVersion`, `Incident`, `OperationalGuidance`, `RiskVersion`, `RiskDashboard`, `MatrixConfig`, `Asset`, `User` y `Role`. Toda mutación invalida los tags afectados en lugar de actualizar el estado a mano.

| Polling (encapsulado en hooks) | Intervalo | Se detiene cuando |
| --- | --- | --- |
| Documentos en `PROCESANDO` (`useKnowledgeBaseManager`) | 3000 ms | Ninguna versión sigue procesándose |
| Orientación operativa (`useOperationalGuidance`) | 2500 ms | La tarea de IA queda `COMPLETADA` |
| Rama estratégica en detalle de incidencia | 5000 ms | El análisis termina |
| Lista del Reportante con incidencias pendientes | 5000 ms | No quedan pendientes |
| Cola de atención N2 (`useSupportQueue`) | 15000 ms | Se sale de la vista de cola (pausa si la pestaña no tiene foco) |

### Formularios

Todo formulario usa `useForm` con `zodResolver(schema)`, y los datos se transforman con `fromDomainToApi` antes de la mutación. Los errores de validación del backend se proyectan sobre los campos con `components/forms/applyServerErrors.ts`. Reglas destacadas:

- `aiConfig.schema.ts`: `chunk_overlap < chunk_size / 2`.
- `riskEvaluation.schema.ts`: con `accion === 'VALIDADA'` exige probabilidad e impacto (1–5), justificación de 15 caracteres o más y `justificacion_sin_fuentes` si no hay citas estratégicas.

### Citas y Markdown

La orientación de la IA y las fuentes se renderizan con `react-markdown` + `remark-gfm` + `rehype-sanitize`. Al pulsar una cita se abre `CitationDrawer` (un `<aside>` montado una sola vez en `App.tsx`) con el fragmento citado y su rango de páginas.

### Sistema de diseño

Tailwind CSS v4 con tokens propios en `src/index.css` (`@theme`). La raíz del documento mide 14 px, así que la escala `rem` por defecto de Tailwind no cuadra: **la escala tipográfica y los radios están definidos en píxeles** y son los únicos valores permitidos (roadmap `v0.7`, CHG-0019 a CHG-0023).

| Escala tipográfica | `text-2xs` 11 · `text-xs` 12 · `text-sm` 13 · `text-base` 14 · `text-md` 15 · `text-lg` 16 · `text-xl` 18 · `text-2xl` 24 · `text-3xl` 28 px |
| :--- | :--- |
| **Radios** | `rounded-bar` 4 · `rounded-inset` 8 · `rounded-control` 10 (botones, inputs) · `rounded-tile` 12 · `rounded-card` 14 · `rounded-card-mobile` 18 · `rounded-sheet` 22 px |
| **Color** | Solo tokens semánticos: `ink`, `primary`, `primary-hover`, `primary-pressed`, `deep`, `soft`, `canvas`, `line`, `control`, `muted`, `mid`, `disabled`, `focus`. |
| **Foco** | Anillo global en `@layer base`: contorno `focus` (primario, ≥ 3:1) de 2 px, separado 2 px. Para trasladarlo a un contenedor, `focusRingClassName` (`within` / `delegated`). |

Los tamaños de texto no fijan interlineado (`--text-*: initial`): el texto hereda el de su contenedor. Usa `cn()` de `@/lib/utils` para combinar clases; ya conoce los tokens propios (sin esa configuración, `tailwind-merge` tomaría `text-md` por un color).

**Piezas reutilizables.** Antes de escribir clases para un patrón repetido, usa la pieza que ya existe:

| Necesitas | Usa | Dónde |
| :--- | :--- | :--- |
| Una tarjeta | `<Card as="section\|article\|aside">` (con `cardClassName.padded` si no tiene cabecera); para otro elemento, `cardClassName.base` | `components/ui.tsx`, `styles/tokens.layout.ts` |
| La cabecera de una página | `<PageHeader>` (único `<h1>`) | `components/ui.tsx` |
| El título de una sección o tarjeta | `<SectionTitle as="h2\|h3\|h4" icon={…}>` | `components/ui.tsx` |
| Volver a la sección de origen | `<BackLink onClick={…}>` | `components/ui.tsx` |
| Un campo de formulario | `<Field>` + `inputClassName(hasError)`; pie de acciones con `fieldClassName.footer` | `styles/tokens.form.ts` |
| Una tabla de datos | `tableClassName` (`table`, `thead`, `th`, `tbody`, `tr`, `td`, `tdMuted`…); para tablas de muchas columnas que en móvil se apilan como tarjetas, `tableClassName.dense` | `styles/tokens.table.ts` |
| Identificadores técnicos (INC-0001) | `<Mono>` / `monoClassName` | `components/ui.tsx`, `styles/tokens.layout.ts` |

Con `cn()`, pon primero el objeto canónico y después las clases propias del caso: las últimas prevalecen (`cn(tableClassName.dense.cellXl, 'xl:text-right')`).

**Excepciones documentadas:** el comparador de versiones (`VersionCompareTable`) mantiene su relleno compacto de pares clave/valor; el aviso de orientación sin respaldo, los KPI del Reportante y la barra fija de decisión no son tarjetas estándar. Fuera de alcance: modo oscuro.

**Guardián en `pnpm lint`.** `scripts/check-design-tokens.mjs` falla, indicando archivo y línea, si en `src/` aparece un tamaño de texto o un radio en píxeles (`text-[13px]`, `rounded-t-[22px]`) o un color hexadecimal en una clase (`bg-[#2563eb]`). Los valores arbitrarios de tamaño de caja o rejilla (`max-h-[92vh]`, `grid-cols-[1fr_auto]`) siguen permitidos.

---

## 5. Convenciones obligatorias

Antes de contribuir revisa `CLAUDE.md` y `agents/rules/clean_code_and_architecture.md` en el superproyecto. Lo esencial:

- **HTML5 semántico.** Usa `<main>`, `<section>`, `<article>`, `<header>`, `<nav>`, `<aside>`, `<fieldset>` y `<footer>` en lugar de anidar `<div>`, más atributos `aria-*` (`aria-live` en contenido que se actualiza por polling).
- **SEO por vista.** Cada página declara `<PageMeta title="…" description="…" />`, un único `<h1>` y una jerarquía `<h2>`–`<h6>` coherente.
- **Sin datos simulados.** Los flujos productivos consumen siempre la API vía RTK Query.
- **Tipos estrictos.** Los DTOs viven en `api.types.ts` y los modelos de dominio en `domain.types.ts`. Los componentes nunca reciben DTOs crudos.
- **Importaciones con `@/`.** Por ejemplo, `import { useAuthSession } from '@/hooks/useAuthSession'`.

### Agregar un módulo nuevo

1. Tipa los DTOs en `types/api.types.ts` y el modelo en `types/domain.types.ts`.
2. Inyecta los endpoints en el servicio correspondiente de `app/api/`, con `providesTags`/`invalidatesTags`.
3. Escribe el mapper en `mappers/<modulo>.mapper.ts` y, si hay formulario, el esquema en `schemas/<modulo>.schema.ts`.
4. Crea el hook de caso de uso en `hooks/<area>/use<Caso>.ts`.
5. Crea la página contenedora en `pages/` y los componentes presentacionales en `components/<dominio>/`.
6. Declara la ruta en `constants/routes.constants.ts` y su `<Route>` en el portal del rol, dentro del `PermissionRoute` de su permiso; si va en el menú, añade su entrada con un texto de `constants/navigation.constants.ts`.

---

## 6. Control de versiones

Este repositorio es un submódulo: haz commit aquí primero y luego actualiza la referencia en el superproyecto (`git add front`). No se versionan `.env`, `node_modules/`, `dist/`, `roadmap/` ni `desktop.ini`. Los `.gitattributes` fijan el fin de línea en LF.
