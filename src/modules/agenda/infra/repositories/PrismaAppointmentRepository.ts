import { Injectable } from '@nestjs/common';
import {
  Prisma,
  AppointmentStatus as PrismaAppointmentStatus,
} from '@prisma/client';
import { PrismaService } from '../../../../common/infra/database/prisma.service';
import type {
  AppointmentRepository,
  AvailabilityService,
} from '../../domain/AppointmentRepository';
import { Appointment, AppointmentStatus } from '../../domain/Appointment';
import type { Decimal } from '@prisma/client/runtime/library';

interface PrismaAppointmentData {
  id: string;
  tenantId: string;
  clientId: string;
  serviceId: string;
  staffId: string;
  startTime: Date;
  endTime: Date;
  status: PrismaAppointmentStatus;
  notes: string | null;
  privateNotes: string | null;
  price: Decimal;
  discount: Decimal;
  finalPrice: Decimal;
  bookedAt: Date;
  bookedBy: string | null;
  reminderSent24h: boolean;
  reminderSent3h: boolean;
  confirmationSent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class PrismaAppointmentRepository implements AppointmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(appointment: Appointment): Promise<Appointment> {
    const data = {
      id: appointment.id,
      tenantId: appointment.tenantId,
      clientId: appointment.clientId,
      serviceId: appointment.serviceId,
      staffId: appointment.staffId,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      status: appointment.status,
      notes: appointment.notes,
      privateNotes: appointment.privateNotes,
      price: appointment.price,
      discount: appointment.discount,
      finalPrice: appointment.finalPrice,
      bookedBy: appointment.bookedBy,
      reminderSent24h: appointment.reminderSent24h,
      reminderSent3h: appointment.reminderSent3h,
      confirmationSent: appointment.confirmationSent,
      updatedAt: new Date(),
    };

    const saved = await this.prisma.appointment.upsert({
      where: { id: appointment.id },
      update: data,
      create: {
        ...data,
        createdAt: appointment.createdAt,
      },
    });

    return this.toDomain(saved);
  }

