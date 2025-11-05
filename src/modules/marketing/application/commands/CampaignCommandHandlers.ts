import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import {
  Campaign,
  CampaignType,
  MessageChannel,
  ClientSegment,
} from '../../domain/Campaign';
import type { CampaignRepository } from '../../domain/CampaignRepository';

export class CreateCampaignCommand {
  constructor(
    public readonly tenantId: string,
    public readonly name: string,
    public readonly description: string | undefined,
    public readonly type: CampaignType,
    public readonly targetSegment: ClientSegment,
    public readonly template: string,
    public readonly variables: Record<string, unknown>,
    public readonly channel: MessageChannel,
    public readonly scheduledAt?: Date,
  ) {}
}

export class LaunchCampaignCommand {
  constructor(
    public readonly campaignId: string,
    public readonly tenantId: string,
    public readonly targetCount: number,
  ) {}
}

export class PauseCampaignCommand {
  constructor(
    public readonly campaignId: string,
    public readonly tenantId: string,
  ) {}
}

export class DeleteCampaignCommand {
  constructor(
    public readonly campaignId: string,
    public readonly tenantId: string,
  ) {}
}

@Injectable()
@CommandHandler(CreateCampaignCommand)
export class CreateCampaignCommandHandler
  implements ICommandHandler<CreateCampaignCommand>
{
  constructor(private readonly campaignRepository: CampaignRepository) {}

  async execute(command: CreateCampaignCommand): Promise<string> {
    const campaign = Campaign.create({
      tenantId: command.tenantId,
      name: command.name,
      description: command.description,
      type: command.type,
      targetSegment: command.targetSegment,
      template: command.template,
      variables: command.variables,
      channel: command.channel,
      scheduledAt: command.scheduledAt,
    });

    await this.campaignRepository.save(campaign);
    return campaign.id;
  }
}

@Injectable()
@CommandHandler(LaunchCampaignCommand)
export class LaunchCampaignCommandHandler
  implements ICommandHandler<LaunchCampaignCommand>
{
  constructor(private readonly campaignRepository: CampaignRepository) {}

  async execute(command: LaunchCampaignCommand): Promise<void> {
    const campaign = await this.campaignRepository.findById(
      command.campaignId,
      command.tenantId,
    );

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    campaign.launch(command.targetCount);
    await this.campaignRepository.update(campaign);
  }
}

@Injectable()
@CommandHandler(PauseCampaignCommand)
export class PauseCampaignCommandHandler
  implements ICommandHandler<PauseCampaignCommand>
{
  constructor(private readonly campaignRepository: CampaignRepository) {}

  async execute(command: PauseCampaignCommand): Promise<void> {
    const campaign = await this.campaignRepository.findById(
      command.campaignId,
      command.tenantId,
    );

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    campaign.pause();
    await this.campaignRepository.update(campaign);
  }
}

@Injectable()
@CommandHandler(DeleteCampaignCommand)
export class DeleteCampaignCommandHandler
  implements ICommandHandler<DeleteCampaignCommand>
{
  constructor(private readonly campaignRepository: CampaignRepository) {}

  async execute(command: DeleteCampaignCommand): Promise<void> {
    await this.campaignRepository.delete(command.campaignId, command.tenantId);
  }
}
