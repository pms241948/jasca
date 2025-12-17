'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, Mail, Lock, User, Loader2, CheckCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { authApi } from '@/lib/auth-api';

export default function RegisterPage() {
    const router = useRouter();
    const { setUser, setTokens, setError, setLoading, isLoading, error } = useAuthStore();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

    const validatePassword = (pwd: string) => {
        const errors: string[] = [];
        if (pwd.length < 8) errors.push('8자 이상이어야 합니다');
        if (!/[A-Z]/.test(pwd)) errors.push('대문자를 포함해야 합니다');
        if (!/[a-z]/.test(pwd)) errors.push('소문자를 포함해야 합니다');
        if (!/[0-9]/.test(pwd)) errors.push('숫자를 포함해야 합니다');
        setPasswordErrors(errors);
        return errors.length === 0;
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const pwd = e.target.value;
        setPassword(pwd);
        if (pwd) validatePassword(pwd);
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!validatePassword(password)) {
            return;
        }

        if (password !== confirmPassword) {
            setError('비밀번호가 일치하지 않습니다');
            return;
        }

        setLoading(true);

        try {
            const response = await authApi.register({ email, password, name });
            setTokens(response.accessToken, response.refreshToken);

            const payload = JSON.parse(atob(response.accessToken.split('.')[1]));
            setUser({
                id: payload.sub,
                email: payload.email,
                name: name,
                organizationId: payload.organizationId,
                roles: payload.roles || [],
            });

            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Registration failed');
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

                {/* Register Form */}
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8">
                    <h2 className="text-2xl font-semibold text-white mb-6 text-center">
                        회원가입
                    </h2>

                    {error && (
                        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleRegister} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                이름
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-slate-900/50 border border-slate-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="홍길동"
                                    required
                                />
                            </div>
                        </div>

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
                                    onChange={handlePasswordChange}
                                    className="w-full bg-slate-900/50 border border-slate-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                            {password && (
                                <div className="mt-2 space-y-1">
                                    {['8자 이상', '대문자 포함', '소문자 포함', '숫자 포함'].map((rule, idx) => {
                                        const checks = [
                                            password.length >= 8,
                                            /[A-Z]/.test(password),
                                            /[a-z]/.test(password),
                                            /[0-9]/.test(password),
                                        ];
                                        return (
                                            <div key={idx} className={`flex items-center gap-2 text-xs ${checks[idx] ? 'text-green-400' : 'text-slate-500'}`}>
                                                <CheckCircle className="h-3 w-3" />
                                                {rule}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                비밀번호 확인
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className={`w-full bg-slate-900/50 border rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${confirmPassword && password !== confirmPassword
                                            ? 'border-red-500'
                                            : 'border-slate-600'
                                        }`}
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                            {confirmPassword && password !== confirmPassword && (
                                <p className="mt-1 text-xs text-red-400">비밀번호가 일치하지 않습니다</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || passwordErrors.length > 0}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 mt-6"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    가입 중...
                                </>
                            ) : (
                                '회원가입'
                            )}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-slate-400 text-sm">
                        이미 계정이 있으신가요?{' '}
                        <Link href="/login" className="text-blue-400 hover:text-blue-300">
                            로그인
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
