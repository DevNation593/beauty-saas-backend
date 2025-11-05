import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Inject } from '@nestjs/common';
import {
  Client,
  ClientStatus,
  ClientSegment,
  ClientProps,
} from '../../domain/Client';
import type { ClientRepository } from '../../domain/ClientRepository';
import { CLIENT_REPOSITORY } from '../../domain/client.tokens';

export class CreateClientCommand {
  constructor(
    public readonly tenantId: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly email?: string,
    public readonly phone?: string,
    public readonly dateOfBirth?: Date,
    public readonly address?: string,
    public readonly city?: string,
    public readonly state?: string,
    public readonly zipCode?: string,
    public readonly country?: string,
    public readonly notes?: string,
    public readonly tags: string[] = [],
    public readonly preferences: Record<string, any> = {},
    public readonly marketingConsent: boolean = false,
    public readonly referredBy?: string,
  ) {}
}

export class UpdateClientCommand {
  constructor(
    public readonly clientId: string,
    public readonly tenantId: string,
    public readonly firstName?: string,
    public readonly lastName?: string,
    public readonly email?: string,
    public readonly phone?: string,
    public readonly dateOfBirth?: Date,
    public readonly address?: string,
    public readonly city?: string,
    public readonly state?: string,
    public readonly zipCode?: string,
    public readonly country?: string,
    public readonly notes?: string,
    public readonly tags?: string[],
    public readonly preferences?: Record<string, any>,
    public readonly marketingConsent?: boolean,
  ) {}
}

export class DeleteClientCommand {
  constructor(
    public readonly clientId: string,
    public readonly tenantId: string,
  ) {}
}

export class AddClientTagCommand {
  constructor(
    public readonly clientId: string,
    public readonly tenantId: string,
    public readonly tag: string,
  ) {}
}

export class RemoveClientTagCommand {
  constructor(
    public readonly clientId: string,
    public readonly tenantId: string,
    public readonly tag: string,
  ) {}
}

export class UpdateClientSegmentCommand {
  constructor(
    public readonly clientId: string,
    public readonly tenantId: string,
    public readonly totalSpent: number,
    public readonly visitCount: number,
    public readonly lastVisit: Date,
  ) {}
}

@Injectable()
@CommandHandler(CreateClientCommand)
export class CreateClientCommandHandler
  implements ICommandHandler<CreateClientCommand>
{
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: ClientRepository,
  ) {}

  async execute(command: CreateClientCommand): Promise<string> {
    // Check if client already exists by email or phone
    if (command.email) {
      const existingClient = await this.clientRepository.findByEmail(
        command.email,
        command.tenantId,
      );
      if (existingClient) {
        throw new Error('Client with this email already exists');
      }
    }

    if (command.phone) {
      const existingClient = await this.clientRepository.findByPhone(
        command.phone,
        command.tenantId,
      );
      if (existingClient) {
        throw new Error('Client with this phone already exists');
      }
    }

    const client = Client.create({
      tenantId: command.tenantId,
      firstName: command.firstName,
      lastName: command.lastName,
      email: command.email,
      phone: command.phone,
      dateOfBirth: command.dateOfBirth,
      address: command.address,
      city: command.city,
      state: command.state,
      zipCode: command.zipCode,
      country: command.country,
      status: ClientStatus.ACTIVE,
      segment: ClientSegment.NEW,
      notes: command.notes,
      tags: command.tags,
      preferences: command.preferences,
      marketingConsent: command.marketingConsent,
      referredBy: command.referredBy,
    });

    await this.clientRepository.save(client);

    return client.id;
  }
}

