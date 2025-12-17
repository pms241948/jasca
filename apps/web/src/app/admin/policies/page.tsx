'use client';

import { useState } from 'react';
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Power,
    PowerOff,
    AlertTriangle,
    Shield,
    ChevronRight,
} from 'lucide-react';

interface PolicyRule {
    type: string;
    condition: string;
    value: string;
    action: string;
}

interface Policy {
    id: string;
    name: string;
    description: string;
    scope: string;
    enabled: boolean;
    rules: PolicyRule[];
    appliedTo: string;
}

// Mock policies
const mockPolicies: Policy[] = [
    {
        id: '1',
        name: 'Critical 취약점 차단',
        description: 'Critical 수준의 취약점이 발견되면 배포를 차단합니다',
        scope: 'ORGANIZATION',
        enabled: true,
        rules: [
            { type: 'SEVERITY_BLOCK', condition: 'equals', value: 'CRITICAL', action: 'BLOCK' },
        ],
        appliedTo: 'ACME Corp (전체)',
    },
    {
        id: '2',
        name: 'High 취약점 경고',
        description: 'High 수준 취약점이 5개 이상이면 경고합니다',
        scope: 'ORGANIZATION',
        enabled: true,
        rules: [
            { type: 'SEVERITY_THRESHOLD', condition: 'gte', value: '5', action: 'WARN' },
        ],
        appliedTo: 'ACME Corp (전체)',
    },
    {
        id: '3',
        name: 'KEV 차단',
        description: 'Known Exploited Vulnerabilities 목록의 취약점은 차단',
        scope: 'PROJECT',
        enabled: true,
        rules: [
            { type: 'KEV_BLOCK', condition: 'exists', value: 'true', action: 'BLOCK' },
        ],
        appliedTo: 'backend-api, frontend-web',
    },
    {
        id: '4',
        name: '라이선스 검사',
        description: 'GPL 라이선스 사용을 경고합니다',
        scope: 'PROJECT',
        enabled: false,
        rules: [
            { type: 'LICENSE_BLOCK', condition: 'contains', value: 'GPL', action: 'WARN' },
        ],
        appliedTo: 'backend-api',
    },
];

export default function AdminPoliciesPage() {
    const [policies, setPolicies] = useState<Policy[]>(mockPolicies);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredPolicies = policies.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const togglePolicy = (id: string) => {
        setPolicies(prev =>
            prev.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p)
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">정책 관리</h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                        보안 정책을 관리하고 적용 범위를 설정합니다
                    </p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                    <Plus className="h-4 w-4" />
                    정책 추가
                </button>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                    type="text"
                    placeholder="정책 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-10 pr-4 py-2 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
            </div>

            {/* Policies List */}
            <div className="space-y-4">
                {filteredPolicies.map((policy) => (
                    <div
                        key={policy.id}
                        className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border ${policy.enabled
                            ? 'border-slate-200 dark:border-slate-700'
                            : 'border-slate-200 dark:border-slate-700 opacity-60'
                            } p-6`}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${policy.enabled
                                    ? 'bg-red-100 dark:bg-red-900/30'
                                    : 'bg-slate-100 dark:bg-slate-700'
                                    }`}>
                                    <Shield className={`h-5 w-5 ${policy.enabled ? 'text-red-600' : 'text-slate-400'
                                        }`} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-slate-900 dark:text-white">{policy.name}</h3>
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${policy.scope === 'ORGANIZATION'
                                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                            }`}>
                                            {policy.scope === 'ORGANIZATION' ? '조직' : '프로젝트'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-500 mt-1">{policy.description}</p>
                                    <p className="text-xs text-slate-400 mt-2">적용: {policy.appliedTo}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => togglePolicy(policy.id)}
                                    className={`p-2 rounded-lg transition-colors ${policy.enabled
                                        ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                                        : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                                        }`}
                                    title={policy.enabled ? '비활성화' : '활성화'}
                                >
                                    {policy.enabled ? <Power className="h-5 w-5" /> : <PowerOff className="h-5 w-5" />}
                                </button>
                                <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                                    <Edit className="h-5 w-5" />
                                </button>
                                <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        {/* Rules Preview */}
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                            <p className="text-xs text-slate-500 mb-2">규칙:</p>
                            <div className="flex flex-wrap gap-2">
                                {policy.rules.map((rule, idx) => (
                                    <span
                                        key={idx}
                                        className={`px-2 py-1 rounded text-xs ${rule.action === 'BLOCK'
                                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                            }`}
                                    >
                                        {rule.type} {rule.condition} {rule.value} → {rule.action}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
