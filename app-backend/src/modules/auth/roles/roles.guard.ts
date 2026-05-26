import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector){}

  canActivate(
    context: ExecutionContext,
  ): boolean  {
    const roles = this.reflector.getAllAndOverride<string[]>('roles', [
      context. getHandler(),
      context.getClass(),
    ])
    if (!roles){
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    const hasRole = () => roles.includes(user?.role);
    if (!user || !hasRole()){
      throw new ForbiddenException('You do not have permission to access this resource.');
    }
    return true;
  }
}
