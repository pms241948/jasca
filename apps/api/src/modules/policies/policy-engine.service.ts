import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';

// Local type definitions for policy-related types
interface PolicyRuleType {
    id: string;
    ruleType: string;
    conditions: any;
    action: string;
    message: string | null;
}

interface PolicyExceptionType {
    id: string;
    exceptionType: string;
    targetValue: string;
    status: string;
    expiresAt: Date | null;
}

export interface PolicyViolation {
    ruleId: string;
    ruleName: string;
    action: string;
    message?: string;
    severity: Severity;
    count: number;
    cveIds: string[];
}

export interface PolicyEvaluation {
    allowed: boolean;
    blockedBy?: { policyId: string; policyName: string; ruleId: string };
    violations: PolicyViolation[];
    warnings: PolicyViolation[];
    appliedExceptions: PolicyExceptionType[];
}

@Injectable()
export class PolicyEngineService {
    constructor(private readonly prisma: PrismaService) { }

    async evaluate(
        projectId: string,
        scanResultId: string,
    ): Promise<PolicyEvaluation> {
        // Get project and organization
        const project = await this.prisma.project.findUnique({
            where: { id: projectId },
            include: { organization: true },
        });

        if (!project) {
            return { allowed: true, violations: [], warnings: [], appliedExceptions: [] };
        }

        // Get applicable policies (project-level and org-level)
        const policies = await this.prisma.policy.findMany({
            where: {
                isActive: true,
                OR: [
                    { projectId },
                    { organizationId: project.organizationId, projectId: null },
                ],
            },
            include: {
                rules: { orderBy: { priority: 'desc' } },
                exceptions: {
                    where: {
                        status: 'APPROVED',
                        OR: [
                            { expiresAt: null },
                            { expiresAt: { gt: new Date() } },
                        ],
                    },
                },
            },
        });

        // Get scan vulnerabilities
        const scanVulns = await this.prisma.scanVulnerability.findMany({
            where: { scanResultId },
            include: { vulnerability: true },
        });

        const result: PolicyEvaluation = {
            allowed: true,
            violations: [],
            warnings: [],
            appliedExceptions: [],
        };

        // Evaluate each policy
        for (const policy of policies) {
            for (const rule of policy.rules) {
                const matchedVulns = this.evaluateRule(rule, scanVulns, policy.exceptions);

                if (matchedVulns.length > 0) {
                    const violation: PolicyViolation = {
                        ruleId: rule.id,
                        ruleName: `${policy.name} - ${rule.ruleType}`,
                        action: rule.action,
                        message: rule.message || undefined,
                        severity: this.getPrimarySeverity(matchedVulns),
                        count: matchedVulns.length,
                        cveIds: matchedVulns.map((v) => v.vulnerability.cveId),
                    };

                    if (rule.action === 'BLOCK') {
                        result.violations.push(violation);
                        result.allowed = false;
                        if (!result.blockedBy) {
                            result.blockedBy = {
                                policyId: policy.id,
                                policyName: policy.name,
                                ruleId: rule.id,
                            };
                        }
                    } else if (rule.action === 'WARN') {
                        result.warnings.push(violation);
                    }
                }
            }

            // Track applied exceptions
            result.appliedExceptions.push(...policy.exceptions);
        }

        return result;
    }

    private evaluateRule(
        rule: PolicyRuleType,
        vulns: Array<{ vulnerability: { cveId: string; severity: Severity; cvssV3Score?: number | null } }>,
        exceptions: PolicyExceptionType[],
    ) {
        const conditions = rule.conditions as any;

        // Filter out excepted CVEs
        const exceptedCves = new Set(
            exceptions
                .filter((e) => e.exceptionType === 'CVE')
                .map((e) => e.targetValue),
        );

        let filtered = vulns.filter((v) => !exceptedCves.has(v.vulnerability.cveId));

        switch (rule.ruleType) {
            case 'SEVERITY_THRESHOLD':
                if (conditions.severity) {
                    const targetSeverities = Array.isArray(conditions.severity)
                        ? conditions.severity
                        : [conditions.severity];
                    filtered = filtered.filter((v) =>
                        targetSeverities.includes(v.vulnerability.severity),
                    );
                }
                break;

            case 'CVSS_THRESHOLD':
                if (conditions.cvssScore?.gte !== undefined) {
                    filtered = filtered.filter(
                        (v) =>
                            v.vulnerability.cvssV3Score != null &&
                            v.vulnerability.cvssV3Score >= conditions.cvssScore.gte,
                    );
                }
                break;

            case 'CVE_BLOCKLIST':
                if (conditions.cveIds) {
                    const blockedCves = new Set(conditions.cveIds);
                    filtered = filtered.filter((v) => blockedCves.has(v.vulnerability.cveId));
                }
                break;

            default:
                filtered = [];
        }

        return filtered;
    }

    private getPrimarySeverity(
        vulns: Array<{ vulnerability: { severity: Severity } }>,
    ): Severity {
        const order: Severity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'UNKNOWN'];

        for (const severity of order) {
            if (vulns.some((v) => v.vulnerability.severity === severity)) {
                return severity;
            }
        }

        return 'UNKNOWN';
    }
}
