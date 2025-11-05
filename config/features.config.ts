import { registerAs } from '@nestjs/config';

export default registerAs('features', () => ({
  // Module availability
  modules: {
    agenda: process.env.FEATURE_AGENDA !== 'false',
    crm: process.env.FEATURE_CRM !== 'false',
    pos: process.env.FEATURE_POS !== 'false',
    inventory: process.env.FEATURE_INVENTORY !== 'false',
    marketing: process.env.FEATURE_MARKETING !== 'false',
    reports: process.env.FEATURE_REPORTS !== 'false',
    workflows: process.env.FEATURE_WORKFLOWS !== 'false',
  },

  // Feature flags
  flags: {
    enableGraphQL: process.env.ENABLE_GRAPHQL === 'true',
    enableWebhooks: process.env.ENABLE_WEBHOOKS === 'true',
    enableFileUploads: process.env.ENABLE_FILE_UPLOADS !== 'false',
    enableAuditLogs: process.env.ENABLE_AUDIT_LOGS !== 'false',
    enableMetrics: process.env.ENABLE_METRICS !== 'false',
  },

  // Integration flags
  integrations: {
    stripe: process.env.ENABLE_STRIPE === 'true',
    mercadopago: process.env.ENABLE_MERCADOPAGO === 'true',
    whatsapp: process.env.ENABLE_WHATSAPP === 'true',
    sms: process.env.ENABLE_SMS === 'true',
    email: process.env.ENABLE_EMAIL !== 'false',
  },
}));
