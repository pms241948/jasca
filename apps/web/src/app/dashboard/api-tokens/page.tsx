'use client';

import { useState } from 'react';
import {
    Key,
    Plus,
    Copy,
    Trash2,
    Eye,
    EyeOff,
    Calendar,
    Shield,
    CheckCircle,
    AlertTriangle,
} from 'lucide-react';

// Mock tokens
const mockTokens = [
    {
        id: '1',
        name: 'CI/CD Pipeline',
        prefix: 'jasca_****8a2f',
        scopes: ['scans:read', 'scans:write', 'vulnerabilities:read'],
        createdAt: '2024-11-01T00:00:00Z',
        lastUsed: '2024-12-17T09:30:00Z',
        expiresAt: '2025-11-01T00:00:00Z',
    },
    {
        id: '2',
        name: 'Monitoring Dashboard',
        prefix: 'jasca_****3b7e',
        scopes: ['vulnerabilities:read', 'projects:read'],
        createdAt: '2024-10-15T00:00:00Z',
        lastUsed: '2024-12-16T14:22:00Z',
        expiresAt: '2025-10-15T00:00:00Z',
    },
];

const availableScopes = [
    { id: 'scans:read', label: '스캔 읽기', desc: '스캔 결과 조회' },
    { id: 'scans:write', label: '스캔 쓰기', desc: '스캔 생성 및 수정' },
    { id: 'vulnerabilities:read', label: '취약점 읽기', desc: '취약점 정보 조회' },
    { id: 'vulnerabilities:write', label: '취약점 쓰기', desc: '취약점 상태 변경' },
    { id: 'projects:read', label: '프로젝트 읽기', desc: '프로젝트 정보 조회' },
    { id: 'policies:read', label: '정책 읽기', desc: '정책 정보 조회' },
];

function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
}

export default function ApiTokensPage() {
    const [tokens, setTokens] = useState(mockTokens);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newToken, setNewToken] = useState<string | null>(null);
    const [showToken, setShowToken] = useState(false);

    // Create form states
    const [tokenName, setTokenName] = useState('');
    const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
    const [expiresIn, setExpiresIn] = useState<'30' | '90' | '365' | 'never'>('90');

    const handleCreate = () => {
        if (!tokenName) return;
        // Mock token creation
        const generatedToken = 'jasca_' + Math.random().toString(36).substring(2, 18);
        setNewToken(generatedToken);
    };

    const handleCopy = () => {
        if (newToken) {
            navigator.clipboard.writeText(newToken);
        }
    };

    const handleDelete = (id: string) => {
        if (confirm('이 토큰을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
            setTokens(prev => prev.filter(t => t.id !== id));
        }
    };

    const closeModal = () => {
        setShowCreateModal(false);
        setNewToken(null);
        setTokenName('');
        setSelectedScopes([]);
        setExpiresIn('90');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">API 토큰</h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                        API 접근을 위한 토큰을 관리합니다
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    토큰 생성
                </button>
            </div>

            {/* Warning */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>보안 주의:</strong> API 토큰은 생성 시에만 전체 값을 확인할 수 있습니다.
                    토큰을 안전하게 보관하고, 유출되었다고 의심되면 즉시 삭제해주세요.
                </div>
            </div>

            {/* Tokens List */}
            {tokens.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-12 text-center">
                    <Key className="h-16 w-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                        API 토큰이 없습니다
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-4">
                        CI/CD 파이프라인이나 외부 도구와 연동하려면 토큰을 생성하세요.
                    </p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        첫 토큰 생성
                    </button>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="divide-y divide-slate-200 dark:divide-slate-700">
                        {tokens.map((token) => (
                            <div key={token.id} className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                                            <Key className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-900 dark:text-white">{token.name}</h3>
                                            <p className="text-sm font-mono text-slate-500">{token.prefix}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(token.id)}
                                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </div>

                                <div className="flex flex-wrap gap-2 mb-4">
                                    {token.scopes.map((scope) => (
                                        <span
                                            key={scope}
                                            className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded text-xs"
                                        >
                                            {scope}
                                        </span>
                                    ))}
                                </div>

                                <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <span className="text-slate-500">생성일</span>
                                        <p className="text-slate-700 dark:text-slate-300">{formatDate(token.createdAt)}</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">마지막 사용</span>
                                        <p className="text-slate-700 dark:text-slate-300">{formatDate(token.lastUsed)}</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">만료일</span>
                                        <p className="text-slate-700 dark:text-slate-300">{formatDate(token.expiresAt)}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg">
                        {!newToken ? (
                            <>
                                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                        새 API 토큰 생성
                                    </h3>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            토큰 이름
                                        </label>
                                        <input
                                            type="text"
                                            value={tokenName}
                                            onChange={(e) => setTokenName(e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="예: CI/CD Pipeline"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            권한 범위
                                        </label>
                                        <div className="space-y-2 max-h-48 overflow-y-auto">
                                            {availableScopes.map((scope) => (
                                                <label
                                                    key={scope.id}
                                                    className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedScopes.includes(scope.id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedScopes(prev => [...prev, scope.id]);
                                                            } else {
                                                                setSelectedScopes(prev => prev.filter(s => s !== scope.id));
                                                            }
                                                        }}
                                                        className="w-4 h-4 text-blue-600 rounded"
                                                    />
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-900 dark:text-white">{scope.label}</p>
                                                        <p className="text-xs text-slate-500">{scope.desc}</p>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            만료 기간
                                        </label>
                                        <select
                                            value={expiresIn}
                                            onChange={(e) => setExpiresIn(e.target.value as typeof expiresIn)}
                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="30">30일</option>
                                            <option value="90">90일</option>
                                            <option value="365">1년</option>
                                            <option value="never">만료 없음</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2">
                                    <button
                                        onClick={closeModal}
                                        className="px-4 py-2 text-sm border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
                                    >
                                        취소
                                    </button>
                                    <button
                                        onClick={handleCreate}
                                        disabled={!tokenName || selectedScopes.length === 0}
                                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        생성
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                                토큰이 생성되었습니다
                                            </h3>
                                            <p className="text-sm text-slate-500">
                                                이 토큰은 다시 표시되지 않으니 안전하게 저장하세요.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        API 토큰
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type={showToken ? 'text' : 'password'}
                                            value={newToken}
                                            readOnly
                                            className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 font-mono text-sm text-slate-900 dark:text-white"
                                        />
                                        <button
                                            onClick={() => setShowToken(!showToken)}
                                            className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
                                        >
                                            {showToken ? <EyeOff className="h-5 w-5 text-slate-600" /> : <Eye className="h-5 w-5 text-slate-600" />}
                                        </button>
                                        <button
                                            onClick={handleCopy}
                                            className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
                                        >
                                            <Copy className="h-5 w-5 text-slate-600" />
                                        </button>
                                    </div>
                                </div>
                                <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                                    <button
                                        onClick={closeModal}
                                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        완료
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
