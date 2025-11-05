
---

# docs/arquitectura.md
```md
# Arquitectura

## Estilo
- **Monolito modular** con **Screaming Architecture** (módulos: agenda, crm, pos, inventory, marketing, reports, workflows, identity-tenancy, admin).
- **CQRS** (Nest `@nestjs/cqrs`) y **Domain Events**; **BullMQ** para trabajos asíncronos (recordatorios, campañas, conciliaciones). :contentReference[oaicite:21]{index=21}

## Capas por módulo
- `domain/` (entidades, agregados, VO, reglas, eventos de dominio)
- `application/` (use-cases, command/query handlers)
- `infra/` (repos Prisma, mappers, schedulers/queues, proveedores)
- `interface/` (controllers REST/GraphQL, DTOs)

## Tenancy y RBAC
- `TenantContext` por request; **RBAC por módulo/rol** conforme matriz de permisos (Owner, Manager, Reception, Staff, Cliente). :contentReference[oaicite:22]{index=22}

## Datos
- Dominios: clientes, citas, servicios, ventas, inventario, mensajes, workflows, auditoría.
- **Multitenant**: cada registro asociado a un tenant; export/portabilidad por tenant. :contentReference[oaicite:23]{index=23}

## Integraciones
- Pagos (Stripe/MercadoPago), Mensajería (WhatsApp/SMS/Email), Calendario (lectura libre/ocupado), Contable (export). Reintentos + backoff + rate limits. :contentReference[oaicite:24]{index=24}

## SLOs y métricas
- Disponibilidad mensual crítica ≥ 99.5%.
- p95: disponibilidad <250ms; crear reserva <400ms; checkout <450ms; búsqueda CRM <300ms; reportes estándar <5s. :contentReference[oaicite:25]{index=25}
