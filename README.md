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
| `pnpm lint` | ESLint sobre todo el proyecto. |
| `pnpm preview` | Sirve localmente la compilación de `dist/`. |

Antes de cada commit ejecuta `pnpm build && pnpm lint`.

---

## 3. Portales por rol

Tras el login, `App.tsx` carga en diferido (`lazy`) solo el portal del rol autenticado (claim `rol_codigo` del JWT). Cada portal navega por secciones con el hash de la URL (`#/docs`, `#/incident/42`) mediante `useHashSection`, de modo que recargar o compartir el enlace conserva la vista.

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
6. Registra la sección en el portal del rol, con su permiso.

---

## 6. Control de versiones

Este repositorio es un submódulo: haz commit aquí primero y luego actualiza la referencia en el superproyecto (`git add front`). No se versionan `.env`, `node_modules/`, `dist/`, `roadmap/` ni `desktop.ini`. Los `.gitattributes` fijan el fin de línea en LF.
