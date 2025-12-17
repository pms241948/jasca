import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';

@Injectable()
export class OrganizationsService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll() {
        return this.prisma.organization.findMany({
            include: {
                _count: {
                    select: { projects: true, users: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findById(id: string) {
        const org = await this.prisma.organization.findUnique({
            where: { id },
            include: {
                projects: true,
                users: { include: { roles: true } },
                _count: {
                    select: { projects: true, users: true },
                },
            },
        });

        if (!org) {
            throw new NotFoundException('Organization not found');
        }

        return org;
    }

    async findBySlug(slug: string) {
        return this.prisma.organization.findUnique({
            where: { slug },
        });
    }

    async create(dto: CreateOrganizationDto) {
        const existing = await this.findBySlug(dto.slug);
        if (existing) {
            throw new ConflictException('Organization slug already exists');
        }

        return this.prisma.organization.create({
            data: {
                name: dto.name,
                slug: dto.slug,
                description: dto.description,
            },
        });
    }

    async update(id: string, data: Partial<CreateOrganizationDto>) {
        await this.findById(id);

        return this.prisma.organization.update({
            where: { id },
            data,
        });
    }

    async delete(id: string) {
        await this.findById(id);

        return this.prisma.organization.delete({
            where: { id },
        });
    }
}
