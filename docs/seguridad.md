# Seguridad, Roles y Privacidad

## Autenticación y Autorización
- JWT, refresco de tokens, **RBAC** por módulo/acción. Guards: `JwtAuthGuard`, `TenantGuard`, `RolesGuard`.
- Matriz de permisos conforme perfiles: Owner, Manager, Reception, Staff, Cliente (ver documento). :contentReference[oaicite:31]{index=31}

## Multitenancy
- Aislamiento por tenant en DB (schema/SCOPING) y storage; headers/subdominio; logs/metricas con etiquetas de tenant. :contentReference[oaicite:32]{index=32}

## Datos personales y consentimientos
- Consentimientos por canal (WhatsApp/SMS/Email) y retención/borrado por política; exportación por tenant bajo solicitud. :contentReference[oaicite:33]{index=33} :contentReference[oaicite:34]{index=34}

## Auditoría
- Registro estructurado **quién/qué/cuándo/antes-después** para acciones críticas (POS, agenda, cambios de plan, workflows). :contentReference[oaicite:35]{index=35}
