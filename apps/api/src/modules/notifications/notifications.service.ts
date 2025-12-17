import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ChannelType, NotificationEventType } from '@prisma/client';

interface NotificationPayload {
    eventType: NotificationEventType;
    title: string;
    message: string;
    severity?: string;
    projectId?: string;
    cveId?: string;
    link?: string;
}

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);

    constructor(private readonly prisma: PrismaService) { }

    async notify(payload: NotificationPayload) {
        // Find applicable notification rules
        const rules = await this.prisma.notificationRule.findMany({
            where: {
                eventType: payload.eventType,
                isActive: true,
                channel: { isActive: true },
            },
            include: { channel: true },
        });

        for (const rule of rules) {
            // Check conditions
            if (rule.conditions) {
                const conditions = rule.conditions as any;

                if (conditions.severity && payload.severity) {
                    if (!conditions.severity.includes(payload.severity)) {
                        continue;
                    }
                }
            }

            // Send notification based on channel type
            await this.sendToChannel(rule.channel, payload);
        }
    }

    private async sendToChannel(
        channel: { id: string; type: ChannelType; config: any },
        payload: NotificationPayload,
    ) {
        const config = channel.config as any;

        try {
            switch (channel.type) {
                case 'SLACK':
                    await this.sendSlackNotification(config, payload);
                    break;
                case 'MATTERMOST':
                    await this.sendMattermostNotification(config, payload);
                    break;
                case 'EMAIL':
                    await this.sendEmailNotification(config, payload);
                    break;
                case 'WEBHOOK':
                    await this.sendWebhookNotification(config, payload);
                    break;
            }
        } catch (error) {
            this.logger.error(
                `Failed to send notification to channel ${channel.id}: ${error}`,
            );
        }
    }

    private async sendSlackNotification(config: any, payload: NotificationPayload) {
        if (!config.webhookUrl) return;

        const color = this.getSeverityColor(payload.severity);

        const slackPayload = {
            attachments: [
                {
                    color,
                    title: payload.title,
                    text: payload.message,
                    fields: [
                        payload.cveId && { title: 'CVE', value: payload.cveId, short: true },
                        payload.severity && { title: 'Severity', value: payload.severity, short: true },
                    ].filter(Boolean),
                    actions: payload.link
                        ? [{ type: 'button', text: 'View Details', url: payload.link }]
                        : undefined,
                },
            ],
        };

        await fetch(config.webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(slackPayload),
        });
    }

    private async sendMattermostNotification(config: any, payload: NotificationPayload) {
        if (!config.webhookUrl) return;

        const mattermostPayload = {
            text: `**${payload.title}**\n${payload.message}`,
            props: {
                card: payload.link ? `[View Details](${payload.link})` : undefined,
            },
        };

        await fetch(config.webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(mattermostPayload),
        });
    }

    private async sendEmailNotification(config: any, payload: NotificationPayload) {
        // Email sending would require an email service integration
        // For now, just log the email that would be sent
        this.logger.log(
            `[EMAIL] To: ${config.recipients?.join(', ')} Subject: ${payload.title}`,
        );
    }

    private async sendWebhookNotification(config: any, payload: NotificationPayload) {
        if (!config.url) return;

        await fetch(config.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(config.headers || {}),
            },
            body: JSON.stringify(payload),
        });
    }

    private getSeverityColor(severity?: string): string {
        switch (severity?.toUpperCase()) {
            case 'CRITICAL':
                return '#d63031';
            case 'HIGH':
                return '#e17055';
            case 'MEDIUM':
                return '#fdcb6e';
            case 'LOW':
                return '#74b9ff';
            default:
                return '#636e72';
        }
    }
}
