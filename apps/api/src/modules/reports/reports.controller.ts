import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @Get('vulnerability')
    @ApiOperation({ summary: 'Generate vulnerability report' })
    @ApiQuery({ name: 'projectId', required: true })
    async generateReport(@Query('projectId') projectId: string) {
        return this.reportsService.generateVulnerabilityReport(projectId);
    }

    @Get('export/csv')
    @ApiOperation({ summary: 'Export vulnerability report as CSV' })
    @ApiQuery({ name: 'projectId', required: true })
    async exportCsv(
        @Query('projectId') projectId: string,
        @Res() res: Response,
    ) {
        const csv = await this.reportsService.exportToCsv(projectId);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=vulnerability-report-${projectId}.csv`,
        );
        res.send(csv);
    }
}
