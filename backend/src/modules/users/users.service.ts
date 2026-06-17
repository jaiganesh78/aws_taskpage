import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    isActive?: boolean;
    includeInactive?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const page = Math.max(1, query.page || 1);
    let limit = Math.max(1, query.limit || 20);
    if (limit > 100) {
      limit = 100;
    }
    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (query.role) {
      if (query.role === 'core' || query.role === 'crew') {
        whereClause.role = query.role as UserRole;
      }
    }

    if (query.isActive !== undefined) {
      whereClause.isActive = query.isActive;
    } else if (!query.includeInactive) {
      whereClause.isActive = true;
    }

    if (query.search) {
      whereClause.OR = [
        { name: { contains: query.search, mode: 'insensitive' as const } },
        { email: { contains: query.search, mode: 'insensitive' as const } },
        { department: { contains: query.search, mode: 'insensitive' as const } },
      ];
    }

    const orderByClause: any = {};
    if (query.sortBy) {
      orderByClause[query.sortBy] = query.sortOrder || 'desc';
    } else {
      orderByClause.createdAt = 'desc';
    }

    const [total, users] = await this.prisma.$transaction([
      this.prisma.user.count({ where: whereClause }),
      this.prisma.user.findMany({
        where: whereClause,
        orderBy: orderByClause,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true,
          department: true,
          isActive: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
