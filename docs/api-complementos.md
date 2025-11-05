# Beauty SaaS Backend API Documentation

## Overview
The Beauty SaaS Backend now provides comprehensive API access through three complementary protocols:
- **REST API**: Traditional HTTP endpoints for all CRUD operations
- **GraphQL API**: Modern query language with real-time capabilities
- **Webhooks API**: Event-driven integrations for external services

## 1. GraphQL API

### Features Implemented
- **Authentication & Authorization**: JWT-based auth with role-based access control
- **Multi-tenancy**: Tenant isolation through GraphQL guards
- **Auto-generated Schema**: TypeScript-first schema generation
- **Admin Operations**: Complete tenant management through GraphQL

### GraphQL Endpoint
```
POST /graphql
```

### Key Components

#### Types & Schemas
- `TenantType`: Complete tenant entity with all properties
- `TenantAnalyticsType`: Analytics and metrics data
- Input types for create/update operations
- Enum types for tenant status

#### Queries
```graphql
# Get all tenants with optional filters
getAllTenants(filters: TenantFilterInput): [Tenant]

# Get tenant by ID
getTenantById(id: ID!): Tenant

# Get tenant by slug
getTenantBySlug(slug: String!): Tenant

# Get tenant by email
getTenantByEmail(email: String!): Tenant

# Get tenant by domain
getTenantByDomain(domain: String!): Tenant

# Get analytics data
getTenantAnalytics: TenantAnalytics
```

#### Mutations
```graphql
# Create new tenant
createTenant(input: CreateTenantInput!): Tenant

# Update tenant
updateTenant(id: ID!, input: UpdateTenantInput!): Tenant

# Update tenant status
updateTenantStatus(id: ID!, input: UpdateTenantStatusInput!): Boolean

# Update subscription
updateTenantSubscription(id: ID!, input: UpdateTenantSubscriptionInput!): Boolean

# Extend trial period
extendTenantTrial(id: ID!, input: ExtendTenantTrialInput!): Boolean

# Delete tenant
deleteTenant(id: ID!): Boolean
```

#### Example GraphQL Query
```graphql
query GetAllTenants {
  getAllTenants(filters: { status: ACTIVE, limit: 10 }) {
    id
    name
    slug
    email
    status
    planId
    maxUsers
    features
    createdAt
  }
}
```

#### Example GraphQL Mutation
```graphql
mutation CreateTenant {
  createTenant(input: {
    name: "Beauty Salon Pro"
    slug: "beauty-salon-pro"
    email: "admin@beautysalonpro.com"
    planId: "premium"
    timezone: "America/New_York"
    locale: "en"
  }) {
    id
    name
    status
    createdAt
  }
}
```

### Authentication
All GraphQL operations require:
1. JWT token in Authorization header
2. OWNER role for admin operations
3. Valid tenant context

## 2. REST API

### Features Implemented
- **Module Organization**: Organized by business domains
- **Swagger Documentation**: Auto-generated API docs
- **Rate Limiting**: Built-in request throttling
- **Validation**: Request/response validation with DTOs

### Existing REST Endpoints

#### Admin Endpoints
- `POST /admin/tenants` - Create tenant
- `GET /admin/tenants` - List tenants with filters
- `GET /admin/tenants/analytics` - Get analytics
- `GET /admin/tenants/:id` - Get tenant by ID
- `GET /admin/tenants/slug/:slug` - Get tenant by slug
- `GET /admin/tenants/email/:email` - Get tenant by email
- `GET /admin/tenants/domain/:domain` - Get tenant by domain
- `PUT /admin/tenants/:id` - Update tenant
- `PUT /admin/tenants/:id/status` - Update status
- `PUT /admin/tenants/:id/subscription` - Update subscription
- `PUT /admin/tenants/:id/trial/extend` - Extend trial
- `DELETE /admin/tenants/:id` - Delete tenant

### REST API Structure
```
/src/api/rest/
├── controllers/          # API controllers
├── middleware/          # API middleware (rate limiting, versioning)
├── dto/                # Data transfer objects
└── rest.module.ts      # Module configuration
```

## 3. Webhooks API

### Features Implemented
- **Payment Processing**: Stripe webhook integration
- **Signature Verification**: Secure webhook validation
- **Event Handling**: Automated event processing
- **Error Handling**: Robust error management and logging

### Webhook Endpoints

