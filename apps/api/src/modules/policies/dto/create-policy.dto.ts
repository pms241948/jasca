import {
    IsString,
    IsOptional,
    IsBoolean,
    IsArray,
    IsEnum,
    ValidateNested,
    IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PolicyRuleType, PolicyAction } from '@prisma/client';

export class CreatePolicyRuleDto {
    @ApiProperty({ enum: PolicyRuleType })
    @IsEnum(PolicyRuleType)
    ruleType: PolicyRuleType;

    @ApiProperty({
        description: 'Conditions as JSON object',
        example: { severity: ['CRITICAL', 'HIGH'] },
    })
    conditions: any;

    @ApiProperty({ enum: PolicyAction })
    @IsEnum(PolicyAction)
    action: PolicyAction;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    message?: string;

    @ApiPropertyOptional()
    @IsNumber()
    @IsOptional()
    priority?: number;
}

export class CreatePolicyDto {
    @ApiProperty({ example: 'Block Critical Vulnerabilities' })
    @IsString()
    name: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional()
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    organizationId?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    projectId?: string;

    @ApiPropertyOptional({ type: [CreatePolicyRuleDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreatePolicyRuleDto)
    @IsOptional()
    rules?: CreatePolicyRuleDto[];
}
