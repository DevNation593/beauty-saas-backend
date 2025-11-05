import { BaseEntity } from '../../../common/domain/core/BaseEntity';
import { DomainEvent } from '../../../common/domain/core/DomainEvent';
import {
  ValidationError,
  BusinessRuleError,
} from '../../../common/domain/errors/DomainErrors';

export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW',
  CANCELED = 'CANCELED',
}

export interface AppointmentProps {
  tenantId: string;
  clientId: string;
  serviceId: string;
  staffId: string;
  startTime: Date;
  endTime: Date;
  status: AppointmentStatus;
  notes?: string;
  privateNotes?: string;
  price: number;
  discount: number;
  finalPrice: number;
  bookedBy?: string;
  reminderSent24h: boolean;
  reminderSent3h: boolean;
  confirmationSent: boolean;
}

export class Appointment extends BaseEntity {
  private constructor(
    id: string,
    private readonly props: AppointmentProps,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt);
    this.validate();
  }

  public static create(
    props: Omit<AppointmentProps, 'finalPrice'>,
    id?: string,
  ): Appointment {
    const finalPrice = props.price - props.discount;

    const appointment = new Appointment(id || crypto.randomUUID(), {
      ...props,
      finalPrice,
    });

    appointment.addDomainEvent({
      type: 'AppointmentCreated',
      payload: {
        appointmentId: appointment.id,
        appointmentProps: appointment.props,
      },
      aggregateId: appointment.id,
      occurredAt: new Date(),
    });

    return appointment;
  }

  public static fromPersistence(
    id: string,
    props: AppointmentProps,
    createdAt: Date,
    updatedAt: Date,
  ): Appointment {
    return new Appointment(id, props, createdAt, updatedAt);
  }

  private validate(): void {
    if (!this.props.tenantId) {
      throw new ValidationError('Tenant ID is required');
    }

    if (!this.props.clientId) {
      throw new ValidationError('Client ID is required');
    }

    if (!this.props.serviceId) {
      throw new ValidationError('Service ID is required');
    }

    if (!this.props.staffId) {
      throw new ValidationError('Staff ID is required');
    }

    if (this.props.startTime >= this.props.endTime) {
      throw new ValidationError('Start time must be before end time');
    }

    if (this.props.price < 0) {
      throw new ValidationError('Price cannot be negative');
    }

    if (this.props.discount < 0) {
      throw new ValidationError('Discount cannot be negative');
    }

    if (this.props.discount > this.props.price) {
      throw new ValidationError('Discount cannot be greater than price');
    }
  }

  // Getters
  get tenantId(): string {
    return this.props.tenantId;
  }
  get clientId(): string {
    return this.props.clientId;
  }
  get serviceId(): string {
    return this.props.serviceId;
  }
  get staffId(): string {
    return this.props.staffId;
  }
  get startTime(): Date {
    return this.props.startTime;
  }
  get endTime(): Date {
    return this.props.endTime;
  }
  get status(): AppointmentStatus {
    return this.props.status;
  }
  get notes(): string | undefined {
    return this.props.notes;
  }
  get privateNotes(): string | undefined {
    return this.props.privateNotes;
  }
  get price(): number {
    return this.props.price;
  }
  get discount(): number {
    return this.props.discount;
  }
  get finalPrice(): number {
    return this.props.finalPrice;
  }
  get bookedBy(): string | undefined {
    return this.props.bookedBy;
  }
  get reminderSent24h(): boolean {
    return this.props.reminderSent24h;
  }
  get reminderSent3h(): boolean {
    return this.props.reminderSent3h;
  }
  get confirmationSent(): boolean {
    return this.props.confirmationSent;
  }

  // Business methods
  public confirm(): void {
    if (this.props.status === AppointmentStatus.CANCELED) {
      throw new BusinessRuleError(
        'Cannot confirm canceled appointment',
        'CONFIRM_CANCELED',
      );
    }

    if (this.props.status === AppointmentStatus.COMPLETED) {
      throw new BusinessRuleError(
        'Cannot confirm completed appointment',
        'CONFIRM_COMPLETED',
      );
    }

    this.props.status = AppointmentStatus.CONFIRMED;
    this.addDomainEvent({
      type: 'AppointmentConfirmed',
      payload: {
        appointmentId: this.id,
      },
      aggregateId: this.id,
      occurredAt: new Date(),
    });
  }

  public start(): void {
    if (this.props.status !== AppointmentStatus.CONFIRMED) {
      throw new BusinessRuleError(
        'Can only start confirmed appointments',
        'START_NOT_CONFIRMED',
      );
    }

    this.props.status = AppointmentStatus.IN_PROGRESS;
    this.addDomainEvent({
      type: 'AppointmentStarted',
      payload: {
        appointmentId: this.id,
      },
      aggregateId: this.id,
      occurredAt: new Date(),
    });
  }

  public complete(): void {
    if (this.props.status !== AppointmentStatus.IN_PROGRESS) {
      throw new BusinessRuleError(
        'Can only complete in-progress appointments',
        'COMPLETE_NOT_IN_PROGRESS',
      );
    }

    this.props.status = AppointmentStatus.COMPLETED;
    this.addDomainEvent({
      type: 'AppointmentCompleted',
      payload: {
        appointmentId: this.id,
        clientId: this.props.clientId,
      },
      aggregateId: this.id,
      occurredAt: new Date(),
    });
  }

  public cancel(reason?: string): void {
    if (this.props.status === AppointmentStatus.COMPLETED) {
      throw new BusinessRuleError(
        'Cannot cancel completed appointment',
        'CANCEL_COMPLETED',
      );
    }

    this.props.status = AppointmentStatus.CANCELED;
    this.addDomainEvent({
      type: 'AppointmentCanceled',
      payload: {
        appointmentId: this.id,
        reason,
      },
      aggregateId: this.id,
      occurredAt: new Date(),
    });
  }

  public markNoShow(): void {
    if (
      this.props.status !== AppointmentStatus.CONFIRMED &&
      this.props.status !== AppointmentStatus.SCHEDULED
    ) {
      throw new BusinessRuleError(
        'Can only mark scheduled/confirmed appointments as no-show',
        'NO_SHOW_INVALID_STATUS',
      );
    }

    this.props.status = AppointmentStatus.NO_SHOW;
    this.addDomainEvent({
      type: 'AppointmentNoShow',
      payload: {
        appointmentId: this.id,
        clientId: this.props.clientId,
      },
      aggregateId: this.id,
      occurredAt: new Date(),
    });
  }

  public reschedule(newStartTime: Date, newEndTime: Date): void {
    if (this.props.status === AppointmentStatus.COMPLETED) {
      throw new BusinessRuleError(
        'Cannot reschedule completed appointment',
        'RESCHEDULE_COMPLETED',
      );
    }

    if (this.props.status === AppointmentStatus.CANCELED) {
      throw new BusinessRuleError(
        'Cannot reschedule canceled appointment',
        'RESCHEDULE_CANCELED',
      );
    }

    if (newStartTime >= newEndTime) {
      throw new ValidationError('New start time must be before end time');
    }

    const oldStartTime = this.props.startTime;
    const oldEndTime = this.props.endTime;

    this.props.startTime = newStartTime;
    this.props.endTime = newEndTime;
    this.props.status = AppointmentStatus.SCHEDULED; // Reset to scheduled

    this.addDomainEvent({
      type: 'AppointmentRescheduled',
      payload: {
        appointmentId: this.id,
        oldStartTime,
        oldEndTime,
        newStartTime,
        newEndTime,
      },
      aggregateId: this.id,
      occurredAt: new Date(),
    });
  }

  public markReminderSent(type: '24h' | '3h'): void {
    if (type === '24h') {
      this.props.reminderSent24h = true;
    } else {
      this.props.reminderSent3h = true;
    }
  }

  public markConfirmationSent(): void {
    this.props.confirmationSent = true;
  }

  public updateNotes(notes: string): void {
    this.props.notes = notes;
  }

  public updatePrivateNotes(privateNotes: string): void {
    this.props.privateNotes = privateNotes;
  }
}

