import {
  IsString,
  IsDateString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsNotEmpty,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Appointment, AppointmentStatus } from '../../domain/Appointment';
import { PaginationDto } from '../../../../common/http/dto/pagination.dto';

export class CreateAppointmentDto {
  @IsNotEmpty()
  @IsUUID()
  clientId: string;

  @IsNotEmpty()
  @IsUUID()
  serviceId: string;

  @IsNotEmpty()
  @IsUUID()
  staffId: string;

  @IsNotEmpty()
  @IsDateString()
  startTime: string;

  @IsNotEmpty()
  @IsDateString()
  endTime: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateAppointmentDto {
  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  privateNotes?: string;
}

export class RescheduleAppointmentDto {
  @IsNotEmpty()
  @IsDateString()
  newStartTime: string;

  @IsNotEmpty()
  @IsDateString()
  newEndTime: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class CancelAppointmentDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

export class AppointmentResponseDto {
  id: string;
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
  createdAt: Date;
  updatedAt: Date;

  static fromDomain(appointment: Appointment): AppointmentResponseDto {
    const dto = new AppointmentResponseDto();
    dto.id = appointment.id;
    dto.clientId = appointment.clientId;
    dto.serviceId = appointment.serviceId;
    dto.staffId = appointment.staffId;
    dto.startTime = appointment.startTime;
    dto.endTime = appointment.endTime;
    dto.status = appointment.status;
    dto.notes = appointment.notes;
    dto.privateNotes = appointment.privateNotes;
    dto.price = appointment.price;
    dto.discount = appointment.discount;
    dto.finalPrice = appointment.finalPrice;
    dto.bookedBy = appointment.bookedBy;
    dto.reminderSent24h = appointment.reminderSent24h;
    dto.reminderSent3h = appointment.reminderSent3h;
    dto.confirmationSent = appointment.confirmationSent;
    dto.createdAt = appointment.createdAt;
    dto.updatedAt = appointment.updatedAt;
    return dto;
  }
}

export class GetAppointmentsQueryDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  staffId?: string;

  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;
}

export class CheckAvailabilityDto {
  @IsNotEmpty()
  @IsUUID()
  staffId: string;

  @IsNotEmpty()
  @IsDateString()
  startTime: string;

  @IsNotEmpty()
  @IsDateString()
  endTime: string;

  @IsOptional()
  @IsUUID()
  excludeAppointmentId?: string;
}

export class GetAvailableSlotsDto {
  @IsNotEmpty()
  @IsUUID()
  staffId: string;

  @IsNotEmpty()
  @IsDateString()
  date: string;

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  serviceDuration: number; // in minutes
}

export class AvailabilityResponseDto {
  available: boolean;
  conflicts?: string[];
}

export class AvailableSlotsResponseDto {
  date: string;
  slots: Date[];
}
