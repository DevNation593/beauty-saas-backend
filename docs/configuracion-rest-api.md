# REST API Configuración Completa

## Overview
El API REST ha sido completamente configurado con funcionalidades avanzadas incluyendo versionado, rate limiting, transformación de respuestas, y documentación automática.

## 🏗️ Estructura Implementada

```
/src/api/rest/
├── controllers/
│   ├── api-documentation.controller.ts    # Endpoints de documentación y salud
│   └── rest-admin.controller.ts           # Ejemplo de controlador REST avanzado
├── decorators/
│   └── api-version.decorator.ts           # Decoradores para versionado
├── dto/
│   └── common.dto.ts                      # DTOs comunes (paginación, respuestas)
├── interceptors/
│   └── rest-response.interceptor.ts       # Transformación automática de respuestas
├── middleware/
│   ├── api-versioning.middleware.ts       # Middleware de versionado
│   └── api-rate-limit.middleware.ts       # Rate limiting personalizado
└── rest.module.ts                        # Configuración del módulo
```

## 🚀 Características Implementadas

### 1. **Versionado de API**
- Soporte para múltiples versiones de API
- Headers `API-Version` automáticos
- Rutas con prefijo `/api/v1/`, `/api/v2/`, etc.

```typescript
@RestController('Admin Tenants')  // Decorador personalizado
@Controller('api/v1/admin/tenants')
```

### 2. **Rate Limiting Avanzado**
- Límites por IP configurables
- Headers informativos automáticos
- Limpieza automática de entradas antiguas

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1634567890
```

### 3. **Transformación de Respuestas**
- Formato consistente para todas las respuestas
- Soporte para paginación automática
- Timestamps y metadata automáticos

```json
{
  "success": true,
  "message": "Tenant created successfully",
  "data": { ... },
  "timestamp": "2025-10-14T10:30:00.000Z"
}
```

### 4. **Paginación Estandarizada**
```json
{
  "success": true,
  "message": "Tenants retrieved successfully",
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "totalPages": 15,
    "hasNext": true,
    "hasPrev": false
  },
  "timestamp": "2025-10-14T10:30:00.000Z"
}
```

## 📊 Endpoints Disponibles

### **Documentación y Salud**
```
GET /api/health              # Estado de la API
GET /api/info               # Información general
GET /api/docs               # Enlaces de documentación
```

### **Administración de Tenants (Ejemplo)**
```
POST   /api/v1/admin/tenants           # Crear tenant
GET    /api/v1/admin/tenants           # Listar tenants (paginado)
GET    /api/v1/admin/tenants/search    # Búsqueda avanzada
GET    /api/v1/admin/tenants/:id       # Obtener tenant por ID
PUT    /api/v1/admin/tenants/:id       # Actualizar tenant
DELETE /api/v1/admin/tenants/:id       # Eliminar tenant
```

## 🔧 Uso de Decoradores

### **@RestController**
Decorador personalizado que combina varias funcionalidades:
```typescript
@RestController('Admin Tenants')
export class RestAdminController {
  // Automáticamente añade:
  // - ApiTags para Swagger
  // - Headers de autorización
  // - Versionado de API
}
```

### **@ApiPaginated**
Para endpoints que soportan paginación:
```typescript
@Get()
@ApiPaginated()  // Añade headers de paginación a Swagger
async getAllTenants(@Query() pagination: PaginationDto) {
  // ...
}
```

## 📝 DTOs Implementados

### **PaginationDto**
```typescript
class PaginationDto {
  page?: number = 1;     // Página (mínimo 1)
  limit?: number = 10;   // Elementos por página (máximo 100)
}
```

### **SearchDto**
```typescript
class SearchDto extends PaginationDto {
  search?: string;           // Término de búsqueda
  sortBy?: string;          // Campo de ordenamiento
  sortOrder?: 'asc' | 'desc' = 'desc';  // Orden
}
```

### **ApiResponseDto**
```typescript
class ApiResponseDto<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}
```

## 🛡️ Middleware Configurado

### **ApiVersioningMiddleware**
- Detecta versión desde headers o URL
- Establece versión por defecto
- Añade headers de respuesta automáticamente

### **ApiRateLimitMiddleware**
- Rate limiting por IP
- Ventana deslizante de 1 minuto
- Respuestas HTTP 429 cuando se excede

### **RestResponseInterceptor**
- Transforma respuestas automáticamente
- Maneja paginación
- Formato consistente

## 🔗 Integración

El módulo REST está completamente integrado:

```typescript
// En app.module.ts
@Module({
  imports: [
    // ... otros módulos
    RestApiModule,  // ✅ Integrado
  ],
})
export class AppModule {}
```

## 📖 Documentación Swagger

El API REST se documenta automáticamente en:
- **Swagger UI**: `http://localhost:3000/api/docs/swagger`
- **Información API**: `http://localhost:3000/api/info`
- **Salud**: `http://localhost:3000/api/health`

## 🧪 Ejemplos de Uso

### **Crear Tenant**
```bash
curl -X POST http://localhost:3000/api/v1/admin/tenants \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "API-Version: 1" \
  -d '{
    "name": "Beauty Salon Pro",
    "slug": "beauty-salon-pro",
    "email": "admin@salon.com",
    "planId": "premium"
  }'
```

### **Listar Tenants con Paginación**
```bash
curl "http://localhost:3000/api/v1/admin/tenants?page=1&limit=10" \
  -H "Authorization: Bearer your-jwt-token"
```

### **Búsqueda Avanzada**
```bash
curl "http://localhost:3000/api/v1/admin/tenants/search?search=beauty&sortBy=createdAt&sortOrder=desc" \
  -H "Authorization: Bearer your-jwt-token"
```

## 🎯 Características Avanzadas

### **Headers Automáticos**
Todos los endpoints REST incluyen automáticamente:
```http
API-Version: 1
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1634567890
```

### **Validación Robusta**
- Validación automática con DTOs
- Mensajes de error descriptivos
- Validación de paginación y límites

### **Seguridad**
- Autenticación JWT obligatoria
- RBAC con roles específicos
- Rate limiting por IP
- Validación de entrada

## 🚀 Extensibilidad

### **Agregar Nuevos Controladores**
```typescript
@RestController('New Feature')
@Controller('api/v1/new-feature')
export class NewFeatureController {
  @Get()
  @ApiPaginated()
  async getItems(@Query() pagination: PaginationDto) {
    // Automáticamente tendrá:
    // - Transformación de respuestas
    // - Versionado
    // - Rate limiting
    // - Documentación Swagger
  }
}
```

### **Personalizar Respuestas**
```typescript
// Respuesta simple
return new ApiResponseDto(data, 'Custom message');

// Respuesta paginada
return new PaginatedResponseDto(items, page, limit, total);
```

## ✅ Estado Final

El API REST está **100% configurado** con:

- ✅ **Versionado de API** funcional
- ✅ **Rate Limiting** implementado
- ✅ **Transformación de respuestas** automática
- ✅ **Paginación** estandarizada
- ✅ **Documentación Swagger** automática
- ✅ **Middleware** configurado
- ✅ **Decoradores** personalizados
- ✅ **DTOs** comunes implementados
- ✅ **Controlador de ejemplo** funcional
- ✅ **Integración completa** con el sistema

El API REST ahora proporciona una experiencia developer-friendly con patrones consistentes, documentación automática y funcionalidades avanzadas listas para producción.