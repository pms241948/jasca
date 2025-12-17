'use client';

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
} from 'recharts';
import { AlertTriangle, Shield, CheckCircle, Clock } from 'lucide-react';

// Mock data - would come from API
const severityData = [
    { name: 'Critical', value: 12, color: '#dc2626' },
    { name: 'High', value: 45, color: '#ea580c' },
    { name: 'Medium', value: 89, color: '#ca8a04' },
    { name: 'Low', value: 156, color: '#2563eb' },
];

const trendData = [
    { date: '12/11', critical: 15, high: 48, medium: 92 },
    { date: '12/12', critical: 14, high: 46, medium: 90 },
    { date: '12/13', critical: 13, high: 45, medium: 88 },
    { date: '12/14', critical: 12, high: 44, medium: 87 },
    { date: '12/15', critical: 12, high: 45, medium: 89 },
    { date: '12/16', critical: 11, high: 43, medium: 86 },
    { date: '12/17', critical: 12, high: 45, medium: 89 },
];

const projectData = [
    { name: 'backend-api', critical: 3, high: 12, medium: 28 },
    { name: 'frontend-web', critical: 2, high: 8, medium: 15 },
    { name: 'auth-service', critical: 4, high: 10, medium: 22 },
    { name: 'data-service', critical: 3, high: 15, medium: 24 },
];

export default function DashboardPage() {
    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="전체 취약점"
                    value="302"
                    change="-5%"
                    changeType="positive"
                    icon={<AlertTriangle className="h-6 w-6" />}
                    color="blue"
                />
                <StatCard
                    title="Critical"
                    value="12"
                    change="-2"
                    changeType="positive"
                    icon={<Shield className="h-6 w-6" />}
                    color="red"
                />
                <StatCard
                    title="해결됨"
                    value="156"
                    change="+23"
                    changeType="positive"
                    icon={<CheckCircle className="h-6 w-6" />}
                    color="green"
                />
                <StatCard
                    title="진행 중"
                    value="34"
                    change=""
                    changeType="neutral"
                    icon={<Clock className="h-6 w-6" />}
                    color="yellow"
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Severity Distribution */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                        심각도 분포
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={severityData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={2}
                                    dataKey="value"
                                >
                                    {severityData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-6 mt-4">
                        {severityData.map((item) => (
                            <div key={item.name} className="flex items-center gap-2">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: item.color }}
                                />
                                <span className="text-sm text-slate-600 dark:text-slate-300">
                                    {item.name}: {item.value}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Trend Chart */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                        취약점 추세
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="date" stroke="#64748b" />
                                <YAxis stroke="#64748b" />
                                <Tooltip />
                                <Line
                                    type="monotone"
                                    dataKey="critical"
                                    stroke="#dc2626"
                                    strokeWidth={2}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="high"
                                    stroke="#ea580c"
                                    strokeWidth={2}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="medium"
                                    stroke="#ca8a04"
                                    strokeWidth={2}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Projects Bar Chart */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                    프로젝트별 취약점
                </h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={projectData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="name" stroke="#64748b" />
                            <YAxis stroke="#64748b" />
                            <Tooltip />
                            <Bar dataKey="critical" stackId="a" fill="#dc2626" />
                            <Bar dataKey="high" stackId="a" fill="#ea580c" />
                            <Bar dataKey="medium" stackId="a" fill="#ca8a04" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

function StatCard({
    title,
    value,
    change,
    changeType,
    icon,
    color,
}: {
    title: string;
    value: string;
    change: string;
    changeType: 'positive' | 'negative' | 'neutral';
    icon: React.ReactNode;
    color: 'blue' | 'red' | 'green' | 'yellow';
}) {
    const colors = {
        blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
        red: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
        green: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400',
        yellow:
            'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{title}</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                        {value}
                    </p>
                    {change && (
                        <p
                            className={`text-sm mt-1 ${changeType === 'positive'
                                    ? 'text-green-600'
                                    : changeType === 'negative'
                                        ? 'text-red-600'
                                        : 'text-slate-500'
                                }`}
                        >
                            {change}
                        </p>
                    )}
                </div>
                <div className={`p-3 rounded-lg ${colors[color]}`}>{icon}</div>
            </div>
        </div>
    );
}
