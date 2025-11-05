# Integración de Supabase

Este proyecto usa Supabase para base de datos, autenticación y almacenamiento de archivos.

## Configuración

### 1. Variables de entorno

Crea un archivo `.env` en la raíz del proyecto (copiando de `.env.example`) y agrega:

```bash
# Supabase Configuration
SUPABASE_URL="https://tu-proyecto.supabase.co"
SUPABASE_ANON_KEY="tu-anon-key"
SUPABASE_SERVICE_ROLE_KEY="tu-service-role-key"
SUPABASE_JWT_SECRET="tu-jwt-secret"
SUPABASE_STORAGE_BUCKET="beauty-saas"
SUPABASE_STORAGE_PUBLIC_URL="https://tu-proyecto.supabase.co/storage/v1/object/public"
```

### 2. Obtener credenciales

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Crea un proyecto nuevo o selecciona uno existente
3. Ve a **Settings** → **API**
4. Copia:
   - Project URL → `SUPABASE_URL`
   - anon/public key → `SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY` (¡NO expongas esto en el frontend!)
   - JWT Secret → `SUPABASE_JWT_SECRET`

### 3. Configurar Base de Datos

#### Opción A: Usar Supabase como base de datos principal

Actualiza tu `DATABASE_URL` para usar la conexión de Supabase:

```bash
# En Settings → Database → Connection string → URI
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres"
```

Ejecuta las migraciones:

```bash
pnpm prisma migrate dev
```

#### Opción B: Mantener Prisma + Supabase Auth separados

Puedes mantener tu base de datos Postgres actual y usar solo Supabase Auth + Storage.

### 4. Configurar Storage

1. Ve a **Storage** en el dashboard de Supabase
2. Crea un bucket llamado `beauty-saas` (o el nombre que uses en `SUPABASE_STORAGE_BUCKET`)
3. Configura las políticas de acceso (RLS):
   - Para archivos públicos: permite `SELECT` a todos
   - Para uploads: permite `INSERT` solo a usuarios autenticados

```sql
-- Ejemplo de política para permitir lectura pública
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'beauty-saas');

-- Ejemplo de política para permitir uploads autenticados
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'beauty-saas' AND auth.role() = 'authenticated');
```

## Uso

### Autenticación

#### Registro de usuario

```bash
POST /api/auth/signup
Content-Type: application/json

{
  "email": "usuario@example.com",
  "password": "contraseña-segura",
  "metadata": {
    "fullName": "Nombre Completo",
    "phone": "+123456789"
  }
}
```

#### Iniciar sesión

```bash
POST /api/auth/signin
Content-Type: application/json

{
  "email": "usuario@example.com",
  "password": "contraseña-segura"
}
```

Respuesta:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "...",
  "user": {
    "id": "uuid",
    "email": "usuario@example.com",
    "metadata": { ... }
  }
}
```

#### Usar el token en peticiones

```bash
GET /api/v1/clientes
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Storage

El servicio de Storage implementa la interfaz `IStorageService`:

```typescript
import { Inject, Injectable } from '@nestjs/common';
import { IStorageService } from './common/infra/storage/storage.interface';

@Injectable()
export class MiServicio {
  constructor(
    @Inject('IStorageService')
    private readonly storageService: IStorageService,
  ) {}

  async subirArchivo(file: Buffer, nombre: string) {
    const url = await this.storageService.uploadFile(
      `uploads/${nombre}`,
      file,
      { contentType: 'image/jpeg' }
    );
    return url;
  }

  async obtenerUrl(ruta: string) {
    return this.storageService.getPublicUrl(ruta);
  }

  async eliminarArchivo(ruta: string) {
    await this.storageService.deleteFiles([ruta]);
  }
}
```

### Guard de Autenticación

Para proteger rutas con autenticación de Supabase:

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from './common/auth/supabase/supabase-auth.guard';

@Controller('protegido')
@UseGuards(SupabaseAuthGuard)
export class MiController {
  @Get()
  obtenerDatosProtegidos() {
    return { mensaje: 'Solo accesible con token válido' };
  }
}
```

El guard extrae el usuario del token y lo adjunta a `request.user`.

## Migración desde JWT actual

Si ya tienes usuarios con JWT propio:

1. **Opción 1 - Migración total**: Importa usuarios a Supabase Auth usando el Admin API
2. **Opción 2 - Híbrido**: Mantén ambos sistemas y usa guards condicionales
3. **Opción 3 - Gradual**: Nuevos usuarios usan Supabase, existentes siguen con JWT hasta que cambien contraseña

## Ventajas de Supabase

✅ Autenticación robusta sin mantenimiento  
✅ Storage escalable con CDN incluido  
✅ Base de datos Postgres con backups automáticos  
✅ Row Level Security (RLS) para permisos granulares  
✅ Webhooks y real-time integrados  
✅ Panel de administración visual  

## Recursos

- [Supabase Docs](https://supabase.com/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
