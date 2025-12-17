import {
    Injectable,
    UnauthorizedException,
    ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

export interface JwtPayload {
    sub: string;
    email: string;
    organizationId?: string;
    roles: string[];
}

export interface TokenResponse {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
    ) { }

    async register(dto: RegisterDto): Promise<TokenResponse> {
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (existingUser) {
            throw new ConflictException('Email already registered');
        }

        const passwordHash = await bcrypt.hash(dto.password, 10);

        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                name: dto.name,
                passwordHash,
                roles: {
                    create: {
                        role: 'VIEWER',
                        scope: 'ORGANIZATION',
                    },
                },
            },
            include: {
                roles: true,
            },
        });

        return this.generateTokens(user);
    }

    async login(dto: LoginDto): Promise<TokenResponse> {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
            include: {
                roles: true,
            },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        if (!user.isActive) {
            throw new UnauthorizedException('Account is disabled');
        }

        // Update last login
        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        return this.generateTokens(user);
    }

    async validateUser(userId: string) {
        return this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                roles: true,
                organization: true,
            },
        });
    }

    async validateApiKey(tokenHash: string) {
        const apiToken = await this.prisma.apiToken.findUnique({
            where: { tokenHash },
            include: {
                organization: true,
            },
        });

        if (!apiToken) {
            return null;
        }

        if (apiToken.expiresAt && apiToken.expiresAt < new Date()) {
            return null;
        }

        // Update last used
        await this.prisma.apiToken.update({
            where: { id: apiToken.id },
            data: { lastUsedAt: new Date() },
        });

        return apiToken;
    }

    private generateTokens(user: any): TokenResponse {
        const payload: JwtPayload = {
            sub: user.id,
            email: user.email,
            organizationId: user.organizationId,
            roles: user.roles.map((r: any) => r.role),
        };

        const accessToken = this.jwtService.sign(payload);
        const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

        return {
            accessToken,
            refreshToken,
            expiresIn: 86400, // 1 day in seconds
        };
    }
}
