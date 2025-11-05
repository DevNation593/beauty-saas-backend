import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { RoleGuard } from '../../../common/auth/rbac/role.guard';
import { SupabaseAuthGuard } from '../../../common/auth/supabase/supabase-auth.guard';
import { TenantGuard } from '../../../common/auth/tenancy/tenant.guard';
import {
  CurrentTenant,
  RequireTenant,
} from '../../../common/auth/tenancy/tenant.decorator';
import {
  CreateAppointmentDto,
  RescheduleAppointmentDto,
  CancelAppointmentDto,
  AppointmentResponseDto,
  GetAppointmentsQueryDto,
  CheckAvailabilityDto,
  GetAvailableSlotsDto,
  AvailabilityResponseDto,
  AvailableSlotsResponseDto,
} from './dto/appointment.dto';
import { PaginatedResponseDto } from '../../../common/http/dto/pagination.dto';
import {
  CreateAppointmentCommand,
  ConfirmAppointmentCommand,
  CancelAppointmentCommand,
  RescheduleAppointmentCommand,
  CompleteAppointmentCommand,
  MarkNoShowCommand,
} from '../application/commands/AppointmentCommands';
import {
  GetAppointmentQuery,
  GetAppointmentsByDateRangeQuery,
  CheckAvailabilityQuery,
  GetAvailableSlotsQuery,
} from '../application/queries/AppointmentQueries';

@Controller('appointments')
@UseGuards(TenantGuard)
export class AppointmentController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @RequireTenant()
  async createAppointment(
    @Body(ValidationPipe) dto: CreateAppointmentDto,
    @CurrentTenant('id') tenantId: string,
  ): Promise<{ appointmentId: string }> {
    const appointmentId = await this.commandBus.execute(
      new CreateAppointmentCommand(
        tenantId,
        dto.clientId,
        dto.serviceId,
        dto.staffId,
        new Date(dto.startTime),
        new Date(dto.endTime),
        dto.notes,
      ),
    );

    return { appointmentId };
  }

  @Get()
  @RequireTenant()
  async getAppointments(
    @Query(ValidationPipe) query: GetAppointmentsQueryDto,
    @CurrentTenant('id') tenantId: string,
  ): Promise<PaginatedResponseDto<AppointmentResponseDto>> {
    const startDate = query.startDate ? new Date(query.startDate) : undefined;
    const endDate = query.endDate ? new Date(query.endDate) : undefined;

    const appointments = await this.queryBus.execute(
      new GetAppointmentsByDateRangeQuery(
        tenantId,
        startDate || new Date(),
        endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to next 7 days
        query.staffId,
        query.status,
      ),
    );

    // Apply pagination (simplified - should be done in query)
    const start = ((query.page || 1) - 1) * (query.limit || 20);
    const end = start + (query.limit || 20);
    const paginatedData = appointments.slice(start, end);

    const responseData = paginatedData.map((apt) =>
      AppointmentResponseDto.fromDomain(apt),
    );

    return new PaginatedResponseDto(
      responseData,
      appointments.length,
      query.page || 1,
      query.limit || 20,
    );
  }

  @Get(':id')
  @RequireTenant()
  async getAppointment(
    @Param('id') id: string,
    @CurrentTenant('id') tenantId: string,
  ): Promise<AppointmentResponseDto> {
    const appointment = await this.queryBus.execute(
      new GetAppointmentQuery(id, tenantId),
    );

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    return AppointmentResponseDto.fromDomain(appointment);
  }

  @Put(':id/confirm')
  @RequireTenant()
  async confirmAppointment(
    @Param('id') id: string,
    @CurrentTenant('id') tenantId: string,
  ): Promise<{ success: boolean }> {
    await this.commandBus.execute(new ConfirmAppointmentCommand(id, tenantId));
    return { success: true };
  }

  @Put(':id/complete')
  @RequireTenant()
  async completeAppointment(
    @Param('id') id: string,
    @CurrentTenant('id') tenantId: string,
  ): Promise<{ success: boolean }> {
    await this.commandBus.execute(new CompleteAppointmentCommand(id, tenantId));
    return { success: true };
  }

  @Put(':id/no-show')
  @RequireTenant()
  async markNoShow(
    @Param('id') id: string,
    @CurrentTenant('id') tenantId: string,
  ): Promise<{ success: boolean }> {
    await this.commandBus.execute(new MarkNoShowCommand(id, tenantId));
    return { success: true };
  }

  @Put(':id/reschedule')
  @RequireTenant()
  async rescheduleAppointment(
    @Param('id') id: string,
    @Body(ValidationPipe) dto: RescheduleAppointmentDto,
    @CurrentTenant('id') tenantId: string,
  ): Promise<{ success: boolean }> {
    await this.commandBus.execute(
      new RescheduleAppointmentCommand(
        id,
        tenantId,
        new Date(dto.newStartTime),
        new Date(dto.newEndTime),
      ),
    );
    return { success: true };
  }

  @Put(':id/cancel')
  @RequireTenant()
  async cancelAppointment(
    @Param('id') id: string,
    @Body(ValidationPipe) dto: CancelAppointmentDto,
    @CurrentTenant('id') tenantId: string,
  ): Promise<{ success: boolean }> {
    await this.commandBus.execute(
      new CancelAppointmentCommand(id, tenantId, dto.reason),
    );
    return { success: true };
  }

  @Post('check-availability')
  @RequireTenant()
  async checkAvailability(
    @Body(ValidationPipe) dto: CheckAvailabilityDto,
    @CurrentTenant('id') tenantId: string,
  ): Promise<AvailabilityResponseDto> {
    const available = await this.queryBus.execute(
      new CheckAvailabilityQuery(
        tenantId,
        dto.staffId,
        new Date(dto.startTime),
        new Date(dto.endTime),
        dto.excludeAppointmentId,
      ),
    );

    return { available };
  }

  @Post('available-slots')
  @RequireTenant()
  async getAvailableSlots(
    @Body(ValidationPipe) dto: GetAvailableSlotsDto,
    @CurrentTenant('id') tenantId: string,
  ): Promise<AvailableSlotsResponseDto> {
    const slots = await this.queryBus.execute(
      new GetAvailableSlotsQuery(
        tenantId,
        dto.staffId,
        new Date(dto.date),
        dto.serviceDuration,
      ),
    );

    return {
      date: dto.date,
      slots,
    };
  }
}
