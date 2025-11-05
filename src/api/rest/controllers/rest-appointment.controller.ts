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
import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { TenantGuard } from '../../../common/auth/tenancy/tenant.guard';
import { SupabaseAuthGuard } from '../../../common/auth/supabase/supabase-auth.guard';
import {
  CurrentTenant,
  RequireTenant,
} from '../../../common/auth/tenancy/tenant.decorator';
import {
  RestController,
  ApiPaginated,
} from '../decorators/api-version.decorator';
import {
  ApiResponseDto,
  PaginatedResponseDto,
  PaginationDto,
} from '../dto/common.dto';

// Import existing DTOs from agenda module
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
} from '../../../modules/agenda/interface/dto/appointment.dto';

// Import commands and queries
import {
  CreateAppointmentCommand,
  ConfirmAppointmentCommand,
  CancelAppointmentCommand,
  RescheduleAppointmentCommand,
  CompleteAppointmentCommand,
  MarkNoShowCommand,
} from '../../../modules/agenda/application/commands/AppointmentCommands';

import {
  GetAppointmentQuery,
  GetAppointmentsByDateRangeQuery,
  CheckAvailabilityQuery,
  GetAvailableSlotsQuery,
} from '../../../modules/agenda/application/queries/AppointmentQueries';

@RestController('Appointments & Scheduling')
@Controller('v1/appointments')
@UseGuards(SupabaseAuthGuard, TenantGuard)
@RequireTenant()
export class RestAppointmentController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create new appointment' })
  @ApiResponse({
    status: 201,
    description: 'Appointment created successfully',
    type: ApiResponseDto<{ appointmentId: string }>,
  })
  @ApiBearerAuth()
  async createAppointment(
    @Body(ValidationPipe) dto: CreateAppointmentDto,
    @CurrentTenant('id') tenantId: string,
  ): Promise<ApiResponseDto<{ appointmentId: string }>> {
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

    return new ApiResponseDto(
      { appointmentId },
      'Appointment created successfully',
    );
  }

  @Get()
  @ApiPaginated()
  @ApiOperation({ summary: 'Get appointments with filters and pagination' })
  @ApiResponse({
    status: 200,
    description: 'Appointments retrieved successfully',
    type: PaginatedResponseDto<AppointmentResponseDto>,
  })
  @ApiBearerAuth()
  async getAppointments(
    @Query(ValidationPipe) query: GetAppointmentsQueryDto,
    @Query() pagination: PaginationDto,
    @CurrentTenant('id') tenantId: string,
  ): Promise<PaginatedResponseDto<AppointmentResponseDto>> {
    const startDate = query.startDate ? new Date(query.startDate) : undefined;
    const endDate = query.endDate ? new Date(query.endDate) : undefined;

    const appointments = await this.queryBus.execute(
      new GetAppointmentsByDateRangeQuery(
        tenantId,
        startDate || new Date(),
        endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        query.staffId,
        query.status,
      ),
    );

    // Apply pagination
    const start = ((pagination.page || 1) - 1) * (pagination.limit || 20);
    const end = start + (pagination.limit || 20);
    const paginatedData = appointments.slice(start, end);

    const responseData = paginatedData.map((apt: any) =>
      AppointmentResponseDto.fromDomain(apt),
    );

    return new PaginatedResponseDto(
      responseData,
      pagination.page || 1,
      pagination.limit || 20,
      appointments.length,
      'Appointments retrieved successfully',
    );
  }

  @Get(':id')
  @ApiParam({ name: 'id', description: 'Appointment ID' })
  @ApiOperation({ summary: 'Get appointment by ID' })
  @ApiResponse({
    status: 200,
    description: 'Appointment retrieved successfully',
    type: ApiResponseDto<AppointmentResponseDto>,
  })
  @ApiBearerAuth()
  async getAppointment(
    @Param('id') id: string,
    @CurrentTenant('id') tenantId: string,
  ): Promise<ApiResponseDto<AppointmentResponseDto>> {
    const appointment = await this.queryBus.execute(
      new GetAppointmentQuery(id, tenantId),
    );

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    const response = AppointmentResponseDto.fromDomain(appointment);
    return new ApiResponseDto(response, 'Appointment retrieved successfully');
  }

  @Put(':id/confirm')
  @ApiParam({ name: 'id', description: 'Appointment ID' })
  @ApiOperation({ summary: 'Confirm appointment' })
  @ApiResponse({
    status: 200,
    description: 'Appointment confirmed successfully',
    type: ApiResponseDto<boolean>,
  })
  @ApiBearerAuth()
  async confirmAppointment(
    @Param('id') id: string,
    @CurrentTenant('id') tenantId: string,
  ): Promise<ApiResponseDto<boolean>> {
    await this.commandBus.execute(new ConfirmAppointmentCommand(id, tenantId));
    return new ApiResponseDto(true, 'Appointment confirmed successfully');
  }

  @Put(':id/complete')
  @ApiParam({ name: 'id', description: 'Appointment ID' })
  @ApiOperation({ summary: 'Mark appointment as completed' })
  @ApiResponse({
    status: 200,
    description: 'Appointment completed successfully',
    type: ApiResponseDto<boolean>,
  })
  @ApiBearerAuth()
  async completeAppointment(
    @Param('id') id: string,
    @CurrentTenant('id') tenantId: string,
  ): Promise<ApiResponseDto<boolean>> {
    await this.commandBus.execute(new CompleteAppointmentCommand(id, tenantId));
    return new ApiResponseDto(true, 'Appointment completed successfully');
  }

  @Put(':id/no-show')
  @ApiParam({ name: 'id', description: 'Appointment ID' })
  @ApiOperation({ summary: 'Mark appointment as no-show' })
  @ApiResponse({
    status: 200,
    description: 'Appointment marked as no-show',
    type: ApiResponseDto<boolean>,
  })
  @ApiBearerAuth()
  async markNoShow(
    @Param('id') id: string,
    @CurrentTenant('id') tenantId: string,
  ): Promise<ApiResponseDto<boolean>> {
    await this.commandBus.execute(new MarkNoShowCommand(id, tenantId));
    return new ApiResponseDto(true, 'Appointment marked as no-show');
  }

  @Put(':id/reschedule')
  @ApiParam({ name: 'id', description: 'Appointment ID' })
  @ApiOperation({ summary: 'Reschedule appointment' })
  @ApiResponse({
    status: 200,
    description: 'Appointment rescheduled successfully',
    type: ApiResponseDto<boolean>,
  })
  @ApiBearerAuth()
  async rescheduleAppointment(
    @Param('id') id: string,
    @Body(ValidationPipe) dto: RescheduleAppointmentDto,
    @CurrentTenant('id') tenantId: string,
  ): Promise<ApiResponseDto<boolean>> {
    await this.commandBus.execute(
      new RescheduleAppointmentCommand(
        id,
        tenantId,
        new Date(dto.newStartTime),
        new Date(dto.newEndTime),
      ),
    );
    return new ApiResponseDto(true, 'Appointment rescheduled successfully');
  }

  @Put(':id/cancel')
  @ApiParam({ name: 'id', description: 'Appointment ID' })
  @ApiOperation({ summary: 'Cancel appointment' })
  @ApiResponse({
    status: 200,
    description: 'Appointment cancelled successfully',
    type: ApiResponseDto<boolean>,
  })
  @ApiBearerAuth()
  async cancelAppointment(
    @Param('id') id: string,
    @Body(ValidationPipe) dto: CancelAppointmentDto,
    @CurrentTenant('id') tenantId: string,
  ): Promise<ApiResponseDto<boolean>> {
    await this.commandBus.execute(
      new CancelAppointmentCommand(id, tenantId, dto.reason),
    );
    return new ApiResponseDto(true, 'Appointment cancelled successfully');
  }

  @Post('check-availability')
  @ApiOperation({ summary: 'Check staff availability for specific time slot' })
  @ApiResponse({
    status: 200,
    description: 'Availability checked successfully',
    type: ApiResponseDto<AvailabilityResponseDto>,
  })
  @ApiBearerAuth()
  async checkAvailability(
    @Body(ValidationPipe) dto: CheckAvailabilityDto,
    @CurrentTenant('id') tenantId: string,
  ): Promise<ApiResponseDto<AvailabilityResponseDto>> {
    const available = await this.queryBus.execute(
      new CheckAvailabilityQuery(
        tenantId,
        dto.staffId,
        new Date(dto.startTime),
        new Date(dto.endTime),
        dto.excludeAppointmentId,
      ),
    );

    const response = { available };
    return new ApiResponseDto(response, 'Availability checked successfully');
  }

  @Post('available-slots')
  @ApiOperation({ summary: 'Get available time slots for specific date' })
  @ApiResponse({
    status: 200,
    description: 'Available slots retrieved successfully',
    type: ApiResponseDto<AvailableSlotsResponseDto>,
  })
  @ApiBearerAuth()
  async getAvailableSlots(
    @Body(ValidationPipe) dto: GetAvailableSlotsDto,
    @CurrentTenant('id') tenantId: string,
  ): Promise<ApiResponseDto<AvailableSlotsResponseDto>> {
    const slots = await this.queryBus.execute(
      new GetAvailableSlotsQuery(
        tenantId,
        dto.staffId,
        new Date(dto.date),
        dto.serviceDuration,
      ),
    );

    const response = {
      date: dto.date,
      slots,
    };

    return new ApiResponseDto(
      response,
      'Available slots retrieved successfully',
    );
  }
}
