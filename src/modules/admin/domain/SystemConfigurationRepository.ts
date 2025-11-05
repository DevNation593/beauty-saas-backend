import { SystemConfiguration, ConfigurationType } from './SystemConfiguration';

export interface ConfigurationFilters {
  type?: ConfigurationType;
  category?: string;
  tags?: string[];
  isPublic?: boolean;
  isEncrypted?: boolean;
  search?: string;
}

export interface SystemConfigurationRepository {
  // Basic CRUD
  findByKey(key: string): Promise<SystemConfiguration | null>;
  findById(id: string): Promise<SystemConfiguration | null>;
  save(configuration: SystemConfiguration): Promise<void>;
  delete(key: string): Promise<void>;

  // Queries
  findAll(filters?: ConfigurationFilters): Promise<SystemConfiguration[]>;
  findByType(type: ConfigurationType): Promise<SystemConfiguration[]>;
  findByCategory(category: string): Promise<SystemConfiguration[]>;
  findPublicConfigurations(): Promise<SystemConfiguration[]>;

  // Bulk operations
  bulkUpdate(updates: Array<{ key: string; value: unknown }>): Promise<void>;
  bulkDelete(keys: string[]): Promise<void>;

  // Validation
  validateConfiguration(key: string, value: unknown): Promise<boolean>;
}
