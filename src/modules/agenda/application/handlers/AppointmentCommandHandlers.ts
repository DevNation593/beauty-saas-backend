import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Inject } from '@nestjs/common';
import { Appointment, AppointmentStatus } from '../../domain/Appointment';
import type {
  AppointmentRepository,
  AvailabilityService,
} from '../../domain/AppointmentRepository';
import {
  CreateAppointmentCommand,
  ConfirmAppointmentCommand,
  CancelAppointmentCommand,
  RescheduleAppointmentCommand,
  CompleteAppointmentCommand,
  MarkNoShowCommand,
} from '../commands/AppointmentCommands';
import {
  NotFoundError,
  BusinessRuleError,
} from '../../../../common/domain/errors/DomainErrors';

@Injectable()
@CommandHandler(CreateAppointmentCommand)
export class CreateAppointmentHandler
  implements ICommandHandler<CreateAppointmentCommand>
{
  constructor(
    @Inject('AppointmentRepository')
    private readonly appointmentRepository: AppointmentRepository,
    @Inject('AvailabilityService')
    private readonly availabilityService: AvailabilityService,
  ) {}

  async execute(command: CreateAppointmentCommand): Promise<string> {
    const {
      tenantId,
      clientId,
      serviceId,
      staffId,
      startTime,
      endTime,
      notes,
      bookedBy,
    } = command;

    // Check staff availability
    const isAvailable = await this.availabilityService.checkStaffAvailability(
      tenantId,
      staffId,
      startTime,
      endTime,
    );

    if (!isAvailable) {
      throw new BusinessRuleError(
        'Staff is not available at the requested time',
        'STAFF_NOT_AVAILABLE',
      );
    }

    // For now, we'll assume a fixed price - this should come from the service
    const appointment = Appointment.create({
      tenantId,
      clientId,
      serviceId,
      staffId,
      startTime,
      endTime,
      status: AppointmentStatus.SCHEDULED,
      notes,
      price: 100, // This should be fetched from service
      discount: 0,
      bookedBy,
      reminderSent24h: false,
      reminderSent3h: false,
      confirmationSent: false,
    });

    await this.appointmentRepository.save(appointment);

    return appointment.id;
  }
}

@Injectable()
@CommandHandler(ConfirmAppointmentCommand)
export class ConfirmAppointmentHandler
  implements ICommandHandler<ConfirmAppointmentCommand>
{
  constructor(
    @Inject('AppointmentRepository')
    private readonly appointmentRepository: AppointmentRepository,
  ) {}

  async execute(command: ConfirmAppointmentCommand): Promise<void> {
    const { appointmentId, tenantId } = command;

    const appointment = await this.appointmentRepository.findById(
      appointmentId,
      tenantId,
    );
    if (!appointment) {
      throw new NotFoundError('Appointment', appointmentId);
    }

    appointment.confirm();
    await this.appointmentRepository.save(appointment);
  }
}

@Injectable()
@CommandHandler(CancelAppointmentCommand)
export class CancelAppointmentHandler
  implements ICommandHandler<CancelAppointmentCommand>
{
  constructor(
    @Inject('AppointmentRepository')
    private readonly appointmentRepository: AppointmentRepository,
  ) {}

  async execute(command: CancelAppointmentCommand): Promise<void> {
    const { appointmentId, tenantId, reason } = command;

    const appointment = await this.appointmentRepository.findById(
      appointmentId,
      tenantId,
    );
    if (!appointment) {
      throw new NotFoundError('Appointment', appointmentId);
    }

    appointment.cancel(reason);
    await this.appointmentRepository.save(appointment);
  }
}

@Injectable()
@CommandHandler(RescheduleAppointmentCommand)
export class RescheduleAppointmentHandler
  implements ICommandHandler<RescheduleAppointmentCommand>
{
  constructor(
    @Inject('AppointmentRepository')
    private readonly appointmentRepository: AppointmentRepository,
    @Inject('AvailabilityService')
    private readonly availabilityService: AvailabilityService,
  ) {}

  async execute(command: RescheduleAppointmentCommand): Promise<void> {
    const { appointmentId, tenantId, newStartTime, newEndTime } = command;

    const appointment = await this.appointmentRepository.findById(
      appointmentId,
      tenantId,
    );
    if (!appointment) {
      throw new NotFoundError('Appointment', appointmentId);
    }

    // Check if staff is available at the new time
    const isAvailable = await this.availabilityService.checkStaffAvailability(
      tenantId,
      appointment.staffId,
      newStartTime,
      newEndTime,
      appointmentId, // Exclude current appointment
    );

    if (!isAvailable) {
      throw new BusinessRuleError(
        'Staff is not available at the new requested time',
        'STAFF_NOT_AVAILABLE',
      );
    }

    appointment.reschedule(newStartTime, newEndTime);
    await this.appointmentRepository.save(appointment);
  }
}

@Injectable()
@CommandHandler(CompleteAppointmentCommand)
export class CompleteAppointmentHandler
  implements ICommandHandler<CompleteAppointmentCommand>
{
  constructor(
    @Inject('AppointmentRepository')
    private readonly appointmentRepository: AppointmentRepository,
  ) {}

  async execute(command: CompleteAppointmentCommand): Promise<void> {
    const { appointmentId, tenantId } = command;

    const appointment = await this.appointmentRepository.findById(
      appointmentId,
      tenantId,
    );
    if (!appointment) {
      throw new NotFoundError('Appointment', appointmentId);
    }

    appointment.complete();
    await this.appointmentRepository.save(appointment);
  }
}

@Injectable()
@CommandHandler(MarkNoShowCommand)
export class MarkNoShowHandler implements ICommandHandler<MarkNoShowCommand> {
  constructor(
    @Inject('AppointmentRepository')
    private readonly appointmentRepository: AppointmentRepository,
  ) {}

  async execute(command: MarkNoShowCommand): Promise<void> {
    const { appointmentId, tenantId } = command;

    const appointment = await this.appointmentRepository.findById(
      appointmentId,
      tenantId,
    );
    if (!appointment) {
      throw new NotFoundError('Appointment', appointmentId);
    }

    appointment.markNoShow();
    await this.appointmentRepository.save(appointment);
  }
}
