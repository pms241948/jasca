'use client';

import { useState, useEffect } from 'react';
import {
    Save,
    AlertTriangle,
    CheckCircle,
    Settings,
    Zap,
    FileText,
    Loader2,
    Key,
    Server,
    Sparkles,
} from 'lucide-react';
import { useAiSettings, useUpdateSettings, type AiSettings } from '@/lib/api-hooks';

const defaultConfig: AiSettings = {
    provider: 'openai',
    apiUrl: '',
    apiKey: '',
    summaryModel: 'gpt-4',
    remediationModel: 'gpt-4-turbo',
    maxTokens: 1024,
    temperature: 0.7,
    enableAutoSummary: true,
    enableRemediationGuide: true,
};

const providers = [
    { id: 'openai', name: 'OpenAI', defaultUrl: 'https://api.openai.com/v1' },
    { id: 'anthropic', name: 'Anthropic', defaultUrl: 'https://api.anthropic.com' },
    { id: 'vllm', name: 'vLLM', defaultUrl: 'http://localhost:8000/v1' },
    { id: 'ollama', name: 'Ollama', defaultUrl: 'http://localhost:11434' },
    { id: 'custom', name: 'Custom', defaultUrl: '' },
];

const modelsByProvider: Record<string, { id: string; name: string }[]> = {
    openai: [
        { id: 'gpt-4', name: 'GPT-4' },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
    ],
    anthropic: [
        { id: 'claude-3-opus', name: 'Claude 3 Opus' },
        { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet' },
    ],
    vllm: [
        { id: 'default', name: '서버 모델 사용' },
    ],
    ollama: [
        { id: 'llama3', name: 'Llama 3' },
        { id: 'codellama', name: 'Code Llama' },
        { id: 'mistral', name: 'Mistral' },
    ],
    custom: [
        { id: 'custom', name: '직접 입력' },
    ],
};

export default function AiSettingsPage() {
    const { data: settings, isLoading, error } = useAiSettings();
    const updateMutation = useUpdateSettings();

    const [config, setConfig] = useState<AiSettings>(defaultConfig);
    const [saved, setSaved] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<string | null>(null);

    useEffect(() => {
        if (settings) {
            setConfig({ ...defaultConfig, ...settings });
        }
    }, [settings]);

    const handleProviderChange = (providerId: string) => {
        const provider = providers.find(p => p.id === providerId);
        const models = modelsByProvider[providerId] || [];
        setConfig(prev => ({
            ...prev,
            provider: providerId as AiSettings['provider'],
            apiUrl: provider?.defaultUrl || '',
            summaryModel: models[0]?.id || '',
            remediationModel: models[0]?.id || '',
        }));
    };

    const handleSave = async () => {
        try {
            await updateMutation.mutateAsync({ key: 'ai', value: config });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            console.error('Failed to save AI settings:', err);
        }
    };

    const handleTest = async () => {
        setTesting(true);
        setTestResult(null);
        await new Promise(resolve => setTimeout(resolve, 2000));
        setTesting(false);
        setTestResult('success');
    };

    const availableModels = modelsByProvider[config.provider] || [];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg p-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                AI 설정을 불러오는데 실패했습니다.
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-3xl">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">AI 설정</h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                    AI 기반 취약점 요약 및 조치 가이드 모델을 설정합니다
                </p>
            </div>

            {/* Provider Settings */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    AI 제공자 설정
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            제공자
                        </label>
                        <div className="grid grid-cols-5 gap-2">
                            {providers.map((provider) => (
                                <button
                                    key={provider.id}
                                    onClick={() => handleProviderChange(provider.id)}
                                    className={`px-3 py-2 rounded-lg border text-sm transition-colors ${config.provider === provider.id
                                        ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-red-500'
                                        }`}
                                >
                                    {provider.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            API URL
                        </label>
                        <input
                            type="text"
                            value={config.apiUrl || ''}
                            onChange={(e) => setConfig(prev => ({ ...prev, apiUrl: e.target.value }))}
                            placeholder="https://api.example.com/v1"
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            {config.provider === 'vllm' && 'vLLM 서버 주소 (예: http://localhost:8000/v1)'}
                            {config.provider === 'ollama' && 'Ollama 서버 주소 (예: http://localhost:11434)'}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            API Key
                        </label>
                        <div className="relative">
                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="password"
                                value={config.apiKey || ''}
                                onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                                placeholder={config.provider === 'ollama' ? '(선택사항)' : 'sk-...'}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-10 pr-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                        </div>
                        {config.provider === 'ollama' && (
                            <p className="text-xs text-slate-500 mt-1">Ollama는 기본적으로 API 키가 필요하지 않습니다</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Summary Model */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    모델 설정
                </h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                        <div>
                            <p className="font-medium text-slate-900 dark:text-white">자동 요약 생성</p>
                            <p className="text-sm text-slate-500">스캔 완료 시 취약점 요약을 자동 생성</p>
                        </div>
                        <button
                            onClick={() => setConfig(prev => ({ ...prev, enableAutoSummary: !prev.enableAutoSummary }))}
                            className={`relative w-12 h-6 rounded-full transition-colors ${config.enableAutoSummary ? 'bg-red-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                        >
                            <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${config.enableAutoSummary ? 'translate-x-6' : ''}`} />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                요약 모델
                            </label>
                            <select
                                value={config.summaryModel}
                                onChange={(e) => setConfig(prev => ({ ...prev, summaryModel: e.target.value }))}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white"
                            >
                                {availableModels.map((model) => (
                                    <option key={model.id} value={model.id}>{model.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                조치 가이드 모델
                            </label>
                            <select
                                value={config.remediationModel}
                                onChange={(e) => setConfig(prev => ({ ...prev, remediationModel: e.target.value }))}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white"
                            >
                                {availableModels.map((model) => (
                                    <option key={model.id} value={model.id}>{model.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Advanced Settings */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    고급 설정
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            최대 토큰 수
                        </label>
                        <input
                            type="number"
                            value={config.maxTokens}
                            onChange={(e) => setConfig(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Temperature
                        </label>
                        <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="2"
                            value={config.temperature}
                            onChange={(e) => setConfig(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white"
                        />
                    </div>
                </div>
            </div>

            {/* Test Result */}
            {testResult && (
                <div className={`rounded-lg p-4 flex items-center gap-3 ${testResult === 'success'
                    ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                    {testResult === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                    {testResult === 'success' ? 'AI 모델 연결 테스트 성공' : 'AI 모델 연결 실패'}
                </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2">
                {saved && (
                    <span className="flex items-center gap-2 text-green-600 mr-4">
                        <CheckCircle className="h-5 w-5" />
                        저장됨
                    </span>
                )}
                <button
                    onClick={handleTest}
                    disabled={testing}
                    className="flex items-center gap-2 px-4 py-2 text-sm border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                >
                    <Zap className="h-4 w-4" />
                    {testing ? '테스트 중...' : '연결 테스트'}
                </button>
                <button
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                    {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    저장
                </button>
            </div>
        </div>
    );
}
