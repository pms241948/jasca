import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';

@Injectable()
export class ProjectsService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(organizationId?: string) {
        return this.prisma.project.findMany({
            where: organizationId ? { organizationId } : undefined,
            include: {
                organization: true,
                _count: {
                    select: { scanResults: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findById(id: string) {
        const project = await this.prisma.project.findUnique({
            where: { id },
            include: {
                organization: true,
                registries: true,
                _count: {
                    select: { scanResults: true },
                },
            },
        });

        if (!project) {
            throw new NotFoundException('Project not found');
        }

        return project;
    }

    async create(organizationId: string, dto: CreateProjectDto) {
        const existing = await this.prisma.project.findFirst({
            where: {
                organizationId,
                slug: dto.slug,
            },
        });

        if (existing) {
            throw new ConflictException('Project slug already exists in this organization');
        }

        return this.prisma.project.create({
            data: {
                name: dto.name,
                slug: dto.slug,
                description: dto.description,
                organizationId,
            },
        });
    }

    async update(id: string, data: Partial<CreateProjectDto>) {
        await this.findById(id);

        return this.prisma.project.update({
            where: { id },
            data,
        });
    }

    async delete(id: string) {
        await this.findById(id);

        return this.prisma.project.delete({
            where: { id },
        });
    }
}
