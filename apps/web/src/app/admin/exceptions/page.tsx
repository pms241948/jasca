'use client';

import { useState } from 'react';
import {
    ShieldCheck,
    Clock,
    CheckCircle,
    XCircle,
    ChevronDown,
    ChevronUp,
    Loader2,
    AlertTriangle,
} from 'lucide-react';
import { useExceptions, useApproveException, useRejectException, type Exception } from '@/lib/api-hooks';

function getSeverityBadge(severity: string) {
    const styles: Record<string, string> = {
        CRITICAL: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        HIGH: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
        MEDIUM: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
        LOW: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    };
    return (
        <span className={`px-2 py-1 rounded text-xs font-medium ${styles[severity] || ''}`}>
            {severity}
        </span>
    );
}

function getStatusBadge(status: string) {
    const config: Record<string, { icon: React.ReactNode; style: string; label: string }> = {
        PENDING: { icon: <Clock className="h-3 w-3" />, style: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', label: '대기 중' },
        APPROVED: { icon: <CheckCircle className="h-3 w-3" />, style: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', label: '승인됨' },
        REJECTED: { icon: <XCircle className="h-3 w-3" />, style: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', label: '반려됨' },
    };
    const { icon, style, label } = config[status] || config.PENDING;
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${style}`}>
            {icon}
            {label}
        </span>
    );
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

export default function ExceptionsPage() {
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const { data: exceptions = [], isLoading, error, refetch } = useExceptions(
        filter === 'all' ? undefined : filter
    );
    const approveMutation = useApproveException();
    const rejectMutation = useRejectException();

    const pendingCount = exceptions.filter(e => e.status === 'PENDING').length;

    const handleApprove = async (id: string) => {
        try {
            await approveMutation.mutateAsync(id);
        } catch (err) {
            console.error('Failed to approve exception:', err);
        }
    };

    const handleReject = async (id: string) => {
        const reason = prompt('반려 사유를 입력하세요:');
        if (reason) {
            try {
                await rejectMutation.mutateAsync({ id, reason });
            } catch (err) {
                console.error('Failed to reject exception:', err);
            }
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
                <p className="text-red-600 dark:text-red-300">예외 요청 목록을 불러오는데 실패했습니다.</p>
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
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">예외 승인</h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                    취약점 예외 요청을 검토하고 승인/반려합니다
                </p>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
                {[
                    { value: 'pending', label: '대기 중', showCount: true },
                    { value: 'approved', label: '승인됨' },
                    { value: 'rejected', label: '반려됨' },
                    { value: 'all', label: '전체' },
                ].map((item) => (
                    <button
                        key={item.value}
                        onClick={() => setFilter(item.value as typeof filter)}
                        className={`px-4 py-2 text-sm rounded-lg transition-colors flex items-center gap-2 ${filter === item.value
                            ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                    >
                        {item.label}
                        {item.showCount && pendingCount > 0 && (
                            <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                                {pendingCount}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Exceptions List */}
            {exceptions.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-12 text-center">
                    <ShieldCheck className="h-16 w-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                        예외 요청이 없습니다
                    </h3>
                </div>
            ) : (
                <div className="space-y-4">
                    {exceptions.map((exception: Exception) => (
                        <div
                            key={exception.id}
                            className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden"
                        >
                            <div
                                className="p-4 flex items-center gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/30"
                                onClick={() => setExpandedId(expandedId === exception.id ? null : exception.id)}
                            >
                                <div className="flex-1 flex items-center gap-4">
                                    {getSeverityBadge(exception.vulnerability?.severity || 'UNKNOWN')}
                                    <div>
                                        <p className="font-semibold text-slate-900 dark:text-white">
                                            {exception.vulnerability?.cveId || exception.vulnerabilityId}
                                        </p>
                                        <p className="text-sm text-slate-500">{exception.project?.name || exception.projectId}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="text-sm text-slate-600 dark:text-slate-400">{exception.requestedBy}</p>
                                        <p className="text-xs text-slate-400">{formatDate(exception.requestedAt)}</p>
                                    </div>
                                    {getStatusBadge(exception.status)}
                                    {expandedId === exception.id ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                                </div>
                            </div>

                            {expandedId === exception.id && (
                                <div className="px-4 pb-4 space-y-4">
                                    <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">예외 요청 사유:</p>
                                        <p className="text-slate-600 dark:text-slate-400">{exception.reason}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-slate-500">만료일</span>
                                            <p className="text-slate-700 dark:text-slate-300">{formatDate(exception.expiresAt)}</p>
                                        </div>
                                    </div>

                                    {exception.status === 'APPROVED' && exception.approvedBy && (
                                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-sm">
                                            <p className="text-green-700 dark:text-green-400">
                                                {exception.approvedBy}님이 {formatDate(exception.approvedAt || '')}에 승인함
                                            </p>
                                        </div>
                                    )}

                                    {exception.status === 'REJECTED' && exception.rejectedBy && (
                                        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-sm">
                                            <p className="text-red-700 dark:text-red-400 mb-1">
                                                {exception.rejectedBy}님이 {formatDate(exception.rejectedAt || '')}에 반려함
                                            </p>
                                            {exception.rejectReason && (
                                                <p className="text-red-600 dark:text-red-300">사유: {exception.rejectReason}</p>
                                            )}
                                        </div>
                                    )}

                                    {exception.status === 'PENDING' && (
                                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleReject(exception.id); }}
                                                disabled={rejectMutation.isPending}
                                                className="flex items-center gap-2 px-4 py-2 text-sm border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                                            >
                                                {rejectMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                                                반려
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleApprove(exception.id); }}
                                                disabled={approveMutation.isPending}
                                                className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                                            >
                                                {approveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                                                승인
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
