import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/infra/database/prisma.service';

interface TenantInfo {
  id: string;
  slug: string;
  name: string;
  plan: {
    id: string;
    name: string;
    modules: string[];
    features: string[];
  };
}

@Injectable()
export class TenantProvider {
  constructor(private readonly prisma: PrismaService) {}

  async getTenantBySlug(slug: string): Promise<TenantInfo | null> {
    try {
      const tenant = await this.prisma.tenant.findUnique({
        where: {
          slug,
          status: 'ACTIVE',
        },
        include: {
          plan: {
            select: {
              id: true,
              name: true,
              modules: true,
              features: true,
            },
          },
        },
      });

      if (!tenant) return null;

      return {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        plan: tenant.plan,
      };
    } catch (error) {
      console.error('Error fetching tenant:', error);
      return null;
    }
  }

  async getTenantById(id: string): Promise<TenantInfo | null> {
    try {
      const tenant = await this.prisma.tenant.findUnique({
        where: {
          id,
          status: 'ACTIVE',
        },
        include: {
          plan: {
            select: {
              id: true,
              name: true,
              modules: true,
              features: true,
            },
          },
        },
      });

      if (!tenant) return null;

      return {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        plan: tenant.plan,
      };
    } catch (error) {
      console.error('Error fetching tenant by ID:', error);
      return null;
    }
  }
}
