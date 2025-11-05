import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { SupabaseAuthGuard } from '../../../common/auth/supabase/supabase-auth.guard';

@Injectable()
export class GraphQLAuthGuard extends SupabaseAuthGuard implements CanActivate {
  getRequest(context: ExecutionContext): unknown {
    const ctx = GqlExecutionContext.create(context);
    const gqlContext = ctx.getContext();
    if (
      gqlContext &&
      typeof gqlContext === 'object' &&
      'req' in (gqlContext as Record<string, unknown>)
    ) {
      return (gqlContext as Record<string, unknown>).req;
    }
    return undefined;
  }

  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}
