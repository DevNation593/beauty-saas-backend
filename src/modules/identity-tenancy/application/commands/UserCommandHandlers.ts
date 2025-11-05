import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { User, UserRole } from '../../domain/User';
import type { UserRepository } from '../../domain/UserRepository';

export class CreateUserCommand {
  constructor(
    public readonly tenantId: string,
    public readonly email: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly role: UserRole,
    public readonly phone?: string,
    public readonly hashedPassword?: string,
  ) {}
}

export class UpdateUserCommand {
  constructor(
    public readonly userId: string,
    public readonly tenantId: string,
    public readonly firstName?: string,
    public readonly lastName?: string,
    public readonly phone?: string,
    public readonly avatar?: string,
    public readonly timezone?: string,
    public readonly locale?: string,
  ) {}
}

export class ChangeUserRoleCommand {
  constructor(
    public readonly userId: string,
    public readonly tenantId: string,
    public readonly newRole: UserRole,
    public readonly changedBy: string,
  ) {}
}

export class ActivateUserCommand {
  constructor(
    public readonly userId: string,
    public readonly tenantId: string,
  ) {}
}

export class DeactivateUserCommand {
  constructor(
    public readonly userId: string,
    public readonly tenantId: string,
  ) {}
}

export class VerifyEmailCommand {
  constructor(public readonly token: string) {}
}

export class ResetPasswordCommand {
  constructor(
    public readonly token: string,
    public readonly newHashedPassword: string,
  ) {}
}

export class ChangePasswordCommand {
  constructor(
    public readonly userId: string,
    public readonly tenantId: string,
    public readonly newHashedPassword: string,
  ) {}
}

export class UpdateUserPreferencesCommand {
  constructor(
    public readonly userId: string,
    public readonly tenantId: string,
    public readonly preferences: Record<string, any>,
  ) {}
}

export class DeleteUserCommand {
  constructor(
    public readonly userId: string,
    public readonly tenantId: string,
  ) {}
}

@Injectable()
@CommandHandler(CreateUserCommand)
export class CreateUserCommandHandler
  implements ICommandHandler<CreateUserCommand>
{
  constructor(private readonly userRepository: UserRepository) {}

  async execute(command: CreateUserCommand): Promise<string> {
    // Check if email already exists
    const existingUser = await this.userRepository.findByEmail(
      command.email,
      command.tenantId,
    );

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const user = User.create(
      command.tenantId,
      command.email,
      command.firstName,
      command.lastName,
      command.role,
      command.hashedPassword,
    );

    if (command.phone) {
      user.updateProfile({ phone: command.phone });
    }

    await this.userRepository.save(user);
    return user.id;
  }
}

@Injectable()
@CommandHandler(UpdateUserCommand)
export class UpdateUserCommandHandler
  implements ICommandHandler<UpdateUserCommand>
{
  constructor(private readonly userRepository: UserRepository) {}

  async execute(command: UpdateUserCommand): Promise<void> {
    const user = await this.userRepository.findById(
      command.userId,
      command.tenantId,
    );

    if (!user) {
      throw new Error('User not found');
    }

    const updates: Record<string, unknown> = {};
    if (command.firstName !== undefined) updates.firstName = command.firstName;
    if (command.lastName !== undefined) updates.lastName = command.lastName;
    if (command.phone !== undefined) updates.phone = command.phone;
    if (command.avatar !== undefined) updates.avatar = command.avatar;
    if (command.timezone !== undefined) updates.timezone = command.timezone;
    if (command.locale !== undefined) updates.locale = command.locale;

    user.updateProfile(updates);
    await this.userRepository.update(user);
  }
}

@Injectable()
@CommandHandler(ChangeUserRoleCommand)
export class ChangeUserRoleCommandHandler
  implements ICommandHandler<ChangeUserRoleCommand>
{
  constructor(private readonly userRepository: UserRepository) {}

  async execute(command: ChangeUserRoleCommand): Promise<void> {
    const user = await this.userRepository.findById(
      command.userId,
      command.tenantId,
    );

    if (!user) {
      throw new Error('User not found');
    }

    if (!user.canChangeRole(command.newRole)) {
      throw new Error('Cannot change user role');
    }

    user.changeRole(command.newRole, command.changedBy);
    await this.userRepository.update(user);
  }
}

