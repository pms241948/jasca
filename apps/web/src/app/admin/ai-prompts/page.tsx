'use client';

import { useState, useEffect } from 'react';
import {
    Sparkles,
    Save,
    RotateCcw,
    ChevronDown,
    ChevronUp,
    Check,
    AlertCircle,
    Loader2,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';

interface PromptData {
    prompt: string;
    isCustom: boolean;
    label: string;
    description: string;
}

export default function AiPromptsPage() {
    const { accessToken } = useAuthStore();
    const [prompts, setPrompts] = useState<Record<string, PromptData>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [expandedAction, setExpandedAction] = useState<string | null>(null);
    const [editedPrompts, setEditedPrompts] = useState<Record<string, string>>({});
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchPrompts();
    }, []);

    const fetchPrompts = async () => {
        try {
            const response = await fetch('/api/ai/prompts', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            if (!response.ok) throw new Error('Failed to fetch prompts');
            const data = await response.json();
            setPrompts(data);
        } catch (err) {
            setError('프롬프트를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (action: string) => {
        const prompt = editedPrompts[action];
        if (!prompt) return;

        setSaving(action);
        setError(null);

        try {
            const response = await fetch(`/api/ai/prompts/${action}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({ prompt }),
            });

            if (!response.ok) throw new Error('Failed to save prompt');

            setPrompts(prev => ({
                ...prev,
                [action]: { ...prev[action], prompt, isCustom: true },
            }));
            setEditedPrompts(prev => {
                const newEdited = { ...prev };
                delete newEdited[action];
                return newEdited;
            });
            setSuccessMessage(`${prompts[action]?.label || action} 프롬프트가 저장되었습니다.`);
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            setError('프롬프트 저장에 실패했습니다.');
        } finally {
            setSaving(null);
        }
    };

    const handleReset = async (action: string) => {
        setSaving(action);
        setError(null);

        try {
            const response = await fetch(`/api/ai/prompts/${action}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            if (!response.ok) throw new Error('Failed to reset prompt');

            // Refresh to get default prompt
            await fetchPrompts();
            setEditedPrompts(prev => {
                const newEdited = { ...prev };
                delete newEdited[action];
                return newEdited;
            });
            setSuccessMessage(`${prompts[action]?.label || action} 프롬프트가 기본값으로 복원되었습니다.`);
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            setError('프롬프트 초기화에 실패했습니다.');
        } finally {
            setSaving(null);
        }
    };

    const handlePromptChange = (action: string, value: string) => {
        setEditedPrompts(prev => ({ ...prev, [action]: value }));
    };

    const isEdited = (action: string) => {
        return editedPrompts[action] !== undefined && editedPrompts[action] !== prompts[action]?.prompt;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
            </div>
        );
    }

    const actionGroups: Record<string, string[]> = {
        '대시보드': ['dashboard.summary', 'dashboard.riskAnalysis'],
        '프로젝트': ['project.analysis', 'scan.changeAnalysis'],
        '취약점': ['vuln.priorityReorder', 'vuln.actionGuide', 'vuln.impactAnalysis'],
        '정책': ['policy.interpretation', 'policy.recommendation'],
        '워크플로우': ['workflow.fixVerification'],
        '리포트': ['report.generation'],
        '알림': ['notification.summary'],
        '가이드': ['guide.trivyCommand'],
        '관리자': ['admin.permissionRecommendation', 'admin.complianceMapping'],
    };

    return (
        <div className="p-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-violet-500 to-purple-500 rounded-xl">
                    <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">AI 프롬프트 관리</h1>
                    <p className="text-sm text-slate-500">각 AI 기능별 프롬프트를 수정하고 관리합니다</p>
                </div>
            </div>

            {/* Success/Error Messages */}
            {successMessage && (
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2 text-green-700 dark:text-green-400">
                    <Check className="h-4 w-4" />
                    {successMessage}
                </div>
            )}
            {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                </div>
            )}

            {/* Prompt Groups */}
            <div className="space-y-6">
                {Object.entries(actionGroups).map(([groupName, actions]) => (
                    <div key={groupName} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                            <h2 className="font-semibold text-slate-900 dark:text-white">{groupName}</h2>
                        </div>
                        <div className="divide-y divide-slate-200 dark:divide-slate-700">
                            {actions.map(action => {
                                const data = prompts[action];
                                if (!data) return null;

                                const isExpanded = expandedAction === action;
                                const currentPrompt = editedPrompts[action] ?? data.prompt;
                                const hasChanges = isEdited(action);

                                return (
                                    <div key={action} className="p-4">
                                        <button
                                            onClick={() => setExpandedAction(isExpanded ? null : action)}
                                            className="w-full flex items-center justify-between text-left"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-slate-900 dark:text-white">{data.label}</span>
                                                        {data.isCustom && (
                                                            <span className="px-2 py-0.5 text-xs bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 rounded-full">
                                                                커스텀
                                                            </span>
                                                        )}
                                                        {hasChanges && (
                                                            <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full">
                                                                수정됨
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-slate-500">{data.description}</p>
                                                </div>
                                            </div>
                                            {isExpanded ? (
                                                <ChevronUp className="h-5 w-5 text-slate-400" />
                                            ) : (
                                                <ChevronDown className="h-5 w-5 text-slate-400" />
                                            )}
                                        </button>

                                        {isExpanded && (
                                            <div className="mt-4 space-y-3">
                                                <textarea
                                                    value={currentPrompt}
                                                    onChange={e => handlePromptChange(action, e.target.value)}
                                                    rows={10}
                                                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-sm resize-y focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                                                    placeholder="프롬프트를 입력하세요..."
                                                />
                                                <div className="flex items-center justify-between">
                                                    <p className="text-xs text-slate-500">
                                                        액션 코드: <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">{action}</code>
                                                    </p>
                                                    <div className="flex items-center gap-2">
                                                        {data.isCustom && (
                                                            <button
                                                                onClick={() => handleReset(action)}
                                                                disabled={saving === action}
                                                                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                                            >
                                                                {saving === action ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <RotateCcw className="h-4 w-4" />
                                                                )}
                                                                기본값 복원
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleSave(action)}
                                                            disabled={saving === action || !hasChanges}
                                                            className="flex items-center gap-2 px-4 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                        >
                                                            {saving === action ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <Save className="h-4 w-4" />
                                                            )}
                                                            저장
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
