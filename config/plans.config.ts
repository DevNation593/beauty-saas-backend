import { registerAs } from '@nestjs/config';

export default registerAs('plans', () => ({
  // Default plan configurations based on requirements document
  starter: {
    name: 'Starter',
    maxUsers: 2,
    maxMessages: 500,
    maxStorage: 5 * 1024 * 1024 * 1024, // 5GB
    maxAppointments: 1000,
    modules: ['AGENDA', 'CRM'],
    features: [],
  },

  growth: {
    name: 'Growth',
    maxUsers: 10,
    maxMessages: 3000,
    maxStorage: 25 * 1024 * 1024 * 1024, // 25GB
    maxAppointments: 5000,
    modules: ['AGENDA', 'CRM', 'POS', 'MARKETING', 'INVENTORY'],
    features: [],
  },

  pro: {
    name: 'Pro',
    maxUsers: 30,
    maxMessages: 10000,
    maxStorage: 100 * 1024 * 1024 * 1024, // 100GB
    maxAppointments: 20000,
    modules: [
      'AGENDA',
      'CRM',
      'POS',
      'MARKETING',
      'INVENTORY',
      'REPORTS',
      'WORKFLOWS',
    ],
    features: ['ADVANCED_REPORTS', 'WORKFLOWS'],
  },

  // Usage limits
  limits: {
    warningThreshold: 0.8, // 80%
    softLimitThreshold: 0.9, // 90%
    hardLimitThreshold: 1.0, // 100%
  },
}));
