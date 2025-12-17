'use client';

import { useState } from 'react';
import {
    History,
    Search,
    Filter,
    User,
    Shield,
    Settings,
    Key,
    Calendar,
    ChevronDown,
} from 'lucide-react';

// Mock audit logs
const mockLogs = [
    {
        id: '1',
        action: 'POLICY_CREATED',
        actor: '최관리자',
        target: 'Critical 취약점 차단 정책',
        details: '새 정책이 생성되었습니다',
        ip: '192.168.1.100',
        timestamp: '2024-12-17T10:30:00Z',
    },
    {
        id: '2',
        action: 'USER_ROLE_CHANGED',
        actor: '최관리자',
        target: '김개발',
        details: 'DEVELOPER → SECURITY_ENGINEER',
        ip: '192.168.1.100',
        timestamp: '2024-12-17T09:15:00Z',
    },
    {
        id: '3',
        action: 'EXCEPTION_APPROVED',
        actor: '최관리자',
        target: 'CVE-2024-9999',
        details: '예외 요청 승인됨',
        ip: '192.168.1.100',
        timestamp: '2024-12-16T18:45:00Z',
    },
    {
        id: '4',
        action: 'MFA_DISABLED',
        actor: '박매니저',
        target: '본인',
        details: 'MFA가 비활성화됨',
        ip: '192.168.1.55',
        timestamp: '2024-12-16T14:20:00Z',
    },
    {
        id: '5',
        action: 'API_TOKEN_CREATED',
        actor: '이개발',
        target: 'CI/CD Pipeline',
        details: '새 API 토큰 생성됨',
        ip: '192.168.1.42',
        timestamp: '2024-12-16T11:00:00Z',
    },
    {
        id: '6',
        action: 'LOGIN_FAILED',
        actor: 'unknown@example.com',
        target: '-',
        details: '잘못된 비밀번호 (3회 시도)',
        ip: '203.0.113.42',
        timestamp: '2024-12-16T08:30:00Z',
    },
];

function getActionIcon(action: string) {
    if (action.includes('POLICY')) return <Shield className="h-4 w-4" />;
    if (action.includes('USER') || action.includes('LOGIN')) return <User className="h-4 w-4" />;
    if (action.includes('TOKEN') || action.includes('MFA')) return <Key className="h-4 w-4" />;
    return <Settings className="h-4 w-4" />;
}

function getActionColor(action: string) {
    if (action.includes('FAILED') || action.includes('DISABLED')) return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
    if (action.includes('CREATED') || action.includes('APPROVED')) return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
    if (action.includes('CHANGED') || action.includes('UPDATED')) return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400';
    return 'text-slate-600 bg-slate-100 dark:bg-slate-700 dark:text-slate-400';
}

function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
}

export default function AuditLogsPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAction, setSelectedAction] = useState<string>('');

    const filteredLogs = mockLogs.filter(log => {
        const matchesSearch = log.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.target.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.details.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesAction = !selectedAction || log.action.includes(selectedAction);
        return matchesSearch && matchesAction;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">감사 로그</h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                    시스템 내 모든 중요 활동을 추적합니다
                </p>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="사용자, 대상, 설명 검색..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-10 pr-4 py-2 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                </div>
                <select
                    value={selectedAction}
                    onChange={(e) => setSelectedAction(e.target.value)}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                    <option value="">모든 활동</option>
                    <option value="POLICY">정책 변경</option>
                    <option value="USER">사용자 관리</option>
                    <option value="TOKEN">토큰 관리</option>
                    <option value="MFA">MFA 설정</option>
                    <option value="LOGIN">로그인</option>
                    <option value="EXCEPTION">예외 처리</option>
                </select>
            </div>

            {/* Logs Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-700/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                활동
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                사용자
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                대상
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                세부 정보
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                IP
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                시간
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {filteredLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${getActionColor(log.action)}`}>
                                        {getActionIcon(log.action)}
                                        {log.action.replace(/_/g, ' ')}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-900 dark:text-white">
                                    {log.actor}
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                    {log.target}
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-500">
                                    {log.details}
                                </td>
                                <td className="px-6 py-4 text-sm font-mono text-slate-500">
                                    {log.ip}
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-500">
                                    {formatDate(log.timestamp)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
