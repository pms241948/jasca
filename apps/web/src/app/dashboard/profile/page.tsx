'use client';

import { useState, useEffect } from 'react';
import {
    User,
    Mail,
    Building2,
    Shield,
    Bell,
    Key,
    Save,
    Loader2,
    CheckCircle,
    Camera,
    AlertTriangle,
    RefreshCw,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import {
    useProfile,
    useUpdateProfile,
    useNotificationSettings as useNotificationSettingsApi,
    useUpdateNotificationSettings,
} from '@/lib/api-hooks';

export default function ProfilePage() {
    const { user: authUser } = useAuthStore();
    const { data: profile, isLoading: profileLoading, error: profileError, refetch } = useProfile();
    const { data: notificationSettings, isLoading: notifLoading } = useNotificationSettingsApi();
    const updateProfileMutation = useUpdateProfile();
    const updateNotificationMutation = useUpdateNotificationSettings();

    const [saved, setSaved] = useState(false);

    // Form states
    const [name, setName] = useState('');
    const [notifications, setNotifications] = useState({
        emailAlerts: true,
        criticalOnly: false,
        weeklyDigest: false,
    });

    // Load profile data
    useEffect(() => {
        if (profile) {
            setName(profile.name || '');
        }
    }, [profile]);

    // Load notification settings
    useEffect(() => {
        if (notificationSettings) {
            setNotifications({
                emailAlerts: notificationSettings.emailAlerts ?? true,
                criticalOnly: notificationSettings.criticalOnly ?? false,
                weeklyDigest: notificationSettings.weeklyDigest ?? false,
            });
        }
    }, [notificationSettings]);

    const handleSaveProfile = async () => {
        try {
            await updateProfileMutation.mutateAsync({ name });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            console.error('Failed to update profile:', err);
        }
    };

    const handleToggleNotification = async (key: keyof typeof notifications) => {
        const newValue = !notifications[key];
        setNotifications(prev => ({ ...prev, [key]: newValue }));
        try {
            await updateNotificationMutation.mutateAsync({ [key]: newValue });
        } catch (err) {
            // Revert on error
            setNotifications(prev => ({ ...prev, [key]: !newValue }));
            console.error('Failed to update notification settings:', err);
        }
    };

    if (profileLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (profileError) {
        return (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
                <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-4" />
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">오류 발생</h3>
                <p className="text-red-600 dark:text-red-300 mb-4">프로필을 불러오는데 실패했습니다.</p>
                <button
                    onClick={() => refetch()}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                    다시 시도
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-3xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">프로필 설정</h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                        계정 정보 및 알림 설정을 관리합니다
                    </p>
                </div>
                <button
                    onClick={() => refetch()}
                    className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                >
                    <RefreshCw className="h-5 w-5" />
                </button>
            </div>

            {/* Profile Card */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">계정 정보</h3>

                {/* Avatar */}
                <div className="flex items-center gap-6 mb-6">
                    <div className="relative">
                        <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                            <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                {name?.[0]?.toUpperCase() || 'U'}
                            </span>
                        </div>
                        <button className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors">
                            <Camera className="h-4 w-4" />
                        </button>
                    </div>
                    <div>
                        <p className="font-medium text-slate-900 dark:text-white">{name || 'Unknown'}</p>
                        <p className="text-sm text-slate-500">{profile?.email}</p>
                        <p className="text-xs text-slate-400 mt-1">
                            역할: {profile?.role || authUser?.roles?.join(', ') || 'User'}
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            이름
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            이메일
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <input
                                type="email"
                                value={profile?.email || ''}
                                disabled
                                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-slate-500 dark:text-slate-400"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            조직
                        </label>
                        <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <input
                                type="text"
                                value={profile?.organization?.name || '-'}
                                disabled
                                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-slate-500 dark:text-slate-400"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end mt-6">
                    <button
                        onClick={handleSaveProfile}
                        disabled={updateProfileMutation.isPending}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        {updateProfileMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        프로필 저장
                    </button>
                </div>
            </div>

            {/* Security */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">보안</h3>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                        <div className="flex items-center gap-3">
                            <Key className="h-5 w-5 text-slate-400" />
                            <div>
                                <p className="font-medium text-slate-900 dark:text-white">비밀번호 변경</p>
                                <p className="text-sm text-slate-500">마지막 변경: 30일 전</p>
                            </div>
                        </div>
                        <button className="px-4 py-2 text-sm border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                            변경
                        </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                        <div className="flex items-center gap-3">
                            <Shield className={`h-5 w-5 ${profile?.mfaEnabled ? 'text-green-500' : 'text-slate-400'}`} />
                            <div>
                                <p className="font-medium text-slate-900 dark:text-white">2단계 인증 (MFA)</p>
                                <p className={`text-sm ${profile?.mfaEnabled ? 'text-green-600' : 'text-slate-500'}`}>
                                    {profile?.mfaEnabled ? '활성화됨' : '비활성화됨'}
                                </p>
                            </div>
                        </div>
                        <button className="px-4 py-2 text-sm border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                            관리
                        </button>
                    </div>
                </div>
            </div>

            {/* Notifications */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    알림 설정
                    {notifLoading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
                </h3>

                <div className="space-y-4">
                    {[
                        { key: 'emailAlerts' as const, label: '이메일 알림', desc: '중요 이벤트 발생 시 이메일로 알림 받기' },
                        { key: 'criticalOnly' as const, label: 'Critical 전용', desc: 'Critical 수준 취약점만 알림 받기' },
                        { key: 'weeklyDigest' as const, label: '주간 리포트', desc: '매주 월요일 요약 리포트 발송' },
                    ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700 last:border-0">
                            <div>
                                <p className="font-medium text-slate-900 dark:text-white">{item.label}</p>
                                <p className="text-sm text-slate-500">{item.desc}</p>
                            </div>
                            <button
                                onClick={() => handleToggleNotification(item.key)}
                                disabled={updateNotificationMutation.isPending}
                                className={`relative w-12 h-6 rounded-full transition-colors ${notifications[item.key]
                                    ? 'bg-blue-600'
                                    : 'bg-slate-200 dark:bg-slate-700'
                                    }`}
                            >
                                <span
                                    className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${notifications[item.key] ? 'translate-x-6' : ''
                                        }`}
                                />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Save Status */}
            {saved && (
                <div className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg shadow-lg">
                    <CheckCircle className="h-5 w-5" />
                    저장되었습니다
                </div>
            )}
        </div>
    );
}
