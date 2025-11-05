export class GetAppointmentQuery {
  constructor(
    public readonly appointmentId: string,
    public readonly tenantId: string,
  ) {}
}

export class GetAppointmentsByClientQuery {
  constructor(
    public readonly clientId: string,
    public readonly tenantId: string,
  ) {}
}

export class GetAppointmentsByStaffQuery {
  constructor(
    public readonly staffId: string,
    public readonly tenantId: string,
    public readonly startDate?: Date,
    public readonly endDate?: Date,
  ) {}
}

export class GetAppointmentsByDateRangeQuery {
  constructor(
    public readonly tenantId: string,
    public readonly startDate: Date,
    public readonly endDate: Date,
    public readonly staffId?: string,
    public readonly status?: string,
  ) {}
}

export class CheckAvailabilityQuery {
  constructor(
    public readonly tenantId: string,
    public readonly staffId: string,
    public readonly startTime: Date,
    public readonly endTime: Date,
    public readonly excludeAppointmentId?: string,
  ) {}
}

export class GetAvailableSlotsQuery {
  constructor(
    public readonly tenantId: string,
    public readonly staffId: string,
    public readonly date: Date,
    public readonly serviceDuration: number,
  ) {}
}
