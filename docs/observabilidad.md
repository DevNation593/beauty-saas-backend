# Observabilidad

## Métricas (Prometheus)
- **Agenda**: p95 disponibilidad, p95 creación de cita, tasa de noshow, ocupación por día/staff.
- **CRM**: p95 búsqueda por nombre/teléfono.
- **POS**: p95 checkout, montos por hora, arqueos correctos.
- **Marketing**: enviados/entregados/respondidos/conversiones por campaña.
- **Reportes**: p95 generación estándar.
- **Workflows**: ejecuciones, éxitos, reintentos/backoff.
- Etiquetas: `tenant`, `module`, `endpoint`, `plan`.

## Trazas (OpenTelemetry)
- HTTP/DB/Queue spans con atributos `tenant`, `role`, `plan`.

## SLOs y Alertas
- Disponibilidad mensual funciones críticas ≥ 99.5%.
- p95: consulta disponibilidad <250ms; crear reserva <400ms; checkout <450ms; CRM search <300ms; reporte estándar <5s. :contentReference[oaicite:36]{index=36}
