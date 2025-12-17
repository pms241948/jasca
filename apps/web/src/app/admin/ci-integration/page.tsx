'use client';

import { useState } from 'react';
import {
    Link as LinkIcon,
    Plus,
    Copy,
    Trash2,
    CheckCircle,
    Github,
    GitBranch,
    Terminal,
    Eye,
    EyeOff,
} from 'lucide-react';

// Mock CI integrations
const mockIntegrations = [
    {
        id: '1',
        name: 'GitHub Actions - main',
        type: 'GITHUB',
        repository: 'acme-corp/backend-api',
        branch: 'main',
        lastRun: '2024-12-17T10:30:00Z',
        status: 'SUCCESS',
    },
    {
        id: '2',
        name: 'GitLab CI - staging',
        type: 'GITLAB',
        repository: 'acme-corp/frontend-web',
        branch: 'develop',
        lastRun: '2024-12-17T09:15:00Z',
        status: 'SUCCESS',
    },
    {
        id: '3',
        name: 'Jenkins - production',
        type: 'JENKINS',
        repository: 'acme-corp/auth-service',
        branch: 'release',
        lastRun: '2024-12-16T18:45:00Z',
        status: 'FAILED',
    },
];

const cliExample = `# JASCA CLI 사용 예시

# 이미지 스캔
jasca scan --image backend-api:latest --project backend-api

# 결과 확인
jasca results --scan-id <SCAN_ID>

# 정책 검사
jasca policy-check --scan-id <SCAN_ID>`;

const pipelineExample = `# GitHub Actions 예시
- name: Scan with JASCA
  uses: jasca/action@v1
  with:
    image: \${{ env.IMAGE_NAME }}
    project: \${{ env.PROJECT_ID }}
    api-token: \${{ secrets.JASCA_TOKEN }}
    fail-on: critical`;

export default function CIIntegrationPage() {
    const [showToken, setShowToken] = useState(false);
    const [selectedTab, setSelectedTab] = useState<'integrations' | 'cli' | 'pipeline'>('integrations');

    const mockToken = 'jasca_ci_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6';

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">CI/CD 연동</h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                    CI/CD 파이프라인과 JASCA를 연동합니다
                </p>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200 dark:border-slate-700">
                <div className="flex gap-4">
                    {[
                        { id: 'integrations', label: '연동 현황' },
                        { id: 'cli', label: 'CLI 설정' },
                        { id: 'pipeline', label: '파이프라인 스니펫' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setSelectedTab(tab.id as typeof selectedTab)}
                            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${selectedTab === tab.id
                                    ? 'border-red-600 text-red-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Integrations Tab */}
            {selectedTab === 'integrations' && (
                <div className="space-y-4">
                    <div className="flex justify-end">
                        <button className="flex items-center gap-2 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                            <Plus className="h-4 w-4" />
                            연동 추가
                        </button>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-slate-50 dark:bg-slate-700/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        이름
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        저장소
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        브랜치
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        마지막 실행
                                    </th>
                                    <th className="px-6 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {mockIntegrations.map((integration) => (
                                    <tr key={integration.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <Github className="h-5 w-5 text-slate-600" />
                                                <span className="font-medium text-slate-900 dark:text-white">{integration.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                            {integration.repository}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-sm">
                                                <GitBranch className="h-3 w-3" />
                                                {integration.branch}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${integration.status === 'SUCCESS'
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                }`}>
                                                <CheckCircle className="h-3 w-3" />
                                                {integration.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* CLI Tab */}
            {selectedTab === 'cli' && (
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-4">API 토큰</h3>
                        <div className="flex items-center gap-2">
                            <input
                                type={showToken ? 'text' : 'password'}
                                value={mockToken}
                                readOnly
                                className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 font-mono text-sm"
                            />
                            <button
                                onClick={() => setShowToken(!showToken)}
                                className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
                            >
                                {showToken ? <EyeOff className="h-5 w-5 text-slate-600" /> : <Eye className="h-5 w-5 text-slate-600" />}
                            </button>
                            <button
                                onClick={() => handleCopy(mockToken)}
                                className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
                            >
                                <Copy className="h-5 w-5 text-slate-600" />
                            </button>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                <Terminal className="h-5 w-5" />
                                CLI 사용법
                            </h3>
                            <button
                                onClick={() => handleCopy(cliExample)}
                                className="text-sm text-blue-600 hover:text-blue-700"
                            >
                                복사
                            </button>
                        </div>
                        <pre className="bg-slate-900 text-green-400 rounded-lg p-4 text-sm overflow-x-auto">
                            {cliExample}
                        </pre>
                    </div>
                </div>
            )}

            {/* Pipeline Tab */}
            {selectedTab === 'pipeline' && (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-slate-900 dark:text-white">GitHub Actions 예시</h3>
                        <button
                            onClick={() => handleCopy(pipelineExample)}
                            className="text-sm text-blue-600 hover:text-blue-700"
                        >
                            복사
                        </button>
                    </div>
                    <pre className="bg-slate-900 text-slate-300 rounded-lg p-4 text-sm overflow-x-auto">
                        <code>{pipelineExample}</code>
                    </pre>
                </div>
            )}
        </div>
    );
}
