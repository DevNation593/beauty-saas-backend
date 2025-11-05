# Despliegue y Operación

## Ambientes
- dev, staging, prod. Healthchecks (API, DB, Redis, colas, proveedores). Releases mensuales + hotfixes. :contentReference[oaicite:37]{index=37}

## Migraciones y Seeds
- `prisma migrate deploy` por versión; seeds base (servicios, políticas) + demo tenant. Reversibles cuando aplique. :contentReference[oaicite:38]{index=38}

## Feature Flags y Canary
- Activación por tenant/módulo; canary con subconjunto de tenants antes de GA. :contentReference[oaicite:39]{index=39}

## Backups y Retención
- Backups automáticos, PITR, políticas de retención por tipo de dato. Exportación/portabilidad por tenant. :contentReference[oaicite:40]{index=40}
