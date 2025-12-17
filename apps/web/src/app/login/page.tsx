'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, Mail, Lock, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { authApi } from '@/lib/auth-api';

export default function LoginPage() {
    const router = useRouter();
    const { setUser, setTokens, setMfaRequired, setError, setLoading, isLoading, error, requiresMfa, mfaToken } = useAuthStore();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [mfaCode, setMfaCode] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const response = await authApi.login({ email, password });

            if (response.requiresMfa && response.mfaToken) {
                setMfaRequired(response.mfaToken);
                setLoading(false);
                return;
            }

            setTokens(response.accessToken, response.refreshToken);

            // Decode JWT to get user info (simple decode, not verification)
            const payload = JSON.parse(atob(response.accessToken.split('.')[1]));
            setUser({
                id: payload.sub,
                email: payload.email,
                name: payload.email.split('@')[0], // Temporary name from email
                organizationId: payload.organizationId,
                roles: payload.roles || [],
            });

            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleMfaVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!mfaToken) return;

        setError(null);
        setLoading(true);

        try {
            const response = await authApi.verifyMfa({ mfaToken, code: mfaCode });
            setTokens(response.accessToken, response.refreshToken);

            const payload = JSON.parse(atob(response.accessToken.split('.')[1]));
            setUser({
                id: payload.sub,
                email: payload.email,
                name: payload.email.split('@')[0],
                organizationId: payload.organizationId,
                roles: payload.roles || [],
            });

            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message || 'MFA verification failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-3 mb-4">
                        <Shield className="h-12 w-12 text-blue-400" />
                        <span className="text-3xl font-bold text-white">JASCA</span>
                    </div>
                    <p className="text-slate-400">취약점 관리 시스템</p>
                </div>

                {/* Login Form */}
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8">
                    <h2 className="text-2xl font-semibold text-white mb-6 text-center">
                        {requiresMfa ? 'MFA 인증' : '로그인'}
                    </h2>

                    {error && (
                        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
                            {error}
                        </div>
                    )}

                    {!requiresMfa ? (
                        <form onSubmit={handleLogin} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    이메일
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-slate-900/50 border border-slate-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="name@company.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    비밀번호
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-slate-900/50 border border-slate-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        로그인 중...
                                    </>
                                ) : (
                                    '로그인'
                                )}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleMfaVerify} className="space-y-5">
                            <p className="text-slate-400 text-sm text-center mb-4">
                                Authenticator 앱에서 6자리 인증 코드를 입력하세요
                            </p>
                            <div>
                                <input
                                    type="text"
                                    value={mfaCode}
                                    onChange={(e) => setMfaCode(e.target.value)}
                                    className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-3 text-white text-center text-2xl tracking-widest placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="000000"
                                    maxLength={6}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        확인 중...
                                    </>
                                ) : (
                                    '인증'
                                )}
                            </button>
                        </form>
                    )}

                    {!requiresMfa && (
                        <p className="mt-6 text-center text-slate-400 text-sm">
                            계정이 없으신가요?{' '}
                            <Link href="/register" className="text-blue-400 hover:text-blue-300">
                                회원가입
                            </Link>
                        </p>
                    )}
                </div>

                {/* Test accounts hint */}
                <div className="mt-6 text-center text-slate-500 text-xs">
                    <p>테스트 계정: admin@acme.com / admin123</p>
                </div>
            </div>
        </div>
    );
}