#### Payment Webhooks
- `POST /webhooks/payments/stripe` - Stripe payment events
- `POST /webhooks/payments/mercadopago` - MercadoPago events (placeholder)

### Stripe Webhook Events Supported
- `payment_intent.succeeded` - Payment completed successfully
- `payment_intent.payment_failed` - Payment failed
- `customer.subscription.created` - New subscription
- `customer.subscription.updated` - Subscription changes
- `customer.subscription.deleted` - Subscription cancelled
- `invoice.payment_succeeded` - Invoice paid
- `invoice.payment_failed` - Invoice payment failed

### Webhook Security
- **Signature Verification**: All webhooks verify cryptographic signatures
- **Timestamp Validation**: Prevents replay attacks
- **Error Logging**: Comprehensive logging for debugging

### Example Webhook Handler
```typescript
@Post('stripe')
async handleStripeWebhook(
  @Body() body: any,
  @Headers('stripe-signature') signature: string,
) {
  // Verify signature
  const isValid = this.stripeWebhookHandler.verifySignature(payload, signature);
  
  if (!isValid) {
    throw new BadRequestException('Invalid signature');
  }
  
  // Process event
  await this.stripeWebhookHandler.handleEvent(body);
  return { received: true };
}
```

## 4. Security Features

### Authentication & Authorization
- **JWT Tokens**: Secure token-based authentication
- **Role-Based Access Control (RBAC)**: Fine-grained permissions
- **Multi-tenant Isolation**: Complete tenant data separation

### Guards Implemented
- `GraphQLAuthGuard`: JWT authentication for GraphQL
- `GraphQLTenantGuard`: Tenant context validation
- `GraphQLRoleGuard`: Role-based authorization

### Security Best Practices
- **Input Validation**: All inputs validated with DTOs
- **SQL Injection Protection**: Prisma ORM with parameterized queries
- **CORS Configuration**: Properly configured cross-origin requests
- **Rate Limiting**: API throttling to prevent abuse

## 5. API Module Structure

### GraphQL Module
```
/src/api/graphql/
├── guards/              # Authentication guards
├── resolvers/           # GraphQL resolvers
├── types/              # GraphQL type definitions
└── graphql.module.ts   # Module configuration
```

### REST Module
```
/src/api/rest/
├── controllers/         # REST controllers
├── middleware/         # REST middleware
├── dto/               # Data transfer objects
└── rest.module.ts     # Module configuration
```

### Webhooks Module
```
/src/api/webhooks/
├── controllers/        # Webhook controllers
├── handlers/          # Event handlers
├── middleware/        # Webhook middleware
└── webhooks.module.ts # Module configuration
```

## 6. Development & Testing

### GraphQL Playground
Access GraphQL Playground at: `http://localhost:3000/graphql`

### Swagger Documentation
Access REST API docs at: `http://localhost:3000/api`

### Testing Webhooks
Use tools like ngrok for local webhook testing:
```bash
ngrok http 3000
# Use ngrok URL for webhook endpoints
```

## 7. Next Steps

### Immediate Enhancements
1. **Complete Missing Handlers**: Implement remaining webhook handlers
2. **API Documentation**: Enhance REST API documentation
3. **Testing Suite**: Add comprehensive API tests
4. **Rate Limiting**: Implement advanced rate limiting strategies

### Future Features
1. **Subscriptions**: Add GraphQL subscriptions for real-time updates
2. **API Versioning**: Implement versioned REST endpoints
3. **Metrics & Monitoring**: Add API usage analytics
4. **Caching**: Implement intelligent query caching

## 8. Configuration

### Environment Variables
```env
# GraphQL Configuration
GRAPHQL_PLAYGROUND_ENABLED=true
GRAPHQL_INTROSPECTION_ENABLED=true

# Webhook Configuration
STRIPE_WEBHOOK_SECRET=whsec_xxx
MERCADOPAGO_WEBHOOK_SECRET=xxx

# API Rate Limiting
API_THROTTLE_TTL=60
API_THROTTLE_LIMIT=100
```

### Module Integration
All API modules are integrated into the main `AppModule`:

```typescript
@Module({
  imports: [
    // ... other modules
    ApiGraphQLModule,
    RestApiModule,
    WebhooksApiModule,
  ],
})
export class AppModule {}
```

This comprehensive API infrastructure provides multiple access patterns for the Beauty SaaS platform, ensuring flexibility for different client types and integration requirements.