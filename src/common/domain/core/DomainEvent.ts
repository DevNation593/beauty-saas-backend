export interface DomainEvent {
  type: string;
  payload: Record<string, unknown>;
  aggregateId: string;
  occurredAt: Date;
}

export abstract class BaseDomainEvent {
  public readonly aggregateId: string;
  public readonly eventVersion: number;
  public readonly occurredAt: Date;

  protected constructor(
    aggregateId: string,
    eventVersion: number = 1,
    occurredAt?: Date,
  ) {
    this.aggregateId = aggregateId;
    this.eventVersion = eventVersion;
    this.occurredAt = occurredAt || new Date();
  }

  public abstract getEventName(): string;
}
