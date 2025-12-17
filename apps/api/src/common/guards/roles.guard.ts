import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles) {
            return true;
        }

        const { user } = context.switchToHttp().getRequest();

        if (!user || !user.roles) {
            return false;
        }

        const userRoles = user.roles.map((r: any) => r.role);

        // Admin hierarchy
        if (userRoles.includes('SYSTEM_ADMIN')) {
            return true;
        }

        if (requiredRoles.includes('ORG_ADMIN') && userRoles.includes('ORG_ADMIN')) {
            return true;
        }

        return requiredRoles.some((role) => userRoles.includes(role));
    }
}
