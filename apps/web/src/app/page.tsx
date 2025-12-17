import Link from 'next/link';
import {
    Shield,
    BarChart3,
    FileSearch,
    Settings,
    AlertTriangle,
} from 'lucide-react';

export default function HomePage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Header */}
            <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Shield className="h-8 w-8 text-blue-400" />
                        <span className="text-2xl font-bold text-white">JASCA</span>
                    </div>
                    <nav className="flex items-center gap-6">
                        <Link
                            href="/login"
                            className="text-slate-300 hover:text-white transition-colors"
                        >
                            로그인
                        </Link>
                        <Link
                            href="/register"
                            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                            시작하기
                        </Link>
                    </nav>
                </div>
            </header>

            {/* Hero Section */}
            <main className="container mx-auto px-6 py-20">
                <div className="text-center max-w-4xl mx-auto">
                    <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
                        조직 전체의
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                            취약점을 한눈에
                        </span>
                    </h1>
                    <p className="text-xl text-slate-300 mb-10">
                        Trivy 스캔 결과를 중앙에서 수집, 분석, 추적하여
                        <br />
                        체계적인 보안 취약점 관리를 실현하세요.
                    </p>
                    <div className="flex justify-center gap-4">
                        <Link
                            href="/register"
                            className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-lg text-lg font-medium transition-colors"
                        >
                            무료로 시작하기
                        </Link>
                        <Link
                            href="/docs"
                            className="border border-slate-600 hover:border-slate-500 text-white px-8 py-3 rounded-lg text-lg font-medium transition-colors"
                        >
                            문서 보기
                        </Link>
                    </div>
                </div>

                {/* Features */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20">
                    <FeatureCard
                        icon={<FileSearch className="h-8 w-8" />}
                        title="스캔 결과 수집"
                        description="Trivy JSON/SARIF 결과를 CI/CD와 연동하여 자동 수집"
                    />
                    <FeatureCard
                        icon={<AlertTriangle className="h-8 w-8" />}
                        title="정책 기반 차단"
                        description="심각도별 배포 차단 정책으로 보안 컴플라이언스 준수"
                    />
                    <FeatureCard
                        icon={<BarChart3 className="h-8 w-8" />}
                        title="대시보드 분석"
                        description="프로젝트별 취약점 현황과 추세를 실시간 모니터링"
                    />
                    <FeatureCard
                        icon={<Settings className="h-8 w-8" />}
                        title="워크플로우 관리"
                        description="담당자 지정, 상태 추적, 예외 승인 워크플로우"
                    />
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-700/50 py-8 mt-20">
                <div className="container mx-auto px-6 text-center text-slate-500">
                    <p>© 2024 JASCA. 모든 권리 보유.</p>
                </div>
            </footer>
        </div>
    );
}

function FeatureCard({
    icon,
    title,
    description,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
}) {
    return (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-blue-500/50 transition-colors">
            <div className="text-blue-400 mb-4">{icon}</div>
            <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
            <p className="text-slate-400 text-sm">{description}</p>
        </div>
    );
}
