import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      await super.canActivate(context);
    } catch {
      // Ignore auth failures so the controller can always shape a 200 response.
    }

    return true;
  }

  handleRequest(_err: unknown, user: unknown) {
    return user ?? null;
  }
}