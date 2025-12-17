import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Param,
    Body,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';

@ApiTags('Organizations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('organizations')
export class OrganizationsController {
    constructor(private readonly organizationsService: OrganizationsService) { }

    @Get()
    @Roles('SYSTEM_ADMIN')
    @ApiOperation({ summary: 'Get all organizations' })
    async findAll() {
        return this.organizationsService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get organization by ID' })
    async findById(@Param('id') id: string) {
        return this.organizationsService.findById(id);
    }

    @Post()
    @Roles('SYSTEM_ADMIN')
    @ApiOperation({ summary: 'Create a new organization' })
    async create(@Body() dto: CreateOrganizationDto) {
        return this.organizationsService.create(dto);
    }

    @Put(':id')
    @Roles('SYSTEM_ADMIN', 'ORG_ADMIN')
    @ApiOperation({ summary: 'Update an organization' })
    async update(@Param('id') id: string, @Body() dto: Partial<CreateOrganizationDto>) {
        return this.organizationsService.update(id, dto);
    }

    @Delete(':id')
    @Roles('SYSTEM_ADMIN')
    @ApiOperation({ summary: 'Delete an organization' })
    async delete(@Param('id') id: string) {
        return this.organizationsService.delete(id);
    }
}