// Domain Events
export interface AppointmentCreatedEvent extends DomainEvent {
  type: 'AppointmentCreated';
  payload: {
    appointmentId: string;
    appointmentProps: AppointmentProps;
  };
}

export interface AppointmentConfirmedEvent extends DomainEvent {
  type: 'AppointmentConfirmed';
  payload: {
    appointmentId: string;
  };
}

export interface AppointmentStartedEvent extends DomainEvent {
  type: 'AppointmentStarted';
  payload: {
    appointmentId: string;
  };
}

export interface AppointmentCompletedEvent extends DomainEvent {
  type: 'AppointmentCompleted';
  payload: {
    appointmentId: string;
    clientId: string;
  };
}

export interface AppointmentCanceledEvent extends DomainEvent {
  type: 'AppointmentCanceled';
  payload: {
    appointmentId: string;
    reason?: string;
  };
}

export interface AppointmentNoShowEvent extends DomainEvent {
  type: 'AppointmentNoShow';
  payload: {
    appointmentId: string;
    clientId: string;
  };
}

export interface AppointmentRescheduledEvent extends DomainEvent {
  type: 'AppointmentRescheduled';
  payload: {
    appointmentId: string;
    oldStartTime: Date;
    oldEndTime: Date;
    newStartTime: Date;
    newEndTime: Date;
  };
}
