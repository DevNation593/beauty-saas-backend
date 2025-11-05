import {
  ObjectType,
  Field,
  ID,
  InputType,
  registerEnumType,
} from '@nestjs/graphql';
import { TenantStatus } from '../../../modules/admin/domain/Tenant';

// Register enum for GraphQL
registerEnumType(TenantStatus, {
  name: 'TenantStatus',
  description: 'The status of a tenant',
});

@ObjectType('Tenant')
export class TenantType {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  slug: string;

  @Field()
  email: string;

  @Field({ nullable: true })
  phone?: string;

  @Field({ nullable: true })
  address?: string;

  @Field({ nullable: true })
  city?: string;

  @Field({ nullable: true })
  state?: string;

  @Field({ nullable: true })
  country?: string;

  @Field()
  timezone: string;

  @Field()
  locale: string;

  @Field()
  planId: string;

  @Field(() => TenantStatus)
  status: TenantStatus;

  @Field({ nullable: true })
  domain?: string;

  @Field()
  subscriptionStartDate: Date;

  @Field({ nullable: true })
  subscriptionEndDate?: Date;

  @Field({ nullable: true })
  trialEndDate?: Date;

  @Field()
  maxUsers: number;

  @Field()
  maxClients: number;

  @Field()
  maxLocations: number;

  @Field(() => [String])
  features: string[];

  @Field({ nullable: true })
  logoUrl?: string;

  @Field({ nullable: true })
  billingEmail?: string;

  @Field({ nullable: true })
  taxId?: string;

  @Field()
  isActive: boolean;

  @Field(() => String)
  settings: string; // JSON string representation

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType('TenantAnalytics')
export class TenantAnalyticsType {
  @Field()
  totalTenants: number;

  @Field()
  activeTenants: number;

  @Field()
  trialTenants: number;

  @Field()
  suspendedTenants: number;

  @Field()
  cancelledTenants: number;

  @Field()
  expiredTenants: number;

  @Field()
  newTenantsThisMonth: number;

  @Field()
  churnRate: number;

  @Field()
  averageRevenue: number;

  @Field(() => [String])
  topPlans: string[];
}

@InputType('CreateTenantInput')
export class CreateTenantInput {
  @Field()
  name: string;

  @Field()
  slug: string;

  @Field()
  email: string;

  @Field({ nullable: true })
  phone?: string;

  @Field({ nullable: true })
  address?: string;

  @Field({ nullable: true })
  city?: string;

  @Field({ nullable: true })
  state?: string;

  @Field({ nullable: true })
  country?: string;

  @Field({ nullable: true })
  timezone?: string;

  @Field({ nullable: true })
  locale?: string;

  @Field()
  planId: string;

  @Field(() => [String], { nullable: true })
  features?: string[];

  @Field({ nullable: true })
  domain?: string;

  @Field({ nullable: true })
  billingEmail?: string;

  @Field({ nullable: true })
  taxId?: string;
}

@InputType('UpdateTenantInput')
export class UpdateTenantInput {
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  email?: string;

  @Field({ nullable: true })
  phone?: string;

  @Field({ nullable: true })
  address?: string;

  @Field({ nullable: true })
  city?: string;

  @Field({ nullable: true })
  state?: string;

  @Field({ nullable: true })
  country?: string;

  @Field({ nullable: true })
  timezone?: string;

  @Field({ nullable: true })
  locale?: string;

  @Field({ nullable: true })
  domain?: string;

  @Field({ nullable: true })
  logoUrl?: string;

  @Field({ nullable: true })
  billingEmail?: string;

  @Field({ nullable: true })
  taxId?: string;
}

@InputType('UpdateTenantStatusInput')
export class UpdateTenantStatusInput {
  @Field(() => TenantStatus)
  status: TenantStatus;

  @Field({ nullable: true })
  reason?: string;
}

@InputType('UpdateTenantSubscriptionInput')
export class UpdateTenantSubscriptionInput {
  @Field()
  planId: string;

  @Field({ nullable: true })
  endDate?: string; // ISO date string
}

@InputType('ExtendTenantTrialInput')
export class ExtendTenantTrialInput {
  @Field()
  days: number;
}

@InputType('TenantFilterInput')
export class TenantFilterInput {
  @Field(() => TenantStatus, { nullable: true })
  status?: TenantStatus;

  @Field({ nullable: true })
  planId?: string;

  @Field({ nullable: true })
  page?: number;

  @Field({ nullable: true })
  limit?: number;
}
