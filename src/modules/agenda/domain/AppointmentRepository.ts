import { Appointment } from '../domain/Appointment';

export interface AppointmentRepository {
  save(appointment: Appointment): Promise<Appointment>;
  findById(id: string, tenantId: string): Promise<Appointment | null>;
  findByClient(clientId: string, tenantId: string): Promise<Appointment[]>;
  findByStaff(
    staffId: string,
    tenantId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<Appointment[]>;
  findByDateRange(
    tenantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Appointment[]>;
  findConflicting(
    tenantId: string,
    staffId: string,
    startTime: Date,
    endTime: Date,
    excludeId?: string,
  ): Promise<Appointment[]>;
  delete(id: string, tenantId: string): Promise<void>;
  findPendingReminders(type: '24h' | '3h'): Promise<Appointment[]>;
  findByStatus(status: string, tenantId: string): Promise<Appointment[]>;
}

export interface AvailabilityService {
  checkStaffAvailability(
    tenantId: string,
    staffId: string,
    startTime: Date,
    endTime: Date,
    excludeAppointmentId?: string,
  ): Promise<boolean>;

  getAvailableSlots(
    tenantId: string,
    staffId: string,
    date: Date,
    serviceDuration: number,
  ): Promise<Date[]>;

  findNextAvailableSlot(
    tenantId: string,
    staffId: string,
    preferredDate: Date,
    serviceDuration: number,
  ): Promise<Date | null>;
}
