import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UserContextGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userIdHeader = request.headers['x-user-id'];

    let user: { id: string; role: string; name: string } | null = null;

    if (userIdHeader) {
      user = await this.prisma.user.findUnique({
        where: { id: String(userIdHeader) },
        select: { id: true, role: true, name: true },
      });
      if (!user) {
        throw new UnauthorizedException(`User context not found for ID: ${userIdHeader}`);
      }
    } else {
      // Fallback for developer convenience and seeding verification
      // Pick the first CORE user (Admin) or fallback to any first user
      user = await this.prisma.user.findFirst({
        where: { role: 'core' },
        select: { id: true, role: true, name: true },
      });

      if (!user) {
        user = await this.prisma.user.findFirst({
          select: { id: true, role: true, name: true },
        });
      }
    }

    if (!user) {
      throw new UnauthorizedException('No user identity exists in the database. Please run migrations and seed.');
    }

    request.user = {
      id: user.id,
      role: user.role,
      name: user.name,
    };

    return true;
  }
}
