import { Module } from '@nestjs/common';
import { ComplianceService } from './compliance.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    providers: [ComplianceService],
    exports: [ComplianceService],
})
export class ComplianceModule { }
