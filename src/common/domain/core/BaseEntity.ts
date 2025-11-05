import { DomainEvent } from './DomainEvent';

export abstract class BaseEntity {
  public readonly id: string;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;
  private _domainEvents: DomainEvent[] = [];

  protected constructor(id: string, createdAt?: Date, updatedAt?: Date) {
    this.id = id;
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
  }

  public equals(entity: BaseEntity): boolean {
    return this.id === entity.id;
  }

  public toString(): string {
    return `${this.constructor.name}(${this.id})`;
  }

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  public getDomainEvents(): DomainEvent[] {
    return this._domainEvents.slice();
  }

  public clearDomainEvents(): void {
    this._domainEvents = [];
  }
}
