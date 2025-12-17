import {
    Controller,
    Post,
    Get,
    Delete,
    Body,
    Param,
    Query,
    HttpCode,
    HttpStatus,
    UseGuards,
    Req,
    Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MfaService } from './services/mfa.service';
import { SessionService } from './services/session.service';
import { LoginHistoryService } from './services/login-history.service';
import { PasswordPolicyService } from './services/password-policy.service';
import { EmailVerificationService } from './services/email-verification.service';
import { InvitationService } from './services/invitation.service';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly mfaService: MfaService,
        private readonly sessionService: SessionService,
        private readonly loginHistoryService: LoginHistoryService,
        private readonly passwordPolicyService: PasswordPolicyService,
        private readonly emailVerificationService: EmailVerificationService,
        private readonly invitationService: InvitationService,
    ) { }

    // ==================== Basic Auth ====================

    @Post('register')
    @ApiOperation({ summary: 'Register a new user' })
    @ApiResponse({ status: 201, description: 'User registered successfully' })
    @ApiResponse({ status: 409, description: 'Email already registered' })
    async register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Login with email and password' })
    @ApiResponse({ status: 200, description: 'Login successful' })
    @ApiResponse({ status: 401, description: 'Invalid credentials' })
    async login(
        @Body() dto: LoginDto,
        @Req() req: Request,
        @Headers('user-agent') userAgent?: string,
    ) {
        const ipAddress = req.ip || req.socket.remoteAddress;
        return this.authService.login(dto, { ipAddress, userAgent });
    }

    @Post('mfa/verify')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Verify MFA code and complete login' })
    async verifyMfa(
        @Body() body: { mfaToken: string; code: string },
        @Req() req: Request,
        @Headers('user-agent') userAgent?: string,
    ) {
        const ipAddress = req.ip || req.socket.remoteAddress;
        return this.authService.verifyMfaAndLogin(body.mfaToken, body.code, { ipAddress, userAgent });
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Refresh access token' })
    async refresh(@Body() body: { refreshToken: string }) {
        return this.authService.refreshTokens(body.refreshToken);
    }

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Logout current session' })
    async logout(@Body() body: { refreshToken: string }) {
        await this.authService.logout(body.refreshToken);
        return { message: 'Logged out successfully' };
    }

    @Post('logout-all')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Logout from all devices' })
    async logoutAll(@CurrentUser() user: any) {
        const count = await this.authService.logoutAllDevices(user.id);
        return { message: `Logged out from ${count} sessions` };
    }

    // ==================== MFA ====================

    @Post('mfa/setup')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Setup MFA for current user' })
    async setupMfa(@CurrentUser() user: any) {
        return this.mfaService.setupMfa(user.id, user.email);
    }

    @Post('mfa/enable')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Enable MFA after verifying setup code' })
    async enableMfa(@CurrentUser() user: any, @Body() body: { code: string }) {
        const isValid = await this.mfaService.verifyAndEnable(user.id, body.code);
        if (!isValid) {
            return { success: false, message: 'Invalid code' };
        }
        return { success: true, message: 'MFA enabled successfully' };
    }

    @Post('mfa/disable')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Disable MFA for current user' })
    async disableMfa(@CurrentUser() user: any, @Body() body: { code: string }) {
        const isValid = await this.mfaService.verifyToken(user.id, body.code);
        if (!isValid) {
            return { success: false, message: 'Invalid code' };
        }
        await this.mfaService.disableMfa(user.id);
        return { success: true, message: 'MFA disabled successfully' };
    }

    @Post('mfa/backup-codes')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Regenerate backup codes' })
    async regenerateBackupCodes(@CurrentUser() user: any, @Body() body: { code: string }) {
        const isValid = await this.mfaService.verifyToken(user.id, body.code);
        if (!isValid) {
            return { success: false, message: 'Invalid code' };
        }
        const backupCodes = await this.mfaService.regenerateBackupCodes(user.id);
        return { success: true, backupCodes };
    }

    @Get('mfa/status')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get MFA status for current user' })
    async getMfaStatus(@CurrentUser() user: any) {
        const isEnabled = await this.mfaService.isMfaEnabled(user.id);
        return { enabled: isEnabled };
    }

    // ==================== Sessions ====================

    @Get('sessions')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all active sessions for current user' })
    async getSessions(@CurrentUser() user: any) {
        return this.sessionService.getUserSessions(user.id);
    }

    @Delete('sessions/:id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Revoke a specific session' })
    async revokeSession(@CurrentUser() user: any, @Param('id') sessionId: string) {
        await this.sessionService.invalidateSession(sessionId);
        return { message: 'Session revoked' };
    }

    // ==================== Password ====================

    @Post('change-password')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Change password for current user' })
    async changePassword(
        @CurrentUser() user: any,
        @Body() body: { currentPassword: string; newPassword: string },
    ) {
        await this.passwordPolicyService.changePassword(user.id, body.currentPassword, body.newPassword);
        return { message: 'Password changed successfully' };
    }

    // ==================== Email Verification ====================

    @Post('verify-email')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Verify email with token' })
    async verifyEmail(@Query('token') token: string) {
        const result = await this.emailVerificationService.verifyEmail(token);
        if (!result.success) {
            return { success: false, message: 'Invalid or expired token' };
        }
        return { success: true, message: 'Email verified successfully' };
    }

    @Post('resend-verification')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Resend email verification' })
    async resendVerification(@CurrentUser() user: any) {
        await this.emailVerificationService.resendVerification(user.id);
        return { message: 'Verification email sent' };
    }

    // ==================== Invitations ====================

    @Post('invite')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Invite a user to organization' })
    async inviteUser(
        @CurrentUser() user: any,
        @Body() body: { email: string; role?: string },
    ) {
        const result = await this.invitationService.createInvitation(
            body.email,
            user.organizationId,
            user.id,
            (body.role as any) || 'DEVELOPER',
        );
        return { message: 'Invitation sent', expiresAt: result.expiresAt };
    }

    @Get('invitation/:token')
    @ApiOperation({ summary: 'Get invitation details' })
    async getInvitation(@Param('token') token: string) {
        return this.invitationService.getInvitationByToken(token);
    }

    @Post('accept-invitation')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Accept invitation and create account' })
    async acceptInvitation(
        @Body() body: { token: string; name: string; password: string },
    ) {
        const passwordHash = await this.passwordPolicyService.hashPassword(body.password);
        const result = await this.invitationService.acceptInvitation(body.token, body.name, passwordHash);
        return { message: 'Account created successfully', ...result };
    }

    // ==================== Login History ====================

    @Get('login-history')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get login history for current user' })
    async getLoginHistory(
        @CurrentUser() user: any,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ) {
        return this.loginHistoryService.getLoginHistory(
            user.id,
            limit ? parseInt(limit, 10) : 20,
            offset ? parseInt(offset, 10) : 0,
        );
    }
}
