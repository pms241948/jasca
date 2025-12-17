'use client';

import { useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft,
    ArrowLeftRight,
    Plus,
    Minus,
    AlertTriangle,
    CheckCircle,
    Calendar,
    ChevronDown,
} from 'lucide-react';

// Mock diff data
const mockDiff = {
    baseScan: {
        id: 'scan-001',
        targetName: 'backend-api:v2.3.0',
        date: '2024-12-15T10:00:00Z',
        totalVulnerabilities: 45,
    },
    compareScan: {
        id: 'scan-002',
        targetName: 'backend-api:v2.4.0',
        date: '2024-12-17T10:00:00Z',
        totalVulnerabilities: 38,
    },
    added: [
        { cveId: 'CVE-2024-1234', pkgName: 'lodash', severity: 'CRITICAL', title: 'Prototype Pollution' },
        { cveId: 'CVE-2024-5678', pkgName: 'axios', severity: 'HIGH', title: 'SSRF Vulnerability' },
    ],
    removed: [
        { cveId: 'CVE-2023-1111', pkgName: 'express', severity: 'HIGH', title: 'Path Traversal' },
        { cveId: 'CVE-2023-2222', pkgName: 'moment', severity: 'MEDIUM', title: 'ReDoS' },
        { cveId: 'CVE-2023-3333', pkgName: 'jquery', severity: 'MEDIUM', title: 'XSS' },
        { cveId: 'CVE-2023-4444', pkgName: 'underscore', severity: 'LOW', title: 'Arbitrary Code Execution' },
    ],
    unchanged: 36,
};

function getSeverityColor(severity: string) {
    const colors: Record<string, string> = {
        CRITICAL: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400',
        HIGH: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400',
        MEDIUM: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400',
        LOW: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400',
    };
    return colors[severity] || 'text-slate-600 bg-slate-100';
}

function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function ScanDiffPage() {
    const params = useParams();
    const scanId = params.id as string;
    const [showUnchanged, setShowUnchanged] = useState(false);

    const diff = mockDiff;
    const netChange = diff.added.length - diff.removed.length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href={`/dashboard/scans/${scanId}`}
                    className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">스캔 비교</h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                        이전 스캔 대비 취약점 변화 분석
                    </p>
                </div>
            </div>

            {/* Scan Comparison Header */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <div className="flex items-center justify-between">
                    {/* Base Scan */}
                    <div className="flex-1">
                        <p className="text-sm text-slate-500 mb-1">이전 스캔</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{diff.baseScan.targetName}</p>
                        <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(diff.baseScan.date)}
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                            총 {diff.baseScan.totalVulnerabilities}개 취약점
                        </p>
                    </div>

                    {/* Arrow */}
                    <div className="px-8">
                        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                            <ArrowLeftRight className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                        </div>
                    </div>

                    {/* Compare Scan */}
                    <div className="flex-1 text-right">
                        <p className="text-sm text-slate-500 mb-1">현재 스캔</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{diff.compareScan.targetName}</p>
                        <div className="flex items-center gap-2 text-sm text-slate-500 mt-1 justify-end">
                            <Calendar className="h-4 w-4" />
                            {formatDate(diff.compareScan.date)}
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                            총 {diff.compareScan.totalVulnerabilities}개 취약점
                        </p>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-red-200 dark:border-red-800 p-5">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                            <Plus className="h-5 w-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">새로 추가됨</p>
                            <p className="text-2xl font-bold text-red-600 dark:text-red-400">+{diff.added.length}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-green-200 dark:border-green-800 p-5">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <Minus className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">해결됨</p>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">-{diff.removed.length}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
                    <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-lg ${netChange > 0 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
                            {netChange > 0 ? (
                                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                            ) : (
                                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                            )}
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">순 변화</p>
                            <p className={`text-2xl font-bold ${netChange > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                {netChange > 0 ? '+' : ''}{netChange}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Added Vulnerabilities */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                        <Plus className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                        새로 추가된 취약점 ({diff.added.length})
                    </h3>
                </div>
                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                    {diff.added.map((vuln) => (
                        <div key={vuln.cveId} className="p-4 flex items-center gap-4 bg-red-50/50 dark:bg-red-900/10">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${getSeverityColor(vuln.severity)}`}>
                                {vuln.severity}
                            </span>
                            <div className="flex-1">
                                <Link
                                    href={`/dashboard/vulnerabilities/${vuln.cveId}`}
                                    className="font-medium text-slate-900 dark:text-white hover:text-blue-600"
                                >
                                    {vuln.cveId}
                                </Link>
                                <p className="text-sm text-slate-500">{vuln.title}</p>
                            </div>
                            <span className="text-sm text-slate-500 font-mono">{vuln.pkgName}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Removed Vulnerabilities */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                        <Minus className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                        해결된 취약점 ({diff.removed.length})
                    </h3>
                </div>
                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                    {diff.removed.map((vuln) => (
                        <div key={vuln.cveId} className="p-4 flex items-center gap-4 bg-green-50/50 dark:bg-green-900/10">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${getSeverityColor(vuln.severity)}`}>
                                {vuln.severity}
                            </span>
                            <div className="flex-1">
                                <span className="font-medium text-slate-900 dark:text-white line-through opacity-60">
                                    {vuln.cveId}
                                </span>
                                <p className="text-sm text-slate-500">{vuln.title}</p>
                            </div>
                            <span className="text-sm text-slate-500 font-mono">{vuln.pkgName}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Unchanged Toggle */}
            <button
                onClick={() => setShowUnchanged(!showUnchanged)}
                className="w-full flex items-center justify-center gap-2 py-3 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
                <ChevronDown className={`h-5 w-5 transition-transform ${showUnchanged ? 'rotate-180' : ''}`} />
                변경 없음 ({diff.unchanged}개 취약점)
            </button>
        </div>
    );
}
