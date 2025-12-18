import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Param,
    Body,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';

@ApiTags('Projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('projects')
export class ProjectsController {
    constructor(private readonly projectsService: ProjectsService) { }

    @Get()
    @ApiOperation({ summary: 'Get all projects' })
    @ApiQuery({ name: 'organizationId', required: false })
    async findAll(@Query('organizationId') organizationId?: string) {
        const data = await this.projectsService.findAll(organizationId);
        return { data, total: data.length };
    }


    @Get(':id/vulnerability-trend')
    @ApiOperation({ summary: 'Get vulnerability trend for a project' })
    @ApiQuery({ name: 'days', required: false })
    async getVulnerabilityTrend(
        @Param('id') id: string,
        @Query('days') days?: string,
    ) {
        return this.projectsService.getVulnerabilityTrend(id, parseInt(days || '30'));
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get project by ID' })
    async findById(@Param('id') id: string) {
        return this.projectsService.findById(id);
    }


    @Post()
    @Roles('ORG_ADMIN', 'PROJECT_ADMIN')
    @ApiOperation({ summary: 'Create a new project' })
    async create(
        @Query('organizationId') organizationId: string,
        @Body() dto: CreateProjectDto,
    ) {
        return this.projectsService.create(organizationId, dto);
    }

    @Put(':id')
    @Roles('ORG_ADMIN', 'PROJECT_ADMIN')
    @ApiOperation({ summary: 'Update a project' })
    async update(@Param('id') id: string, @Body() dto: Partial<CreateProjectDto>) {
        return this.projectsService.update(id, dto);
    }

    @Delete(':id')
    @Roles('ORG_ADMIN')
    @ApiOperation({ summary: 'Delete a project' })
    async delete(@Param('id') id: string) {
        return this.projectsService.delete(id);
    }
}
