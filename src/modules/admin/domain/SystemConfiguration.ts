import { BaseEntity } from '../../../common/domain/core/BaseEntity';
import { DomainEvent } from '../../../common/domain/core/DomainEvent';

export enum ConfigurationType {
  SYSTEM = 'SYSTEM',
  FEATURE = 'FEATURE',
  INTEGRATION = 'INTEGRATION',
  BILLING = 'BILLING',
  SECURITY = 'SECURITY',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PAYMENT = 'PAYMENT',
}

export interface SystemConfigurationProps {
  id: string;
  key: string;
  value: unknown;
  type: ConfigurationType;
  description?: string;
  isEncrypted: boolean;
  isPublic: boolean; // Can be accessed by tenants
  validationSchema?: string; // JSON schema for validation
  defaultValue?: unknown;
  category?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export class ConfigurationUpdatedEvent implements DomainEvent {
  readonly type = 'CONFIGURATION_UPDATED';
  readonly payload: {
    key: string;
    oldValue: unknown;
    newValue: unknown;
    updatedBy?: string;
  };
  readonly aggregateId: string;
  readonly occurredAt: Date;

  constructor(
    key: string,
    oldValue: unknown,
    newValue: unknown,
    updatedBy?: string,
  ) {
    this.aggregateId = key;
    this.occurredAt = new Date();
    this.payload = {
      key,
      oldValue,
      newValue,
      updatedBy,
    };
  }
}

export class SystemConfiguration extends BaseEntity {
  private props: SystemConfigurationProps;

  constructor(props: SystemConfigurationProps) {
    super(props.id, props.createdAt, props.updatedAt);
    this.props = props;
  }

  // Getters
  get key(): string {
    return this.props.key;
  }

  get value(): unknown {
    return this.props.value;
  }

  get type(): ConfigurationType {
    return this.props.type;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get isEncrypted(): boolean {
    return this.props.isEncrypted;
  }

  get isPublic(): boolean {
    return this.props.isPublic;
  }

  get validationSchema(): string | undefined {
    return this.props.validationSchema;
  }

  get defaultValue(): unknown {
    return this.props.defaultValue;
  }

  get category(): string | undefined {
    return this.props.category;
  }

  get tags(): string[] {
    return this.props.tags;
  }

  // Factory method
  public static create(
    props: Omit<SystemConfigurationProps, 'id' | 'createdAt' | 'updatedAt'>,
  ): SystemConfiguration {
    const configId = `config_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    return new SystemConfiguration({
      ...props,
      id: configId,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Business methods
  public updateValue(newValue: unknown, updatedBy?: string): void {
    const oldValue = this.props.value;
    this.props.value = newValue;
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new ConfigurationUpdatedEvent(
        this.props.key,
        oldValue,
        newValue,
        updatedBy,
      ),
    );
  }

  public updateDescription(description: string): void {
    this.props.description = description;
    this.props.updatedAt = new Date();
  }

  public addTag(tag: string): void {
    if (!this.props.tags.includes(tag)) {
      this.props.tags.push(tag);
      this.props.updatedAt = new Date();
    }
  }

  public removeTag(tag: string): void {
    const index = this.props.tags.indexOf(tag);
    if (index > -1) {
      this.props.tags.splice(index, 1);
      this.props.updatedAt = new Date();
    }
  }

  public setValidationSchema(schema: string): void {
    this.props.validationSchema = schema;
    this.props.updatedAt = new Date();
  }

  // Helper methods
  public getValueAsString(): string {
    return String(this.props.value);
  }

  public getValueAsNumber(): number {
    return Number(this.props.value);
  }

  public getValueAsBoolean(): boolean {
    return Boolean(this.props.value);
  }

  public getValueAsObject<T>(): T {
    return this.props.value as T;
  }

  getProps(): SystemConfigurationProps {
    return { ...this.props };
  }
}