  async findById(id: string, tenantId: string): Promise<Appointment | null> {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id, tenantId },
    });

    return appointment ? this.toDomain(appointment) : null;
  }

  async findByClient(
    clientId: string,
    tenantId: string,
  ): Promise<Appointment[]> {
    const appointments = await this.prisma.appointment.findMany({
      where: { clientId, tenantId },
      orderBy: { startTime: 'desc' },
    });

    return appointments.map((apt) => this.toDomain(apt));
  }

  async findByStaff(
    staffId: string,
    tenantId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<Appointment[]> {
    const where: Prisma.AppointmentWhereInput = { staffId, tenantId };

    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = startDate;
      if (endDate) where.startTime.lte = endDate;
    }

    const appointments = await this.prisma.appointment.findMany({
      where,
      orderBy: { startTime: 'asc' },
    });

    return appointments.map((apt) => this.toDomain(apt));
  }

  async findByDateRange(
    tenantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Appointment[]> {
    const appointments = await this.prisma.appointment.findMany({
      where: {
        tenantId,
        startTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { startTime: 'asc' },
    });

    return appointments.map((apt) => this.toDomain(apt));
  }

  async findConflicting(
    tenantId: string,
    staffId: string,
    startTime: Date,
    endTime: Date,
    excludeId?: string,
  ): Promise<Appointment[]> {
    const where: Prisma.AppointmentWhereInput = {
      tenantId,
      staffId,
      status: {
        notIn: [AppointmentStatus.CANCELED, AppointmentStatus.NO_SHOW],
      },
      OR: [
        {
          startTime: {
            gte: startTime,
            lt: endTime,
          },
        },
        {
          endTime: {
            gt: startTime,
            lte: endTime,
          },
        },
        {
          AND: [
            { startTime: { lte: startTime } },
            { endTime: { gte: endTime } },
          ],
        },
      ],
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    const appointments = await this.prisma.appointment.findMany({
      where,
    });

    return appointments.map((apt) => this.toDomain(apt));
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.prisma.appointment.delete({
      where: { id, tenantId },
    });
  }

  async findPendingReminders(type: '24h' | '3h'): Promise<Appointment[]> {
    const now = new Date();
    const targetTime = new Date();

    if (type === '24h') {
      targetTime.setHours(now.getHours() + 24);
    } else {
      targetTime.setHours(now.getHours() + 3);
    }

    const field = type === '24h' ? 'reminderSent24h' : 'reminderSent3h';

    const appointments = await this.prisma.appointment.findMany({
      where: {
        [field]: false,
        status: {
          in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED],
        },
        startTime: {
          gte: targetTime,
          lte: new Date(targetTime.getTime() + 30 * 60000), // 30 minute window
        },
      },
    });

    return appointments.map((apt) => this.toDomain(apt));
  }

  async findByStatus(status: string, tenantId: string): Promise<Appointment[]> {
    const appointments = await this.prisma.appointment.findMany({
      where: {
        status: status as PrismaAppointmentStatus,
        tenantId,
      },
      orderBy: { startTime: 'desc' },
    });

    return appointments.map((apt) => this.toDomain(apt));
  }

  private toDomain(prismaAppointment: PrismaAppointmentData): Appointment {
    return Appointment.fromPersistence(
      prismaAppointment.id,
      {
        tenantId: prismaAppointment.tenantId,
        clientId: prismaAppointment.clientId,
        serviceId: prismaAppointment.serviceId,
        staffId: prismaAppointment.staffId,
        startTime: prismaAppointment.startTime,
        endTime: prismaAppointment.endTime,
        status: prismaAppointment.status as AppointmentStatus,
        notes: prismaAppointment.notes || undefined,
        privateNotes: prismaAppointment.privateNotes || undefined,
        price: Number(prismaAppointment.price),
        discount: Number(prismaAppointment.discount),
        finalPrice: Number(prismaAppointment.finalPrice),
        bookedBy: prismaAppointment.bookedBy || undefined,
        reminderSent24h: prismaAppointment.reminderSent24h,
        reminderSent3h: prismaAppointment.reminderSent3h,
        confirmationSent: prismaAppointment.confirmationSent,
      },
      prismaAppointment.createdAt,
      prismaAppointment.updatedAt,
    );
  }
}

@Injectable()
export class DefaultAvailabilityService implements AvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  async checkStaffAvailability(
    tenantId: string,
    staffId: string,
    startTime: Date,
    endTime: Date,
    excludeAppointmentId?: string,
  ): Promise<boolean> {
    const conflicts = await this.prisma.appointment.findMany({
      where: {
        tenantId,
        staffId,
        startTime: {
          lt: endTime,
        },
        endTime: {
          gt: startTime,
        },
        ...(excludeAppointmentId && {
          id: { not: excludeAppointmentId },
        }),
        status: {
          in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'],
        },
      },
    });

    return conflicts.length === 0;
  }

  async getAvailableSlots(
    tenantId: string,
    staffId: string,
    date: Date,
    serviceDuration: number,
  ): Promise<Date[]> {
    // Simple implementation - can be enhanced with business hours, breaks, etc.
    const slots: Date[] = [];
    const startOfDay = new Date(date);
    startOfDay.setHours(9, 0, 0, 0); // 9 AM start

    const endOfDay = new Date(date);
    endOfDay.setHours(18, 0, 0, 0); // 6 PM end

    const slotDuration = serviceDuration; // in minutes

    let currentSlot = new Date(startOfDay);

    while (currentSlot < endOfDay) {
      const slotEnd = new Date(currentSlot.getTime() + slotDuration * 60000);

      const isAvailable = await this.checkStaffAvailability(
        tenantId,
        staffId,
        currentSlot,
        slotEnd,
      );

      if (isAvailable) {
        slots.push(new Date(currentSlot));
      }

      currentSlot = new Date(currentSlot.getTime() + 30 * 60000); // 30-minute intervals
    }

    return slots;
  }

  async findNextAvailableSlot(
    tenantId: string,
    staffId: string,
    preferredDate: Date,
    serviceDuration: number,
  ): Promise<Date | null> {
    const searchDate = new Date(preferredDate);
    const maxDaysAhead = 30; // Search up to 30 days ahead

    for (let i = 0; i < maxDaysAhead; i++) {
      const slots = await this.getAvailableSlots(
        tenantId,
        staffId,
        searchDate,
        serviceDuration,
      );

      if (slots.length > 0) {
        return slots[0]; // Return first available slot
      }

      searchDate.setDate(searchDate.getDate() + 1);
    }

    return null; // No available slots found
  }
}
