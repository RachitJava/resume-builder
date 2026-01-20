import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Welcome() {
    const { user } = useAuth();

    const getFirstName = (email) => {
        if (!email) return 'User';
        const namePart = email.split('@')[0];
        const firstMatch = namePart.match(/[a-zA-Z]+/);
        const name = firstMatch ? firstMatch[0] : 'User';
        return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    };

    const features = [
        {
            id: 'resume',
            title: 'Resume Builder',
            description: 'Create professional, ATS-friendly resumes with AI-powered optimization',
            icon: '📄',
            gradient: 'from-blue-600 to-cyan-600',
            link: '/templates',
            stats: ['10+ Templates', 'AI Optimization', 'PDF Export'],
            color: 'blue'
        },
        {
            id: 'interview',
            title: 'AI Mock Interview',
            description: 'Practice with our AI interviewer and get instant, detailed feedback',
            icon: '🎯',
            gradient: 'from-blue-600 to-indigo-600',
            link: '/mock-interview',
            stats: ['Real-time AI', 'Instant Feedback', 'All Rounds'],
            color: 'blue'
        },
        {
            id: 'learning',
            title: 'Learning Center',
            description: 'Study and revise interview questions with flashcards and search',
            icon: '📚',
            gradient: 'from-green-600 to-teal-600',
            link: '/learning',
            stats: ['Question Banks', 'Flashcards', 'Smart Search'],
            color: 'green'
        }
    ];

    const benefits = [
        { icon: '⚡', title: 'Lightning Fast', desc: 'Generate resumes in seconds' },
        { icon: '🤖', title: 'AI Powered', desc: 'Smart suggestions & optimization' },
        { icon: '🎨', title: 'Beautiful Templates', desc: '10+ professional designs' },
        { icon: '📱', title: 'Mobile Ready', desc: 'Works on any device' },
        { icon: '🔒', title: 'Secure', desc: 'Your data is encrypted' },
        { icon: '💼', title: 'ATS Friendly', desc: 'Pass applicant tracking systems' }
    ];

    return (
        <div className="min-h-screen bg-white dark:bg-black">
            {/* Simple Background */}
            <div className="relative">

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 md:pt-20 pb-12 md:pb-16">
                    {/* Welcome Message */}
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full mb-6 shadow-sm">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Welcome back, {getFirstName(user?.email)}!
                            </span>
                        </div>

                        <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white mb-6 tracking-tight leading-tight">
                            Your Career
                            <span className="block text-blue-600 dark:text-blue-400">
                                Success Platform
                            </span>
                        </h1>

                        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
                            Build stunning resumes and ace your interviews with AI-powered tools designed for modern job seekers
                        </p>
                    </div>

                    {/* Main Feature Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-12 md:mb-16">
                        {features.map((feature) => (
                            <Link
                                key={feature.id}
                                to={feature.link}
                                className="group relative bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-2xl p-8 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 overflow-hidden"
                            >
                                {/* Gradient Background on Hover */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 dark:group-hover:opacity-10 transition-opacity duration-300`}></div>

                                {/* Content */}
                                <div className="relative">
                                    {/* Icon */}
                                    <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 rounded-2xl flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                                        {feature.icon}
                                    </div>

                                    {/* Title & Description */}
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-700 group-hover:to-blue-500 group-hover:bg-clip-text transition-all duration-300">
                                        {feature.title}
                                    </h2>
                                    <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                                        {feature.description}
                                    </p>

                                    {/* Stats */}
                                    <div className="flex flex-wrap gap-2 mb-6">
                                        {feature.stats.map((stat, idx) => (
                                            <span
                                                key={idx}
                                                className="px-3 py-1 bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 text-sm rounded-full border border-gray-200 dark:border-gray-800"
                                            >
                                                {stat}
                                            </span>
                                        ))}
                                    </div>

                                    {/* CTA Button */}
                                    <div className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold group-hover:gap-4 transition-all duration-300">
                                        <span>Get Started</span>
                                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </div>
                                </div>

                                {/* Corner Accent */}
                                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${feature.gradient} opacity-10 dark:opacity-5 blur-2xl rounded-full -mr-16 -mt-16`}></div>
                            </Link>
                        ))}
                    </div>

                    {/* Benefits Grid */}
                    <div className="border border-gray-100 dark:border-gray-800 rounded-3xl p-6 md:p-8 shadow-sm">
                        <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
                            Why Choose DecisiveML?
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
                            {benefits.map((benefit, idx) => (
                                <div
                                    key={idx}
                                    className="text-center group hover:scale-105 transition-transform duration-300"
                                >
                                    <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 rounded-xl flex items-center justify-center text-2xl mb-3 mx-auto group-hover:shadow-lg transition-shadow">
                                        {benefit.icon}
                                    </div>
                                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                                        {benefit.title}
                                    </h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {benefit.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mt-12">
                        {[
                            { label: 'Resumes Created', value: '10K+', icon: '📄' },
                            { label: 'Interviews Practiced', value: '5K+', icon: '🎯' },
                            { label: 'Success Rate', value: '95%', icon: '⭐' }
                        ].map((stat, idx) => (
                            <div
                                key={idx}
                                className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl p-6 text-center hover:shadow-lg transition-shadow"
                            >
                                <div className="text-3xl mb-2">{stat.icon}</div>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                                    {stat.value}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
