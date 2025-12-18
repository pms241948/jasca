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
    RefreshCw,
    Edit3,
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

const staticModelsByProvider: Record<string, { id: string; name: string }[]> = {
    openai: [
        { id: 'gpt-4', name: 'GPT-4' },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
    ],
    anthropic: [
        { id: 'claude-3-opus', name: 'Claude 3 Opus' },
        { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet' },
    ],
    vllm: [],
    ollama: [],
    custom: [
        { id: 'custom', name: '직접 입력' },
    ],
};

interface DynamicModel {
    id: string;
    name: string;
    size?: number;
    modifiedAt?: string;
}

export default function AiSettingsPage() {
    const { data: settings, isLoading, error } = useAiSettings();
    const updateMutation = useUpdateSettings();

    const [config, setConfig] = useState<AiSettings>(defaultConfig);
    const [saved, setSaved] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

    // Dynamic models from server
    const [ollamaModels, setOllamaModels] = useState<DynamicModel[]>([]);
    const [vllmModels, setVllmModels] = useState<DynamicModel[]>([]);
    const [fetchingModels, setFetchingModels] = useState(false);

    // Custom model input for vLLM
    const [customVllmModel, setCustomVllmModel] = useState('');
    const [useCustomVllmModel, setUseCustomVllmModel] = useState(false);

    useEffect(() => {
        if (settings) {
            setConfig({ ...defaultConfig, ...settings });
            // If vLLM is selected and summaryModel doesn't match known models, it's a custom input
            if (settings.provider === 'vllm' && settings.summaryModel) {
                setCustomVllmModel(settings.summaryModel);
                setUseCustomVllmModel(true);
            }
        }
    }, [settings]);

    const handleProviderChange = (providerId: string) => {
        const provider = providers.find(p => p.id === providerId);
        const models = staticModelsByProvider[providerId] || [];
        setConfig(prev => ({
            ...prev,
            provider: providerId as AiSettings['provider'],
            apiUrl: provider?.defaultUrl || '',
            summaryModel: models[0]?.id || '',
            remediationModel: models[0]?.id || '',
        }));
        // Reset dynamic models when changing provider
        setOllamaModels([]);
        setVllmModels([]);
        setTestResult(null);
        setCustomVllmModel('');
        setUseCustomVllmModel(false);
    };

    const handleSave = async () => {
        try {
            // For vLLM with custom model input, use the custom model name
            const configToSave = { ...config };
            if (config.provider === 'vllm' && useCustomVllmModel && customVllmModel) {
                configToSave.summaryModel = customVllmModel;
                configToSave.remediationModel = customVllmModel;
            }

            await updateMutation.mutateAsync({ key: 'ai', value: configToSave });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            console.error('Failed to save AI settings:', err);
        }
    };

    const handleTest = async () => {
        setTesting(true);
        setTestResult(null);

        try {
            const response = await fetch('/api/ai/test-connection', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    provider: config.provider,
                    apiUrl: config.apiUrl,
                    apiKey: config.apiKey,
                }),
            });

            const result = await response.json();
            setTestResult({
                success: result.success,
                message: result.message || (result.success ? '연결 성공' : '연결 실패'),
            });

            // If Ollama connection is successful, fetch models
            if (result.success && config.provider === 'ollama') {
                await fetchOllamaModels();
            }
            // If vLLM connection is successful, fetch models
            if (result.success && config.provider === 'vllm') {
                await fetchVllmModels();
            }
        } catch (err) {
            setTestResult({
                success: false,
                message: err instanceof Error ? err.message : '연결 테스트 실패',
            });
        } finally {
            setTesting(false);
        }
    };

    const fetchOllamaModels = async () => {
        if (!config.apiUrl) return;

        setFetchingModels(true);
        try {
            const response = await fetch(`/api/ai/ollama/models?apiUrl=${encodeURIComponent(config.apiUrl)}`, {
                credentials: 'include',
            });
            const result = await response.json();

            if (result.success && result.models) {
                setOllamaModels(result.models);
                // Auto-select first model if none selected
                if (result.models.length > 0 && !config.summaryModel) {
                    setConfig(prev => ({
                        ...prev,
                        summaryModel: result.models[0].id,
                        remediationModel: result.models[0].id,
                    }));
                }
            }
        } catch (err) {
            console.error('Failed to fetch Ollama models:', err);
        } finally {
            setFetchingModels(false);
        }
    };

    const fetchVllmModels = async () => {
        if (!config.apiUrl) return;

        setFetchingModels(true);
        try {
            const url = new URL('/api/ai/vllm/models', window.location.origin);
            url.searchParams.set('apiUrl', config.apiUrl);
            if (config.apiKey) {
                url.searchParams.set('apiKey', config.apiKey);
            }

            const response = await fetch(url.toString(), {
                credentials: 'include',
            });
            const result = await response.json();

            if (result.success && result.models) {
                setVllmModels(result.models);
                // If models are found, allow selection
                if (result.models.length > 0) {
                    setUseCustomVllmModel(false);
                    if (!config.summaryModel) {
                        setConfig(prev => ({
                            ...prev,
                            summaryModel: result.models[0].id,
                            remediationModel: result.models[0].id,
                        }));
                    }
                }
            }
        } catch (err) {
            console.error('Failed to fetch vLLM models:', err);
        } finally {
            setFetchingModels(false);
        }
    };

    // Determine available models based on provider
    const getAvailableModels = () => {
        if (config.provider === 'ollama' && ollamaModels.length > 0) {
            return ollamaModels;
        }
        if (config.provider === 'vllm' && vllmModels.length > 0 && !useCustomVllmModel) {
            return vllmModels;
        }
        return staticModelsByProvider[config.provider] || [];
    };

    const availableModels = getAvailableModels();

    // Check if current provider needs model fetch
    const needsModelFetch = config.provider === 'ollama' || config.provider === 'vllm';
    const hasModels = config.provider === 'ollama' ? ollamaModels.length > 0 : vllmModels.length > 0;

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

                    {/* Connection test button with model fetch */}
                    <div className="flex gap-2">
                        <button
                            onClick={handleTest}
                            disabled={testing || !config.apiUrl}
                            className="flex items-center gap-2 px-4 py-2 text-sm border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                        >
                            {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                            {testing ? '테스트 중...' : '연결 테스트'}
                        </button>

                        {needsModelFetch && hasModels && (
                            <button
                                onClick={config.provider === 'ollama' ? fetchOllamaModels : fetchVllmModels}
                                disabled={fetchingModels || !config.apiUrl}
                                className="flex items-center gap-2 px-4 py-2 text-sm border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                            >
                                {fetchingModels ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                모델 새로고침
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Test Result */}
            {testResult && (
                <div className={`rounded-lg p-4 flex items-center gap-3 ${testResult.success
                    ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                    {testResult.success ? <CheckCircle className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                    {testResult.message}
                </div>
            )}

            {/* Model Settings */}
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

                    {/* Model selection notice for Ollama/vLLM */}
                    {needsModelFetch && !hasModels && (
                        <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-lg p-4 flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                            <span>
                                {config.provider === 'ollama'
                                    ? '먼저 연결 테스트를 실행하여 Ollama 서버에서 사용 가능한 모델 목록을 가져오세요.'
                                    : '먼저 연결 테스트를 실행하여 vLLM 서버에서 사용 가능한 모델을 확인하거나, 아래에서 모델명을 직접 입력하세요.'
                                }
                            </span>
                        </div>
                    )}

                    {/* vLLM custom model input option */}
                    {config.provider === 'vllm' && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="useCustomVllmModel"
                                    checked={useCustomVllmModel}
                                    onChange={(e) => setUseCustomVllmModel(e.target.checked)}
                                    className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                                />
                                <label htmlFor="useCustomVllmModel" className="text-sm text-slate-700 dark:text-slate-300">
                                    모델명 직접 입력
                                </label>
                            </div>

                            {useCustomVllmModel && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        vLLM 모델명
                                    </label>
                                    <div className="relative">
                                        <Edit3 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <input
                                            type="text"
                                            value={customVllmModel}
                                            onChange={(e) => setCustomVllmModel(e.target.value)}
                                            placeholder="예: meta-llama/Llama-2-7b-chat-hf"
                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-10 pr-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">
                                        vLLM 서버에서 사용 중인 모델의 이름을 정확히 입력하세요
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Model selection dropdowns */}
                    {(availableModels.length > 0 || (!needsModelFetch)) && !useCustomVllmModel && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    요약 모델
                                </label>
                                <select
                                    value={config.summaryModel}
                                    onChange={(e) => setConfig(prev => ({ ...prev, summaryModel: e.target.value }))}
                                    disabled={needsModelFetch && availableModels.length === 0}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white disabled:opacity-50"
                                >
                                    {availableModels.length === 0 ? (
                                        <option value="">모델을 먼저 불러오세요</option>
                                    ) : (
                                        availableModels.map((model) => (
                                            <option key={model.id} value={model.id}>{model.name}</option>
                                        ))
                                    )}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    조치 가이드 모델
                                </label>
                                <select
                                    value={config.remediationModel}
                                    onChange={(e) => setConfig(prev => ({ ...prev, remediationModel: e.target.value }))}
                                    disabled={needsModelFetch && availableModels.length === 0}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white disabled:opacity-50"
                                >
                                    {availableModels.length === 0 ? (
                                        <option value="">모델을 먼저 불러오세요</option>
                                    ) : (
                                        availableModels.map((model) => (
                                            <option key={model.id} value={model.id}>{model.name}</option>
                                        ))
                                    )}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Show fetched Ollama models info */}
                    {config.provider === 'ollama' && ollamaModels.length > 0 && (
                        <div className="text-xs text-slate-500 mt-2">
                            {ollamaModels.length}개 모델 발견: {ollamaModels.map(m => m.name).join(', ')}
                        </div>
                    )}
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

            {/* Actions */}
            <div className="flex justify-end gap-2">
                {saved && (
                    <span className="flex items-center gap-2 text-green-600 mr-4">
                        <CheckCircle className="h-5 w-5" />
                        저장됨
                    </span>
                )}
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
