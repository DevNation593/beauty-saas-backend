import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export interface ApiHealthResponse {
  status: string;
  timestamp: string;
  version: string;
  uptime: number;
}

export interface ApiInfoResponse {
  name: string;
  version: string;
  description: string;
  documentation: {
    rest: string;
    graphql: string;
    webhooks: string;
  };
  endpoints: {
    health: string;
    docs: string;
    graphql: string;
  };
}

// @ApiTags('API Documentation')
@Controller('')
export class ApiDocumentationController {
  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'API health status' })
  getHealth(): ApiHealthResponse {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: process.uptime(),
    };
  }

  @Get('info')
  @ApiOperation({ summary: 'API information and endpoints' })
  @ApiResponse({ status: 200, description: 'API information' })
  getInfo(): ApiInfoResponse {
    return {
      name: 'Beauty SaaS Backend API',
      version: '1.0.0',
      description: 'Comprehensive API for beauty salon management',
      documentation: {
        rest: '/api/docs',
        graphql: '/graphql',
        webhooks: '/api/webhooks/docs',
      },
      endpoints: {
        health: '/api/health',
        docs: '/api/docs',
        graphql: '/graphql',
      },
    };
  }

  @Get('docs')
  @ApiOperation({ summary: 'API documentation overview' })
  @ApiResponse({ status: 200, description: 'API documentation links' })
  getDocs() {
    return {
      message: 'Beauty SaaS API Documentation',
      apis: {
        rest: {
          description: 'Traditional REST API endpoints',
          documentation: '/api/docs/swagger',
          baseUrl: '/api/v1',
        },
        graphql: {
          description: 'GraphQL API with real-time capabilities',
          playground: '/graphql',
          schema: '/graphql/schema',
        },
        webhooks: {
          description: 'Event-driven webhooks for integrations',
          endpoints: [
            '/webhooks/payments/stripe',
            '/webhooks/payments/mercadopago',
          ],
        },
      },
      modules: [
        'Admin - Tenant management',
        'Identity & Tenancy - User authentication',
        'Agenda - Appointment scheduling',
        'CRM - Customer relationship management',
        'Inventory - Product and stock management',
        'POS - Point of sale operations',
      ],
    };
  }
}
