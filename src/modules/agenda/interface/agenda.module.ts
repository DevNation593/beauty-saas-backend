import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

// Database
import { DatabaseModule } from '../../../common/infra/database/database.module';

// Controllers
import { AppointmentController } from './appointment.controller';

// Command Handlers
import {
  CreateAppointmentHandler,
  ConfirmAppointmentHandler,
  CancelAppointmentHandler,
  RescheduleAppointmentHandler,
  CompleteAppointmentHandler,
  MarkNoShowHandler,
} from '../application/handlers/AppointmentCommandHandlers';

// Query Handlers
import {
  GetAppointmentHandler,
  GetAppointmentsByClientHandler,
  GetAppointmentsByStaffHandler,
  GetAppointmentsByDateRangeHandler,
  CheckAvailabilityHandler,
  GetAvailableSlotsHandler,
} from '../application/handlers/AppointmentQueryHandlers';

// Repositories and Services
import {
  PrismaAppointmentRepository,
  DefaultAvailabilityService,
} from '../infra/repositories/PrismaAppointmentRepository';

const commandHandlers = [
  CreateAppointmentHandler,
  ConfirmAppointmentHandler,
  CancelAppointmentHandler,
  RescheduleAppointmentHandler,
  CompleteAppointmentHandler,
  MarkNoShowHandler,
];

const queryHandlers = [
  GetAppointmentHandler,
  GetAppointmentsByClientHandler,
  GetAppointmentsByStaffHandler,
  GetAppointmentsByDateRangeHandler,
  CheckAvailabilityHandler,
  GetAvailableSlotsHandler,
];

@Module({
  imports: [CqrsModule, DatabaseModule],
  controllers: [AppointmentController],
  providers: [
    ...commandHandlers,
    ...queryHandlers,
    {
      provide: 'AppointmentRepository',
      useClass: PrismaAppointmentRepository,
    },
    {
      provide: 'AvailabilityService',
      useClass: DefaultAvailabilityService,
    },
    // Provide concrete implementations for DI
    PrismaAppointmentRepository,
    DefaultAvailabilityService,
  ],
  exports: ['AppointmentRepository', 'AvailabilityService'],
})
export class AgendaModule {}