@Injectable()
@CommandHandler(UpdateClientCommand)
export class UpdateClientCommandHandler
  implements ICommandHandler<UpdateClientCommand>
{
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: ClientRepository,
  ) {}

  async execute(command: UpdateClientCommand): Promise<void> {
    const client = await this.clientRepository.findById(
      command.clientId,
      command.tenantId,
    );
    if (!client) {
      throw new Error('Client not found');
    }

    // Check for email conflicts if email is being updated
    if (command.email && command.email !== client.email) {
      const existingClient = await this.clientRepository.findByEmail(
        command.email,
        command.tenantId,
      );
      if (existingClient && existingClient.id !== client.id) {
        throw new Error('Another client with this email already exists');
      }
    }

    // Check for phone conflicts if phone is being updated
    if (command.phone && command.phone !== client.phone) {
      const existingClient = await this.clientRepository.findByPhone(
        command.phone,
        command.tenantId,
      );
      if (existingClient && existingClient.id !== client.id) {
        throw new Error('Another client with this phone already exists');
      }
    }

    const updates: Partial<
      Pick<
        ClientProps,
        | 'firstName'
        | 'lastName'
        | 'email'
        | 'phone'
        | 'dateOfBirth'
        | 'address'
        | 'city'
        | 'state'
        | 'zipCode'
        | 'country'
        | 'notes'
      >
    > = {};
    if (command.firstName !== undefined) updates.firstName = command.firstName;
    if (command.lastName !== undefined) updates.lastName = command.lastName;
    if (command.email !== undefined) updates.email = command.email;
    if (command.phone !== undefined) updates.phone = command.phone;
    if (command.dateOfBirth !== undefined)
      updates.dateOfBirth = command.dateOfBirth;
    if (command.address !== undefined) updates.address = command.address;
    if (command.city !== undefined) updates.city = command.city;
    if (command.state !== undefined) updates.state = command.state;
    if (command.zipCode !== undefined) updates.zipCode = command.zipCode;
    if (command.country !== undefined) updates.country = command.country;
    if (command.notes !== undefined) updates.notes = command.notes;

    if (Object.keys(updates).length > 0) {
      client.updateProfile(updates);
    }

    if (command.tags !== undefined) {
      client.updateTags(command.tags);
    }

    if (command.preferences !== undefined) {
      client.updatePreferences(command.preferences);
    }

    if (command.marketingConsent !== undefined) {
      client.updateMarketingConsent(command.marketingConsent);
    }

    await this.clientRepository.update(client);
  }
}

@Injectable()
@CommandHandler(DeleteClientCommand)
export class DeleteClientCommandHandler
  implements ICommandHandler<DeleteClientCommand>
{
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: ClientRepository,
  ) {}

  async execute(command: DeleteClientCommand): Promise<void> {
    const client = await this.clientRepository.findById(
      command.clientId,
      command.tenantId,
    );
    if (!client) {
      throw new Error('Client not found');
    }

    await this.clientRepository.delete(command.clientId, command.tenantId);
  }
}

@Injectable()
@CommandHandler(AddClientTagCommand)
export class AddClientTagCommandHandler
  implements ICommandHandler<AddClientTagCommand>
{
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: ClientRepository,
  ) {}

  async execute(command: AddClientTagCommand): Promise<void> {
    const client = await this.clientRepository.findById(
      command.clientId,
      command.tenantId,
    );
    if (!client) {
      throw new Error('Client not found');
    }

    client.addTag(command.tag);
    await this.clientRepository.update(client);
  }
}

@Injectable()
@CommandHandler(RemoveClientTagCommand)
export class RemoveClientTagCommandHandler
  implements ICommandHandler<RemoveClientTagCommand>
{
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: ClientRepository,
  ) {}

  async execute(command: RemoveClientTagCommand): Promise<void> {
    const client = await this.clientRepository.findById(
      command.clientId,
      command.tenantId,
    );
    if (!client) {
      throw new Error('Client not found');
    }

    client.removeTag(command.tag);
    await this.clientRepository.update(client);
  }
}

@Injectable()
@CommandHandler(UpdateClientSegmentCommand)
export class UpdateClientSegmentCommandHandler
  implements ICommandHandler<UpdateClientSegmentCommand>
{
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: ClientRepository,
  ) {}

  async execute(command: UpdateClientSegmentCommand): Promise<void> {
    const client = await this.clientRepository.findById(
      command.clientId,
      command.tenantId,
    );
    if (!client) {
      throw new Error('Client not found');
    }

    client.updateVisitHistory(command.totalSpent, command.lastVisit);
    await this.clientRepository.update(client);
  }
}
