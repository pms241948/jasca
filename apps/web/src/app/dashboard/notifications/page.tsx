'use client';

import { useState } from 'react';
import {
    Bell,
    AlertTriangle,
    Shield,
    CheckCircle,
    Check,
    Trash2,
    Loader2,
} from 'lucide-react';
import {
    useNotifications,
    useMarkNotificationRead,
    useMarkAllNotificationsRead,
    type Notification
} from '@/lib/api-hooks';

function getNotificationIcon(type: string) {
    switch (type) {
        case 'critical_vuln':
            return <AlertTriangle className="h-5 w-5 text-red-500" />;
        case 'policy_violation':
            return <Shield className="h-5 w-5 text-orange-500" />;
        case 'scan_complete':
            return <CheckCircle className="h-5 w-5 text-green-500" />;
        case 'exception':
            return <Check className="h-5 w-5 text-blue-500" />;
        default:
            return <Bell className="h-5 w-5 text-slate-500" />;
    }
}

function formatTimeAgo(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}일 전`;
    if (hours > 0) return `${hours}시간 전`;
    return '방금 전';
}

export default function NotificationsPage() {
    const { data: notifications = [], isLoading, error, refetch } = useNotifications();
    const markReadMutation = useMarkNotificationRead();
    const markAllReadMutation = useMarkAllNotificationsRead();

    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    const filteredNotifications = filter === 'unread'
        ? notifications.filter(n => !n.isRead)
        : notifications;

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const handleMarkAsRead = async (id: string) => {
        try {
            await markReadMutation.mutateAsync(id);
        } catch (err) {
            console.error('Failed to mark as read:', err);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await markAllReadMutation.mutateAsync();
        } catch (err) {
            console.error('Failed to mark all as read:', err);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
                <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-4" />
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">오류 발생</h3>
                <p className="text-red-600 dark:text-red-300">알림 목록을 불러오는데 실패했습니다.</p>
                <button
                    onClick={() => refetch()}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                    다시 시도
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">알림 센터</h2>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                        {unreadCount > 0 ? `${unreadCount}개의 읽지 않은 알림` : '모든 알림을 확인했습니다'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleMarkAllAsRead}
                        disabled={unreadCount === 0 || markAllReadMutation.isPending}
                        className="flex items-center gap-2 px-4 py-2 text-sm border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                    >
                        {markAllReadMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Check className="h-4 w-4" />
                        )}
                        모두 읽음
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 text-sm rounded-lg transition-colors ${filter === 'all'
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                >
                    전체
                </button>
                <button
                    onClick={() => setFilter('unread')}
                    className={`px-4 py-2 text-sm rounded-lg transition-colors flex items-center gap-2 ${filter === 'unread'
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                >
                    읽지 않음
                    {unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                            {unreadCount}
                        </span>
                    )}
                </button>
            </div>

            {/* Notifications List */}
            {filteredNotifications.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-12 text-center">
                    <Bell className="h-16 w-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                        알림이 없습니다
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400">
                        {filter === 'unread' ? '읽지 않은 알림이 없습니다.' : '새로운 알림이 없습니다.'}
                    </p>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 divide-y divide-slate-200 dark:divide-slate-700">
                    {filteredNotifications.map((notification: Notification) => (
                        <div
                            key={notification.id}
                            className={`p-4 flex items-start gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${!notification.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                                }`}
                        >
                            <div className="flex-shrink-0 mt-1">
                                {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <h4 className={`font-medium ${!notification.isRead ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                                        {notification.title}
                                    </h4>
                                    {!notification.isRead && (
                                        <span className="w-2 h-2 bg-blue-500 rounded-full" />
                                    )}
                                </div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                    {notification.message}
                                </p>
                                <p className="text-xs text-slate-400 mt-1">
                                    {formatTimeAgo(notification.createdAt)}
                                </p>
                            </div>
                            <div className="flex items-center gap-1">
                                {!notification.isRead && (
                                    <button
                                        onClick={() => handleMarkAsRead(notification.id)}
                                        disabled={markReadMutation.isPending}
                                        className="p-2 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                                        title="읽음 표시"
                                    >
                                        {markReadMutation.isPending ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Check className="h-4 w-4" />
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
