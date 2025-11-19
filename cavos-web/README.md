# Cavos Web

Backend API y landing page para Cavos - Infraestructura invisible de cripto para Starknet.

## 🏗️ Arquitectura

### Autenticación

- **Supabase Auth**: Para developers (email + password)
  - Registro de usuarios
  - Creación de organizaciones
  - Gestión de apps

- **Auth0**: Para end users (Google + Apple)
  - Creación de wallets
  - Autenticación en apps de terceros

### Base de Datos (Supabase)

```
auth.users (Supabase)
├── public.profiles
├── public.organizations
└── public.apps
```

## 🚀 Setup

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Copia `.env.local.example` a `.env.local` y configura:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# Auth0 (para wallets de usuarios finales)
AUTH0_SECRET=tu_auth0_secret
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=tu_dominio_auth0
AUTH0_CLIENT_ID=tu_client_id
AUTH0_CLIENT_SECRET=tu_client_secret
```

### 3. Ejecutar migraciones de Supabase

En tu proyecto de Supabase, ejecuta:

```sql
-- Copia y pega el contenido de:
-- supabase/migrations/20250119_initial_schema.sql
```

O usando Supabase CLI:

```bash
supabase db push
```

### 4. Iniciar el servidor de desarrollo

```bash
npm run dev
```

Visita [http://localhost:3000](http://localhost:3000)

## 📁 Estructura del Proyecto

```
cavos-web/
├── app/
│   ├── (auth)/          # Rutas de autenticación
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/     # Dashboard de developers
│   │   ├── organizations/
│   │   └── apps/
│   ├── api/
│   │   ├── auth/        # Auth endpoints
│   │   ├── organizations/ # CRUD de organizations
│   │   └── apps/        # CRUD de apps
│   ├── fonts/           # Fuentes locales
│   ├── globals.css      # Estilos globales
│   └── layout.tsx       # Root layout
├── lib/
│   ├── fonts.ts         # Configuración de fuentes
│   └── supabase/
│       ├── client.ts    # Cliente de Supabase (browser)
│       ├── server.ts    # Cliente de Supabase (server)
│       └── types.ts     # Tipos de DB
├── supabase/
│   └── migrations/      # Migraciones SQL
└── middleware.ts        # Auth middleware
```

## 🔑 API Endpoints

### Authentication

- `POST /api/auth/signup` - Registro de developer
- `POST /api/auth/login` - Login de developer
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Usuario actual

### Organizations

- `GET /api/organizations` - Listar organizaciones
- `POST /api/organizations` - Crear organización
- `GET /api/organizations/[id]` - Obtener organización
- `PATCH /api/organizations/[id]` - Actualizar organización
- `DELETE /api/organizations/[id]` - Eliminar organización

### Apps

- `GET /api/apps?organization_id=xxx` - Listar apps
- `POST /api/apps` - Crear app
- `GET /api/apps/[id]` - Obtener app
- `PATCH /api/apps/[id]` - Actualizar app
- `DELETE /api/apps/[id]` - Eliminar app

## 🎨 Branding

El proyecto usa el sistema de diseño de `cavos-wallet-provider`:

- **Colores**:
  - Primary: `#EAE5DC` (Warm Beige)
  - Background: `#000000` (Black)
  - Secondary BG: `#0A0A08` (Dark Brown/Black)
  - Tertiary BG: `#1E1E1E` (Dark Gray)

- **Fuentes**:
  - Headings: Romagothic Bold
  - Body: Inter

## 🔒 Seguridad

- Row Level Security (RLS) habilitado en todas las tablas
- Los usuarios solo pueden ver/modificar sus propios recursos
- Las sesiones se manejan con cookies HTTPOnly via Supabase Auth
- Auth0 client secrets se deben encriptar antes de almacenar (TODO)

## 📝 TODO

- [ ] Implementar encriptación de Auth0 client secrets
- [ ] Crear páginas de UI para login/signup
- [ ] Crear dashboard de organizations
- [ ] Crear dashboard de apps
- [ ] Integración completa de Auth0 para end users
- [ ] Landing page
- [ ] Documentación de API

## 🛠️ Tecnologías

- **Framework**: Next.js 16 (App Router)
- **Database & Auth**: Supabase
- **Social Auth**: Auth0
- **Styling**: Tailwind CSS v4
- **Type Safety**: TypeScript
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **State**: Jotai

## 📄 Licencia

Privado - Cavos 2025
