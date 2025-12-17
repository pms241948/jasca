import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Severity, VulnStatus } from '@prisma/client';

export interface VulnFilter {
    severity?: Severity[];
    status?: VulnStatus[];
    projectId?: string;
    cveId?: string;
    pkgName?: string;
    assigneeId?: string;
}

@Injectable()
export class VulnerabilitiesService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(filter: VulnFilter = {}, options?: { limit?: number; offset?: number }) {
        const where: any = {};

        if (filter.severity?.length) {
            where.vulnerability = { severity: { in: filter.severity } };
        }

        if (filter.status?.length) {
            where.status = { in: filter.status };
        }

        if (filter.projectId) {
            where.scanResult = { projectId: filter.projectId };
        }

        if (filter.cveId) {
            where.vulnerability = { ...where.vulnerability, cveId: { contains: filter.cveId } };
        }

        if (filter.pkgName) {
            where.pkgName = { contains: filter.pkgName };
        }

        if (filter.assigneeId) {
            where.assigneeId = filter.assigneeId;
        }

        const [results, total] = await Promise.all([
            this.prisma.scanVulnerability.findMany({
                where,
                include: {
                    vulnerability: true,
                    scanResult: {
                        include: {
                            project: { include: { organization: true } },
                        },
                    },
                    assignee: { select: { id: true, name: true, email: true } },
                },
                orderBy: [
                    { vulnerability: { severity: 'asc' } },
                    { createdAt: 'desc' },
                ],
                take: options?.limit || 50,
                skip: options?.offset || 0,
            }),
            this.prisma.scanVulnerability.count({ where }),
        ]);

        return { results, total };
    }

    async findById(id: string) {
        const vuln = await this.prisma.scanVulnerability.findUnique({
            where: { id },
            include: {
                vulnerability: true,
                scanResult: {
                    include: {
                        project: { include: { organization: true } },
                    },
                },
                assignee: true,
                comments: {
                    include: { author: { select: { id: true, name: true, email: true } } },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        if (!vuln) {
            throw new NotFoundException('Vulnerability not found');
        }

        return vuln;
    }

    async findByCveId(cveId: string) {
        const vuln = await this.prisma.vulnerability.findUnique({
            where: { cveId },
            include: {
                scanResults: {
                    include: {
                        scanResult: {
                            include: { project: true },
                        },
                    },
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        if (!vuln) {
            throw new NotFoundException('CVE not found');
        }

        return vuln;
    }

    async updateStatus(id: string, status: VulnStatus, userId?: string) {
        await this.findById(id);

        return this.prisma.scanVulnerability.update({
            where: { id },
            data: { status },
        });
    }

    async assignUser(id: string, assigneeId: string | null) {
        await this.findById(id);

        return this.prisma.scanVulnerability.update({
            where: { id },
            data: { assigneeId },
        });
    }

    async addComment(id: string, authorId: string, content: string) {
        await this.findById(id);

        return this.prisma.vulnerabilityComment.create({
            data: {
                scanVulnerabilityId: id,
                authorId,
                content,
            },
            include: {
                author: { select: { id: true, name: true, email: true } },
            },
        });
    }

    // Find all affected services for a specific CVE
    async findAffectedByVuln(cveId: string) {
        return this.prisma.scanVulnerability.findMany({
            where: {
                vulnerability: { cveId },
                status: { notIn: ['FIXED', 'FALSE_POSITIVE'] },
            },
            include: {
                scanResult: {
                    include: {
                        project: { include: { organization: true } },
                    },
                },
            },
            distinct: ['scanResultId'],
        });
    }
}