@Injectable()
@CommandHandler(ActivateUserCommand)
export class ActivateUserCommandHandler
  implements ICommandHandler<ActivateUserCommand>
{
  constructor(private readonly userRepository: UserRepository) {}

  async execute(command: ActivateUserCommand): Promise<void> {
    const user = await this.userRepository.findById(
      command.userId,
      command.tenantId,
    );

    if (!user) {
      throw new Error('User not found');
    }

    user.activate();
    await this.userRepository.update(user);
  }
}

@Injectable()
@CommandHandler(DeactivateUserCommand)
export class DeactivateUserCommandHandler
  implements ICommandHandler<DeactivateUserCommand>
{
  constructor(private readonly userRepository: UserRepository) {}

  async execute(command: DeactivateUserCommand): Promise<void> {
    const user = await this.userRepository.findById(
      command.userId,
      command.tenantId,
    );

    if (!user) {
      throw new Error('User not found');
    }

    user.deactivate();
    await this.userRepository.update(user);
  }
}

@Injectable()
@CommandHandler(VerifyEmailCommand)
export class VerifyEmailCommandHandler
  implements ICommandHandler<VerifyEmailCommand>
{
  constructor(private readonly userRepository: UserRepository) {}

  async execute(command: VerifyEmailCommand): Promise<void> {
    const user = await this.userRepository.findByEmailVerificationToken(
      command.token,
    );

    if (!user || !user.isEmailVerificationTokenValid(command.token)) {
      throw new Error('Invalid verification token');
    }

    user.verifyEmail();
    await this.userRepository.update(user);
  }
}

@Injectable()
@CommandHandler(ResetPasswordCommand)
export class ResetPasswordCommandHandler
  implements ICommandHandler<ResetPasswordCommand>
{
  constructor(private readonly userRepository: UserRepository) {}

  async execute(command: ResetPasswordCommand): Promise<void> {
    const user = await this.userRepository.findByResetToken(command.token);

    if (!user || !user.isPasswordResetTokenValid(command.token)) {
      throw new Error('Invalid or expired reset token');
    }

    user.changePassword(command.newHashedPassword);
    await this.userRepository.update(user);
  }
}

@Injectable()
@CommandHandler(ChangePasswordCommand)
export class ChangePasswordCommandHandler
  implements ICommandHandler<ChangePasswordCommand>
{
  constructor(private readonly userRepository: UserRepository) {}

  async execute(command: ChangePasswordCommand): Promise<void> {
    const user = await this.userRepository.findById(
      command.userId,
      command.tenantId,
    );

    if (!user) {
      throw new Error('User not found');
    }

    user.changePassword(command.newHashedPassword);
    await this.userRepository.update(user);
  }
}

@Injectable()
@CommandHandler(UpdateUserPreferencesCommand)
export class UpdateUserPreferencesCommandHandler
  implements ICommandHandler<UpdateUserPreferencesCommand>
{
  constructor(private readonly userRepository: UserRepository) {}

  async execute(command: UpdateUserPreferencesCommand): Promise<void> {
    const user = await this.userRepository.findById(
      command.userId,
      command.tenantId,
    );

    if (!user) {
      throw new Error('User not found');
    }

    user.updatePreferences(command.preferences);
    await this.userRepository.update(user);
  }
}

@Injectable()
@CommandHandler(DeleteUserCommand)
export class DeleteUserCommandHandler
  implements ICommandHandler<DeleteUserCommand>
{
  constructor(private readonly userRepository: UserRepository) {}

  async execute(command: DeleteUserCommand): Promise<void> {
    const user = await this.userRepository.findById(
      command.userId,
      command.tenantId,
    );

    if (!user) {
      throw new Error('User not found');
    }

    if (!user.canBeDeleted()) {
      throw new Error('User cannot be deleted');
    }

    await this.userRepository.delete(command.userId, command.tenantId);
  }
}
