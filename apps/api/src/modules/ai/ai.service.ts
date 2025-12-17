import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface RiskSummary {
    projectId: string;
    projectName: string;
    summary: string;
    riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    keyFindings: string[];
    recommendations: string[];
    generatedAt: Date;
}

export interface RemediationGuide {
    cveId: string;
    title: string;
    severity: string;
    description: string;
    steps: string[];
    references: string[];
    estimatedEffort: 'LOW' | 'MEDIUM' | 'HIGH';
    generatedAt: Date;
}

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Generate AI-powered risk summary for a project
     * Note: In production, this would call an LLM API
     */
    async generateRiskSummary(projectId: string): Promise<RiskSummary> {
        const project = await this.prisma.project.findUnique({
            where: { id: projectId },
            include: {
                scanResults: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    include: {
                        vulnerabilities: {
                            include: { vulnerability: true },
                        },
                    },
                },
            },
        });

        if (!project || project.scanResults.length === 0) {
            return {
                projectId,
                projectName: project?.name || 'Unknown',
                summary: 'No scan data available for risk assessment.',
                riskLevel: 'LOW',
                keyFindings: [],
                recommendations: [],
                generatedAt: new Date(),
            };
        }

        const latestScan = project.scanResults[0];
        const vulns = latestScan.vulnerabilities;

        let criticalCount = 0;
        let highCount = 0;
        let mediumCount = 0;

        for (const sv of vulns) {
            const sev = sv.vulnerability.severity;
            if (sev === 'CRITICAL') criticalCount++;
            else if (sev === 'HIGH') highCount++;
            else if (sev === 'MEDIUM') mediumCount++;
        }

        // Determine risk level
        let riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
        if (criticalCount > 0) riskLevel = 'CRITICAL';
        else if (highCount > 3) riskLevel = 'HIGH';
        else if (highCount > 0 || mediumCount > 5) riskLevel = 'MEDIUM';

        // Generate summary (in production, this would be LLM-generated)
        const summary = this.generateSummaryText(project.name, criticalCount, highCount, mediumCount, vulns.length);

        const keyFindings = this.extractKeyFindings(vulns);
        const recommendations = this.generateRecommendations(criticalCount, highCount, vulns);

        return {
            projectId,
            projectName: project.name,
            summary,
            riskLevel,
            keyFindings,
            recommendations,
            generatedAt: new Date(),
        };
    }

    /**
     * Generate remediation guide for a CVE
     * Note: In production, this would call an LLM API
     */
    async generateRemediationGuide(cveId: string): Promise<RemediationGuide | null> {
        const vulnerability = await this.prisma.vulnerability.findUnique({
            where: { cveId },
        });

        if (!vulnerability) return null;

        // In production, this would use LLM to generate context-aware steps
        const steps = this.generateRemediationSteps(vulnerability);
        const estimatedEffort = this.estimateEffort(vulnerability.severity);

        return {
            cveId,
            title: vulnerability.title || cveId,
            severity: vulnerability.severity,
            description: vulnerability.description || 'No description available.',
            steps,
            references: [
                `https://nvd.nist.gov/vuln/detail/${cveId}`,
                ...(vulnerability.references || []).slice(0, 3),
            ],
            estimatedEffort,
            generatedAt: new Date(),
        };
    }

    /**
     * Batch generate remediation guides for a scan
     */
    async batchGenerateGuides(scanResultId: string): Promise<RemediationGuide[]> {
        const scan = await this.prisma.scanResult.findUnique({
            where: { id: scanResultId },
            include: {
                vulnerabilities: {
                    include: { vulnerability: true },
                    where: {
                        vulnerability: {
                            severity: { in: ['CRITICAL', 'HIGH'] },
                        },
                    },
                },
            },
        });

        if (!scan) return [];

        const guides: RemediationGuide[] = [];
        const seen = new Set<string>();

        for (const sv of scan.vulnerabilities) {
            if (seen.has(sv.vulnerability.cveId)) continue;
            seen.add(sv.vulnerability.cveId);

            const guide = await this.generateRemediationGuide(sv.vulnerability.cveId);
            if (guide) guides.push(guide);
        }

        return guides;
    }

    // Helper methods

    private generateSummaryText(
        projectName: string,
        critical: number,
        high: number,
        medium: number,
        total: number,
    ): string {
        if (critical > 0) {
            return `${projectName} has ${critical} critical vulnerabilities that require immediate attention. ` +
                `Total vulnerabilities: ${total} (${critical} critical, ${high} high, ${medium} medium).`;
        }
        if (high > 0) {
            return `${projectName} has ${high} high-severity vulnerabilities. ` +
                `Total vulnerabilities: ${total}. Consider prioritizing remediation.`;
        }
        return `${projectName} has ${total} vulnerabilities. No critical issues detected.`;
    }

    private extractKeyFindings(vulns: { vulnerability: { cveId: string; severity: string; title: string | null } }[]): string[] {
        const findings: string[] = [];
        const criticals = vulns.filter(v => v.vulnerability.severity === 'CRITICAL');

        for (const cv of criticals.slice(0, 3)) {
            findings.push(`${cv.vulnerability.cveId}: ${cv.vulnerability.title || 'Critical vulnerability'}`);
        }

        if (criticals.length > 3) {
            findings.push(`...and ${criticals.length - 3} more critical vulnerabilities`);
        }

        return findings;
    }

    private generateRecommendations(
        critical: number,
        high: number,
        vulns: { vulnerability: { severity: string; cweIds: string[] | null } }[],
    ): string[] {
        const recs: string[] = [];

        if (critical > 0) {
            recs.push('Immediately patch or mitigate critical vulnerabilities');
            recs.push('Review network exposure to affected components');
        }
        if (high > 0) {
            recs.push('Schedule high-severity vulnerability remediation within 7 days');
        }

        // Check for common patterns
        const cweIds = vulns.flatMap(v => v.vulnerability.cweIds || []);
        if (cweIds.includes('CWE-79')) {
            recs.push('Review input sanitization practices to prevent XSS');
        }
        if (cweIds.includes('CWE-89')) {
            recs.push('Audit database queries for SQL injection vulnerabilities');
        }

        return recs.slice(0, 5);
    }

    private generateRemediationSteps(vuln: { severity: string; cweIds: string[] | null }): string[] {
        const steps: string[] = [
            'Identify all instances of this vulnerability in your codebase',
            'Review the affected component and its dependencies',
        ];

        const cweIds = vuln.cweIds || [];

        if (cweIds.includes('CWE-79')) {
            steps.push('Implement proper output encoding for user-supplied data');
            steps.push('Use Content Security Policy headers');
        } else if (cweIds.includes('CWE-89')) {
            steps.push('Use parameterized queries or prepared statements');
            steps.push('Validate and sanitize all user inputs');
        } else if (cweIds.some(c => c.includes('119') || c.includes('120'))) {
            steps.push('Update to the latest patched version of the affected library');
            steps.push('Review buffer handling code for bounds checking');
        } else {
            steps.push('Update the affected package to the latest patched version');
            steps.push('Review vendor advisories for specific mitigation steps');
        }

        steps.push('Test the fix in a staging environment');
        steps.push('Deploy the fix and verify remediation with a rescan');

        return steps;
    }

    private estimateEffort(severity: string): 'LOW' | 'MEDIUM' | 'HIGH' {
        switch (severity) {
            case 'CRITICAL':
                return 'HIGH';
            case 'HIGH':
                return 'MEDIUM';
            default:
                return 'LOW';
        }
    }
}
