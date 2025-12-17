'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';

export default function ProfilePage() {
    const { user } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);
    const [saved, setSaved] = useState(false);

    // Form states
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');

    // Notification settings
    const [notifications, setNotifications] = useState({
        criticalVuln: true,
        highVuln: true,
        scanComplete: true,
        policyViolation: true,
        weeklyReport: false,
    });

    const handleSave = async () => {
        setIsLoading(true);
        // Mock save
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsLoading(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <div className="space-y-6 max-w-3xl">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">프로필 설정</h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                    계정 정보 및 알림 설정을 관리합니다
                </p>
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
                        <p className="text-sm text-slate-500">{email}</p>
                        <p className="text-xs text-slate-400 mt-1">
                            역할: {user?.roles?.join(', ') || 'User'}
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
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                value="ACME Corp"
                                disabled
                                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-slate-500 dark:text-slate-400"
                            />
                        </div>
                    </div>
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
                            <Shield className="h-5 w-5 text-green-500" />
                            <div>
                                <p className="font-medium text-slate-900 dark:text-white">2단계 인증 (MFA)</p>
                                <p className="text-sm text-green-600">활성화됨</p>
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
                </h3>

                <div className="space-y-4">
                    {[
                        { key: 'criticalVuln', label: 'Critical 취약점 감지', desc: '새로운 Critical 수준 취약점 발견 시 알림' },
                        { key: 'highVuln', label: 'High 취약점 감지', desc: '새로운 High 수준 취약점 발견 시 알림' },
                        { key: 'scanComplete', label: '스캔 완료', desc: '스캔 작업 완료 시 알림' },
                        { key: 'policyViolation', label: '정책 위반', desc: '정책 위반 발생 시 알림' },
                        { key: 'weeklyReport', label: '주간 리포트', desc: '매주 월요일 요약 리포트 발송' },
                    ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700 last:border-0">
                            <div>
                                <p className="font-medium text-slate-900 dark:text-white">{item.label}</p>
                                <p className="text-sm text-slate-500">{item.desc}</p>
                            </div>
                            <button
                                onClick={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof prev] }))}
                                className={`relative w-12 h-6 rounded-full transition-colors ${notifications[item.key as keyof typeof notifications]
                                        ? 'bg-blue-600'
                                        : 'bg-slate-200 dark:bg-slate-700'
                                    }`}
                            >
                                <span
                                    className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${notifications[item.key as keyof typeof notifications] ? 'translate-x-6' : ''
                                        }`}
                                />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end gap-3">
                {saved && (
                    <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-5 w-5" />
                        저장되었습니다
                    </div>
                )}
                <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            저장 중...
                        </>
                    ) : (
                        <>
                            <Save className="h-5 w-5" />
                            저장
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
