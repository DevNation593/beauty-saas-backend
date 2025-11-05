export class CreateAppointmentCommand {
  constructor(
    public readonly tenantId: string,
    public readonly clientId: string,
    public readonly serviceId: string,
    public readonly staffId: string,
    public readonly startTime: Date,
    public readonly endTime: Date,
    public readonly notes?: string,
    public readonly bookedBy?: string,
  ) {}
}

export class ConfirmAppointmentCommand {
  constructor(
    public readonly appointmentId: string,
    public readonly tenantId: string,
  ) {}
}

export class CancelAppointmentCommand {
  constructor(
    public readonly appointmentId: string,
    public readonly tenantId: string,
    public readonly reason?: string,
  ) {}
}

export class RescheduleAppointmentCommand {
  constructor(
    public readonly appointmentId: string,
    public readonly tenantId: string,
    public readonly newStartTime: Date,
    public readonly newEndTime: Date,
  ) {}
}

export class CompleteAppointmentCommand {
  constructor(
    public readonly appointmentId: string,
    public readonly tenantId: string,
  ) {}
}

export class MarkNoShowCommand {
  constructor(
    public readonly appointmentId: string,
    public readonly tenantId: string,
  ) {}
}
