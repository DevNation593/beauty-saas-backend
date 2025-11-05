import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Inject } from '@nestjs/common';
import { Sale, PaymentMethod, SaleItemProps } from '../../domain/Sale';
import type { SaleRepository } from '../../domain/SaleRepository';

export class CreateSaleCommand {
  constructor(
    public readonly tenantId: string,
    public readonly clientId: string,
    public readonly staffId: string,
    public readonly items: Array<{
      type: 'SERVICE' | 'PRODUCT';
      itemId: string;
      name: string;
      quantity: number;
      unitPrice: number;
      discount?: number;
    }>,
    public readonly discount: number = 0,
    public readonly tax: number = 0,
    public readonly tip: number = 0,
    public readonly paymentMethod: PaymentMethod,
    public readonly paymentDetails?: Record<string, any>,
    public readonly notes?: string,
  ) {}
}

export class ProcessPaymentCommand {
  constructor(
    public readonly saleId: string,
    public readonly tenantId: string,
    public readonly paymentMethod: PaymentMethod,
    public readonly paymentDetails?: Record<string, any>,
  ) {}
}

export class RefundSaleCommand {
  constructor(
    public readonly saleId: string,
    public readonly tenantId: string,
    public readonly reason?: string,
    public readonly refundAmount?: number, // If partial refund
  ) {}
}

export class UpdateSaleCommand {
  constructor(
    public readonly saleId: string,
    public readonly tenantId: string,
    public readonly discount?: number,
    public readonly tax?: number,
    public readonly tip?: number,
    public readonly notes?: string,
  ) {}
}

export class CancelSaleCommand {
  constructor(
    public readonly saleId: string,
    public readonly tenantId: string,
    public readonly reason?: string,
  ) {}
}

@Injectable()
@CommandHandler(CreateSaleCommand)
export class CreateSaleCommandHandler
  implements ICommandHandler<CreateSaleCommand>
{
  constructor(
    @Inject('SALE_REPOSITORY') private readonly saleRepository: SaleRepository,
  ) {}

  async execute(command: CreateSaleCommand): Promise<string> {
    const saleItems: Omit<SaleItemProps, 'id'>[] = command.items.map(
      (item) => ({
        itemId: item.itemId, // Added itemId for Prisma mapping
        type: item.type,
        referenceId: item.itemId,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount || 0,
        subtotal: item.quantity * item.unitPrice,
        taxRate: 0, // Default tax rate
        taxAmount: 0, // Will be calculated by domain
        total: item.quantity * item.unitPrice - (item.discount || 0),
        staffId: undefined,
        notes: undefined,
      }),
    );

    const sale = Sale.create(
      command.tenantId,
      command.staffId,
      command.staffId, // cashierId same as staffId for now
      saleItems,
      command.clientId,
      undefined, // appointmentId
    );

    await this.saleRepository.save(sale);

    return sale.id;
  }
}

@Injectable()
@CommandHandler(ProcessPaymentCommand)
export class ProcessPaymentCommandHandler
  implements ICommandHandler<ProcessPaymentCommand>
{
  constructor(
    @Inject('SALE_REPOSITORY') private readonly saleRepository: SaleRepository,
  ) {}

  async execute(command: ProcessPaymentCommand): Promise<void> {
    const sale = await this.saleRepository.findById(
      command.saleId,
      command.tenantId,
    );
    if (!sale) {
      throw new Error('Sale not found');
    }

    sale.processPayment(command.paymentMethod, command.paymentDetails);
    await this.saleRepository.update(sale);
  }
}

@Injectable()
@CommandHandler(RefundSaleCommand)
export class RefundSaleCommandHandler
  implements ICommandHandler<RefundSaleCommand>
{
  constructor(
    @Inject('SALE_REPOSITORY') private readonly saleRepository: SaleRepository,
  ) {}

  async execute(command: RefundSaleCommand): Promise<void> {
    const sale = await this.saleRepository.findById(
      command.saleId,
      command.tenantId,
    );
    if (!sale) {
      throw new Error('Sale not found');
    }

    if (command.refundAmount) {
      sale.processPartialRefund(command.refundAmount, command.reason);
    } else {
      sale.processRefund(command.reason);
    }

    await this.saleRepository.update(sale);
  }
}

@Injectable()
@CommandHandler(UpdateSaleCommand)
export class UpdateSaleCommandHandler
  implements ICommandHandler<UpdateSaleCommand>
{
  constructor(
    @Inject('SALE_REPOSITORY') private readonly saleRepository: SaleRepository,
  ) {}

  async execute(command: UpdateSaleCommand): Promise<void> {
    const sale = await this.saleRepository.findById(
      command.saleId,
      command.tenantId,
    );
    if (!sale) {
      throw new Error('Sale not found');
    }

    sale.updateTotals({
      discountAmount: command.discount,
      taxAmount: command.tax,
      tipAmount: command.tip,
    });

    if (command.notes !== undefined) {
      sale.updateNotes(command.notes);
    }

    await this.saleRepository.update(sale);
  }
}

@Injectable()
@CommandHandler(CancelSaleCommand)
export class CancelSaleCommandHandler
  implements ICommandHandler<CancelSaleCommand>
{
  constructor(
    @Inject('SALE_REPOSITORY') private readonly saleRepository: SaleRepository,
  ) {}

  async execute(command: CancelSaleCommand): Promise<void> {
    const sale = await this.saleRepository.findById(
      command.saleId,
      command.tenantId,
    );
    if (!sale) {
      throw new Error('Sale not found');
    }

    sale.cancel(command.reason);
    await this.saleRepository.update(sale);
  }
}
