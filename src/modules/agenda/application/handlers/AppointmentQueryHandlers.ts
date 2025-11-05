import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Inject } from '@nestjs/common';
import type {
  AppointmentRepository,
  AvailabilityService,
} from '../../domain/AppointmentRepository';
import type { Appointment } from '../../domain/Appointment';
import {
  GetAppointmentQuery,
  GetAppointmentsByClientQuery,
  GetAppointmentsByStaffQuery,
  GetAppointmentsByDateRangeQuery,
  CheckAvailabilityQuery,
  GetAvailableSlotsQuery,
} from '../queries/AppointmentQueries';

@Injectable()
@QueryHandler(GetAppointmentQuery)
export class GetAppointmentHandler
  implements IQueryHandler<GetAppointmentQuery>
{
  constructor(
    @Inject('AppointmentRepository')
    private readonly appointmentRepository: AppointmentRepository,
  ) {}

  async execute(query: GetAppointmentQuery): Promise<Appointment | null> {
    return this.appointmentRepository.findById(
      query.appointmentId,
      query.tenantId,
    );
  }
}

@Injectable()
@QueryHandler(GetAppointmentsByClientQuery)
export class GetAppointmentsByClientHandler
  implements IQueryHandler<GetAppointmentsByClientQuery>
{
  constructor(
    @Inject('AppointmentRepository')
    private readonly appointmentRepository: AppointmentRepository,
  ) {}

  async execute(query: GetAppointmentsByClientQuery): Promise<Appointment[]> {
    return this.appointmentRepository.findByClient(
      query.clientId,
      query.tenantId,
    );
  }
}

@Injectable()
@QueryHandler(GetAppointmentsByStaffQuery)
export class GetAppointmentsByStaffHandler
  implements IQueryHandler<GetAppointmentsByStaffQuery>
{
  constructor(
    @Inject('AppointmentRepository')
    private readonly appointmentRepository: AppointmentRepository,
  ) {}

  async execute(query: GetAppointmentsByStaffQuery): Promise<Appointment[]> {
    return this.appointmentRepository.findByStaff(
      query.staffId,
      query.tenantId,
      query.startDate,
      query.endDate,
    );
  }
}

@Injectable()
@QueryHandler(GetAppointmentsByDateRangeQuery)
export class GetAppointmentsByDateRangeHandler
  implements IQueryHandler<GetAppointmentsByDateRangeQuery>
{
  constructor(
    @Inject('AppointmentRepository')
    private readonly appointmentRepository: AppointmentRepository,
  ) {}

  async execute(
    query: GetAppointmentsByDateRangeQuery,
  ): Promise<Appointment[]> {
    const appointments = await this.appointmentRepository.findByDateRange(
      query.tenantId,
      query.startDate,
      query.endDate,
    );

    // Apply additional filters
    let filtered = appointments;

    if (query.staffId) {
      filtered = filtered.filter((apt) => apt.staffId === query.staffId);
    }

    if (query.status) {
      filtered = filtered.filter((apt) => apt.status === query.status);
    }

    return filtered;
  }
}

@Injectable()
@QueryHandler(CheckAvailabilityQuery)
export class CheckAvailabilityHandler
  implements IQueryHandler<CheckAvailabilityQuery>
{
  constructor(
    @Inject('AvailabilityService')
    private readonly availabilityService: AvailabilityService,
  ) {}

  async execute(query: CheckAvailabilityQuery): Promise<boolean> {
    return this.availabilityService.checkStaffAvailability(
      query.tenantId,
      query.staffId,
      query.startTime,
      query.endTime,
      query.excludeAppointmentId,
    );
  }
}

@Injectable()
@QueryHandler(GetAvailableSlotsQuery)
export class GetAvailableSlotsHandler
  implements IQueryHandler<GetAvailableSlotsQuery>
{
  constructor(
    @Inject('AvailabilityService')
    private readonly availabilityService: AvailabilityService,
  ) {}

  async execute(query: GetAvailableSlotsQuery): Promise<Date[]> {
    return this.availabilityService.getAvailableSlots(
      query.tenantId,
      query.staffId,
      query.date,
      query.serviceDuration,
    );
  }
}
