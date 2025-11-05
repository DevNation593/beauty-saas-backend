# Integraciones

## Pagos
- **Stripe** y/o **Mercado Pago** según región del tenant.
- Flujo: intent → confirmación → webhook conciliación (idempotencia; firma). Reintentos/backoff; aislamiento por tenant. :contentReference[oaicite:26]{index=26}

## Mensajería
- **WhatsApp Cloud API**, **SMS**, **Email** (proveedor seleccionable).
- Casos: recordatorios T-24h/T-3h, campañas (cumpleaños, reenganche, huecos agenda), confirmaciones. Tracking: enviados, entregados, respondidos, conversiones. :contentReference[oaicite:27]{index=27}

## Calendario
- Lectura de **libre/ocupado** (no escritura). Sincronización para vista de ocupación. :contentReference[oaicite:28]{index=28}

## Contable
- Export estándar (CSV/plan contable). Conectores opcionales. :contentReference[oaicite:29]{index=29}

## Requisitos comunes
- Validación de firmas, **idempotencia**, **rate limiting** por tenant y **reintentos con backoff** ante fallos; auditoría de eventos. :contentReference[oaicite:30]{index=30}
