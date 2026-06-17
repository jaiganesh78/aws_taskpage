import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UserContextGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userIdHeader = request.headers['x-user-id'];
    const isProduction = process.env.NODE_ENV === 'production';

    let user: { id: string; role: string; name: string; isActive: boolean } | null = null;

    if (userIdHeader) {
      user = await this.prisma.user.findUnique({
        where: { id: String(userIdHeader) },
        select: { id: true, role: true, name: true, isActive: true },
      });
      if (!user) {
        throw new UnauthorizedException(`User context not found for ID: ${userIdHeader}`);
      }
      if (!user.isActive) {
        throw new UnauthorizedException(`User context is inactive: ${userIdHeader}`);
      }
    } else {
      if (isProduction) {
        throw new UnauthorizedException('x-user-id header is required in production mode');
      }

      // Fallback for developer convenience and seeding verification
      // Pick the first active CORE user (Admin) or fallback to any first active user
      user = await this.prisma.user.findFirst({
        where: { role: 'core', isActive: true },
        select: { id: true, role: true, name: true, isActive: true },
      });

      if (!user) {
        user = await this.prisma.user.findFirst({
          where: { isActive: true },
          select: { id: true, role: true, name: true, isActive: true },
        });
      }
    }

    if (!user) {
      throw new UnauthorizedException('No active user identity exists in the database. Please run migrations and seed.');
    }

    request.user = {
      id: user.id,
      role: user.role,
      name: user.name,
    };

    return true;
  }
}
