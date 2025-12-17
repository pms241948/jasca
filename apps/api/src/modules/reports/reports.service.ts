import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportsService {
    constructor(private readonly prisma: PrismaService) { }

    async generateVulnerabilityReport(projectId: string) {
        const vulnerabilities = await this.prisma.scanVulnerability.findMany({
            where: {
                scanResult: { projectId },
                status: { notIn: ['FIXED', 'FALSE_POSITIVE'] },
            },
            include: {
                vulnerability: true,
                scanResult: true,
                assignee: { select: { name: true, email: true } },
            },
            orderBy: [
                { vulnerability: { severity: 'asc' } },
                { createdAt: 'desc' },
            ],
        });

        return {
            generatedAt: new Date().toISOString(),
            projectId,
            summary: {
                total: vulnerabilities.length,
                critical: vulnerabilities.filter(v => v.vulnerability.severity === 'CRITICAL').length,
                high: vulnerabilities.filter(v => v.vulnerability.severity === 'HIGH').length,
                medium: vulnerabilities.filter(v => v.vulnerability.severity === 'MEDIUM').length,
                low: vulnerabilities.filter(v => v.vulnerability.severity === 'LOW').length,
            },
            vulnerabilities: vulnerabilities.map(v => ({
                cveId: v.vulnerability.cveId,
                severity: v.vulnerability.severity,
                title: v.vulnerability.title,
                package: v.pkgName,
                version: v.pkgVersion,
                fixedVersion: v.fixedVersion,
                status: v.status,
                assignee: v.assignee?.name,
                imageRef: v.scanResult.imageRef,
                scannedAt: v.scanResult.scannedAt,
            })),
        };
    }

    async exportToCsv(projectId: string): Promise<string> {
        const report = await this.generateVulnerabilityReport(projectId);

        const headers = [
            'CVE ID',
            'Severity',
            'Title',
            'Package',
            'Version',
            'Fixed Version',
            'Status',
            'Assignee',
            'Image',
            'Scanned At',
        ];

        const rows = report.vulnerabilities.map(v => [
            v.cveId,
            v.severity,
            `"${(v.title || '').replace(/"/g, '""')}"`,
            v.package,
            v.version,
            v.fixedVersion || '',
            v.status,
            v.assignee || '',
            v.imageRef,
            v.scannedAt,
        ]);

        return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    }
}
