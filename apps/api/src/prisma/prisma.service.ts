import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
    extends PrismaClient
    implements OnModuleInit, OnModuleDestroy {
    constructor() {
        super({
            log:
                process.env.NODE_ENV === 'development'
                    ? ['query', 'info', 'warn', 'error']
                    : ['error'],
        });
    }

    async onModuleInit() {
        await this.$connect();
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }

    async cleanDatabase() {
        if (process.env.NODE_ENV !== 'production') {
            // Delete in order due to foreign key constraints
            await this.vulnerabilityComment.deleteMany();
            await this.scanVulnerability.deleteMany();
            await this.scanSummary.deleteMany();
            await this.vulnerability.deleteMany();
            await this.scanResult.deleteMany();
            await this.policyException.deleteMany();
            await this.policyRule.deleteMany();
            await this.policy.deleteMany();
            await this.registry.deleteMany();
            await this.project.deleteMany();
            await this.apiToken.deleteMany();
            await this.userRole.deleteMany();
            await this.user.deleteMany();
            await this.organization.deleteMany();
            await this.auditLog.deleteMany();
        }
    }
}

