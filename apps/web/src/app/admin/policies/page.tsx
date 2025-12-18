'use client';

import { useState } from 'react';
import {
    Shield,
    Plus,
    Search,
    Edit,
    Trash2,
    Power,
    PowerOff,
    X,
    AlertTriangle,
    Loader2,
} from 'lucide-react';
import {
    usePolicies,
    useCreatePolicy,
    useUpdatePolicy,
    useDeletePolicy,
    Policy,
} from '@/lib/api-hooks';

export default function AdminPoliciesPage() {
    const { data: policies, isLoading, error } = usePolicies();
    const createMutation = useCreatePolicy();
    const updateMutation = useUpdatePolicy();
    const deleteMutation = useDeletePolicy();

    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        isActive: true,
    });

    const filteredPolicies = (policies || []).filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const openCreateModal = () => {
        setFormData({ name: '', description: '', isActive: true });
        setShowCreateModal(true);
    };

    const openEditModal = (policy: Policy) => {
        setFormData({
            name: policy.name || '',
            description: policy.description || '',
            isActive: policy.isActive ?? true,
        });
        setEditingPolicy(policy);
    };

    const closeModals = () => {
        setShowCreateModal(false);
        setEditingPolicy(null);
    };

    const handleCreate = async () => {
        try {
            await createMutation.mutateAsync(formData);
            closeModals();
        } catch (err) {
            console.error('Failed to create policy:', err);
        }
    };

    const handleUpdate = async () => {
        if (!editingPolicy) return;
        try {
            await updateMutation.mutateAsync({ id: editingPolicy.id, ...formData });
            closeModals();
        } catch (err) {
            console.error('Failed to update policy:', err);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('정말 이 정책을 삭제하시겠습니까?')) return;
        try {
            await deleteMutation.mutateAsync(id);
        } catch (err) {
            console.error('Failed to delete policy:', err);
        }
    };

    const togglePolicy = async (policy: Policy) => {
        try {
            await updateMutation.mutateAsync({ id: policy.id, isActive: !policy.isActive });
        } catch (err) {
            console.error('Failed to toggle policy:', err);
        }
    };

    const getScopeLabel = (policy: Policy) => {
        if (policy.projectId) return '프로젝트';
        if (policy.organizationId) return '조직';
        return '전역';
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-red-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg p-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                정책 목록을 불러오는데 실패했습니다.
            </div>
        );
    }

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
                <button
                    onClick={openCreateModal}
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
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
                        className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border ${policy.isActive
                            ? 'border-slate-200 dark:border-slate-700'
                            : 'border-slate-200 dark:border-slate-700 opacity-60'
                            } p-6`}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${policy.isActive
                                    ? 'bg-red-100 dark:bg-red-900/30'
                                    : 'bg-slate-100 dark:bg-slate-700'
                                    }`}>
                                    <Shield className={`h-5 w-5 ${policy.isActive ? 'text-red-600' : 'text-slate-400'}`} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-slate-900 dark:text-white">{policy.name}</h3>
                                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                                            {getScopeLabel(policy)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-500 mt-1">{policy.description}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => togglePolicy(policy)}
                                    disabled={updateMutation.isPending}
                                    className={`p-2 rounded-lg transition-colors ${policy.isActive
                                        ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                                        : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                                        }`}
                                    title={policy.isActive ? '비활성화' : '활성화'}
                                >
                                    {policy.isActive ? <Power className="h-5 w-5" /> : <PowerOff className="h-5 w-5" />}
                                </button>
                                <button
                                    onClick={() => openEditModal(policy)}
                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                >
                                    <Edit className="h-5 w-5" />
                                </button>
                                <button
                                    onClick={() => handleDelete(policy.id)}
                                    disabled={deleteMutation.isPending}
                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                >
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        {/* Rules Preview */}
                        {policy.rules && policy.rules.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                                <p className="text-xs text-slate-500 mb-2">규칙 {policy.rules.length}개:</p>
                                <div className="flex flex-wrap gap-2">
                                    {policy.rules.slice(0, 5).map((rule) => (
                                        <span
                                            key={rule.id}
                                            className={`px-2 py-1 rounded text-xs ${rule.action === 'BLOCK'
                                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                }`}
                                        >
                                            {rule.ruleType} → {rule.action}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {filteredPolicies.length === 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-12 text-center">
                    <Shield className="h-16 w-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                        정책이 없습니다
                    </h3>
                    <button
                        onClick={openCreateModal}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                        <Plus className="h-4 w-4" />
                        정책 추가
                    </button>
                </div>
            )}

            {/* Create/Edit Modal */}
            {(showCreateModal || editingPolicy) && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg">
                        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                {editingPolicy ? '정책 수정' : '정책 추가'}
                            </h3>
                            <button onClick={closeModals} className="text-slate-400 hover:text-slate-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    정책 이름 *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                                    placeholder="Critical 취약점 차단"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    설명
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                                />
                                <label htmlFor="isActive" className="text-sm text-slate-700 dark:text-slate-300">
                                    정책 활성화
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 p-6 border-t border-slate-200 dark:border-slate-700">
                            <button
                                onClick={closeModals}
                                className="px-4 py-2 text-sm border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
                            >
                                취소
                            </button>
                            <button
                                onClick={editingPolicy ? handleUpdate : handleCreate}
                                disabled={createMutation.isPending || updateMutation.isPending || !formData.name}
                                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                            >
                                {createMutation.isPending || updateMutation.isPending ? '처리 중...' : editingPolicy ? '저장' : '추가'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
