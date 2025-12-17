import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

type VulnStatus = 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'FIX_SUBMITTED' | 'VERIFYING' | 'FIXED' | 'CLOSED' | 'IGNORED' | 'FALSE_POSITIVE';

interface WorkflowTransition {
    from: VulnStatus;
    to: VulnStatus;
    comment?: string;
    evidence?: Record<string, any>;
}

interface TransitionResult {
    success: boolean;
    scanVulnerabilityId: string;
    fromStatus: VulnStatus;
    toStatus: VulnStatus;
    timestamp: Date;
}

// Define valid state transitions
const VALID_TRANSITIONS: Record<VulnStatus, VulnStatus[]> = {
    OPEN: ['ASSIGNED', 'IN_PROGRESS', 'IGNORED', 'FALSE_POSITIVE'],
    ASSIGNED: ['IN_PROGRESS', 'OPEN', 'IGNORED'],
    IN_PROGRESS: ['FIX_SUBMITTED', 'ASSIGNED', 'IGNORED'],
    FIX_SUBMITTED: ['VERIFYING', 'IN_PROGRESS'],
    VERIFYING: ['FIXED', 'IN_PROGRESS'],
    FIXED: ['CLOSED', 'OPEN'], // Can reopen if regression
    CLOSED: ['OPEN'], // Can reopen
    IGNORED: ['OPEN'],
    FALSE_POSITIVE: ['OPEN'],
};

@Injectable()
export class WorkflowService {
    private readonly logger = new Logger(WorkflowService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Transition a vulnerability to a new status
     */
    async transitionStatus(
        scanVulnerabilityId: string,
        userId: string,
        transition: WorkflowTransition,
    ): Promise<TransitionResult> {
        // Get current vulnerability status
        const scanVuln = await this.prisma.scanVulnerability.findUnique({
            where: { id: scanVulnerabilityId },
        });

        if (!scanVuln) {
            throw new BadRequestException('Vulnerability not found');
        }

        const currentStatus = scanVuln.status as VulnStatus;

        // Validate transition
        if (!this.isValidTransition(currentStatus, transition.to)) {
            throw new BadRequestException(
                `Invalid transition from ${currentStatus} to ${transition.to}`,
            );
        }

        // Perform transition in transaction
        const result = await this.prisma.$transaction(async (tx) => {
            // Update vulnerability status
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await tx.scanVulnerability.update({
                where: { id: scanVulnerabilityId },
                data: { status: transition.to as any },
            });

            // Create workflow history record
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (tx as any).vulnerabilityWorkflow?.create({
                data: {
                    scanVulnerabilityId,
                    fromStatus: transition.from,
                    toStatus: transition.to,
                    changedById: userId,
                    comment: transition.comment,
                    evidence: transition.evidence,
                },
            });

            return {
                success: true,
                scanVulnerabilityId,
                fromStatus: transition.from,
                toStatus: transition.to,
                timestamp: new Date(),
            };
        });

        this.logger.log(
            `Transitioned ${scanVulnerabilityId} from ${transition.from} to ${transition.to}`,
        );

        return result;
    }

    /**
     * Get workflow history for a vulnerability
     */
    async getWorkflowHistory(scanVulnerabilityId: string) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const prismaAny = this.prisma as any;

        return prismaAny.vulnerabilityWorkflow?.findMany({
            where: { scanVulnerabilityId },
            include: {
                changedBy: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
        }) || [];
    }

    /**
     * Bulk transition vulnerabilities
     */
    async bulkTransition(
        scanVulnerabilityIds: string[],
        userId: string,
        toStatus: VulnStatus,
        comment?: string,
    ): Promise<{
        successful: string[];
        failed: { id: string; reason: string }[];
    }> {
        const successful: string[] = [];
        const failed: { id: string; reason: string }[] = [];

        for (const id of scanVulnerabilityIds) {
            try {
                const scanVuln = await this.prisma.scanVulnerability.findUnique({
                    where: { id },
                });

                if (!scanVuln) {
                    failed.push({ id, reason: 'Not found' });
                    continue;
                }

                const currentStatus = scanVuln.status as VulnStatus;

                if (!this.isValidTransition(currentStatus, toStatus)) {
                    failed.push({
                        id,
                        reason: `Invalid transition from ${currentStatus} to ${toStatus}`,
                    });
                    continue;
                }

                await this.transitionStatus(id, userId, {
                    from: currentStatus,
                    to: toStatus,
                    comment,
                });

                successful.push(id);
            } catch (error: any) {
                failed.push({ id, reason: error.message || 'Unknown error' });
            }
        }

        return { successful, failed };
    }

    /**
     * Get available transitions for current status
     */
    getAvailableTransitions(currentStatus: VulnStatus): VulnStatus[] {
        return VALID_TRANSITIONS[currentStatus] || [];
    }

    /**
     * Check if transition is valid
     */
    isValidTransition(from: VulnStatus, to: VulnStatus): boolean {
        const validTargets = VALID_TRANSITIONS[from];
        return validTargets?.includes(to) || false;
    }

    /**
     * Auto-assign vulnerability to user
     */
    async autoAssign(
        scanVulnerabilityId: string,
        assigneeId: string,
        assignedById: string,
    ): Promise<void> {
        const scanVuln = await this.prisma.scanVulnerability.findUnique({
            where: { id: scanVulnerabilityId },
        });

        if (!scanVuln) {
            throw new BadRequestException('Vulnerability not found');
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await this.prisma.scanVulnerability.update({
            where: { id: scanVulnerabilityId },
            data: {
                assigneeId,
                status: 'ASSIGNED' as any,
            },
        });

        // Record the workflow transition
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((scanVuln.status as any) !== 'ASSIGNED') {
            await (this.prisma as any).vulnerabilityWorkflow?.create({
                data: {
                    scanVulnerabilityId,
                    fromStatus: scanVuln.status,
                    toStatus: 'ASSIGNED',
                    changedById: assignedById,
                    comment: `Auto-assigned to user`,
                },
            });
        }
    }

    /**
     * Get workflow statistics for a project
     */
    async getWorkflowStats(projectId: string) {
        const scans = await this.prisma.scanResult.findMany({
            where: { projectId },
            select: { id: true },
        });

        const scanIds = scans.map((s) => s.id);

        const stats = await this.prisma.scanVulnerability.groupBy({
            by: ['status'],
            where: { scanResultId: { in: scanIds } },
            _count: true,
        });

        return stats.reduce(
            (acc, s) => {
                acc[s.status] = s._count;
                return acc;
            },
            {} as Record<string, number>,
        );
    }
}
