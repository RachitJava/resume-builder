import { useState } from 'react';
import aiApi from '../api/aiApi';

export default function AiOptimizer({ resume, onApplySuggestions }) {
    const [activeTab, setActiveTab] = useState('job-match'); // 'job-match' or 'optimize'
    const [jobDescription, setJobDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [optimizing, setOptimizing] = useState(false);
    const [suggestions, setSuggestions] = useState(null);
    const [optimizedResume, setOptimizedResume] = useState(null);
    const [error, setError] = useState('');
    const [showComparison, setShowComparison] = useState(false);

    const handleJobMatch = async () => {
        if (!jobDescription.trim()) {
            setError('Please paste a job description');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const result = await aiApi.analyzeJob(jobDescription, resume);
            setSuggestions(result);
        } catch (err) {
            setError('Failed to analyze. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleOptimizeForOnePage = async () => {
        setOptimizing(true);
        setError('');

        try {
            // Call AI to optimize resume for one page
            const result = await aiApi.optimizeResume(resume, {
                goal: 'one-page',
                preserveImpact: true,
                marketFocused: true
            });

            setOptimizedResume(result);
            setShowComparison(true);
        } catch (err) {
            setError('Failed to optimize. Please try again.');
            console.error(err);
        } finally {
            setOptimizing(false);
        }
    };

    const handleApplyOptimized = () => {
        if (optimizedResume) {
            onApplySuggestions(optimizedResume);
            setOptimizedResume(null);
            setShowComparison(false);
        }
    };

    const handleApplySkills = () => {
        if (suggestions?.suggestedSkills) {
            const currentSkills = resume.skills || [];
            const newSkills = [...new Set([...currentSkills, ...suggestions.suggestedSkills])];
            onApplySuggestions({ skills: newSkills });
        }
    };

    const handleApplySummary = () => {
        if (suggestions?.suggestedSummary) {
            onApplySuggestions({ summary: suggestions.suggestedSummary });
        }
    };

    const handleApplyAll = () => {
        const updates = {};
        if (suggestions?.suggestedSkills) {
            const currentSkills = resume.skills || [];
            updates.skills = [...new Set([...currentSkills, ...suggestions.suggestedSkills])];
        }
        if (suggestions?.suggestedSummary) {
            updates.summary = suggestions.suggestedSummary;
        }
        onApplySuggestions(updates);
        setSuggestions(null);
        setJobDescription('');
    };

    return (
        <div id="ai-optimizer" className="bg-white dark:bg-[#18181B] border border-gray-300 dark:border-gray-700 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-black/10 to-gray-500/10">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-black to-gray-500 flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="font-display text-xl font-semibold text-gray-900 dark:text-gray-50">AI Optimizer</h3>
                        <p className="text-sm text-gray-700 dark:text-gray-300 dark:text-gray-400">Optimize your resume for maximum impact and ATS compatibility</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('optimize')}
                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-smooth ${activeTab === 'optimize'
                            ? 'bg-black dark:bg-white text-white'
                            : 'bg-gray-50 dark:bg-[#27272A] text-gray-700 dark:text-gray-300 dark:text-gray-400 hover:text-gray-900 dark:text-gray-100'
                            }`}
                        data-action={activeTab === 'optimize' ? 'optimize' : ''}
                    >
                        <svg className="w-4 h-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        One-Page Optimizer
                    </button>
                    <button
                        onClick={() => setActiveTab('job-match')}
                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-smooth ${activeTab === 'job-match'
                            ? 'bg-black dark:bg-white text-white'
                            : 'bg-gray-50 dark:bg-[#27272A] text-gray-700 dark:text-gray-300 dark:text-gray-400 hover:text-gray-900 dark:text-gray-100'
                            }`}
                    >
                        <svg className="w-4 h-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Job Match
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-6">
                {activeTab === 'optimize' ? (
                    <div className="space-y-4">
                        {!showComparison ? (
                            <>
                                <div className="p-4 bg-gray-500/10 border border-gray-500/30 rounded-lg">
                                    <h4 className="font-semibold text-gray-700 dark:text-gray-300 dark:text-gray-400 mb-2 flex items-center gap-2">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        What this does
                                    </h4>
                                    <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1 ml-7">
                                        <li>• Removes redundant or less impactful content</li>
                                        <li>• Rephrases bullet points for clarity and impact</li>
                                        <li>• Optimizes for ATS (Applicant Tracking Systems)</li>
                                        <li>• Ensures content fits on one page</li>
                                        <li>• Maintains your key achievements and skills</li>
                                    </ul>
                                </div>

                                {error && (
                                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                        {error}
                                    </div>
                                )}

                                <button
                                    onClick={handleOptimizeForOnePage}
                                    disabled={optimizing}
                                    className="w-full btn btn-primary"
                                    data-action="optimize"
                                >
                                    {optimizing ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Optimizing your resume...
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                            Optimize for One Page
                                        </span>
                                    )}
                                </button>
                            </>
                        ) : (
                            <div className="space-y-4">
                                {/* Before/After Comparison */}
                                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                                    <h4 className="font-semibold text-green-400 mb-2">✓ Optimization Complete!</h4>
                                    <p className="text-sm text-green-300 mb-2">
                                        {optimizedResume?.message}
                                    </p>
                                    {optimizedResume?.changes && optimizedResume.changes.length > 0 && (
                                        <div className="mt-3">
                                            <p className="text-xs font-semibold text-green-400 mb-1">Changes Applied:</p>
                                            <ul className="text-xs text-green-300 space-y-1">
                                                {optimizedResume.changes.map((change, idx) => (
                                                    <li key={idx}>• {change}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Before */}
                                    <div className="space-y-3">
                                        <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300 dark:text-gray-400 mb-2 uppercase flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                            Before
                                        </h5>
                                        <div className="bg-gray-50 dark:bg-[#27272A] p-4 rounded-lg text-xs text-gray-700 dark:text-gray-300 space-y-3 max-h-96 overflow-y-auto">
                                            <div>
                                                <strong className="text-gray-900 dark:text-gray-100">Template:</strong>
                                                <p className="text-gray-700 dark:text-gray-300 dark:text-gray-400 mt-1 capitalize">{resume.template}</p>
                                            </div>
                                            <div>
                                                <strong className="text-gray-900 dark:text-gray-100">Summary Length:</strong>
                                                <p className="text-gray-700 dark:text-gray-300 dark:text-gray-400 mt-1">{resume.summary?.length || 0} characters</p>
                                            </div>
                                            <div>
                                                <strong className="text-gray-900 dark:text-gray-100">Experience:</strong>
                                                <p className="text-gray-700 dark:text-gray-300 dark:text-gray-400 mt-1">
                                                    {resume.experience?.length || 0} positions, {' '}
                                                    {resume.experience?.reduce((sum, exp) => sum + (exp.highlights?.length || 0), 0) || 0} bullets
                                                </p>
                                            </div>
                                            <div>
                                                <strong className="text-gray-900 dark:text-gray-100">Skills:</strong>
                                                <p className="text-gray-700 dark:text-gray-300 dark:text-gray-400 mt-1">{resume.skills?.length || 0} skills</p>
                                            </div>
                                            <div>
                                                <strong className="text-gray-900 dark:text-gray-100">Projects:</strong>
                                                <p className="text-gray-700 dark:text-gray-300 dark:text-gray-400 mt-1">{resume.projects?.length || 0} projects</p>
                                            </div>
                                            <div>
                                                <strong className="text-gray-900 dark:text-gray-100">Certifications:</strong>
                                                <p className="text-gray-700 dark:text-gray-300 dark:text-gray-400 mt-1">{resume.certifications?.length || 0} certifications</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* After */}
                                    <div className="space-y-3">
                                        <h5 className="text-xs font-semibold text-black dark:text-white mb-2 uppercase flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                            After (Optimized)
                                        </h5>
                                        <div className="bg-black dark:bg-white/10 p-4 rounded-lg text-xs text-white dark:text-gray-100 space-y-3 max-h-96 overflow-y-auto border border-black dark:border-white/30">
                                            <div className="border-b border-white/20 pb-2 mb-2">
                                                <strong className="text-white block mb-1">Template:</strong>
                                                <p className="text-gray-300 capitalize">{optimizedResume?.template}</p>
                                            </div>
                                            <div className="border-b border-white/20 pb-2 mb-2">
                                                <strong className="text-white block mb-1">Summary Length:</strong>
                                                <p className="text-gray-300">
                                                    {optimizedResume?.summary?.length || 0} characters
                                                    {resume.summary && optimizedResume?.summary && (
                                                        <span className="text-green-400 ml-2 font-medium">
                                                            ({((1 - optimizedResume.summary.length / resume.summary.length) * 100).toFixed(0)}% shorter)
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                            <div className="border-b border-white/20 pb-2 mb-2">
                                                <strong className="text-white block mb-1">Experience:</strong>
                                                <p className="text-gray-300">
                                                    {optimizedResume?.experience?.length || 0} positions, {' '}
                                                    {optimizedResume?.experience?.reduce((sum, exp) => sum + (exp.highlights?.length || 0), 0) || 0} bullets
                                                </p>
                                            </div>
                                            <div className="border-b border-white/20 pb-2 mb-2">
                                                <strong className="text-white block mb-1">Skills:</strong>
                                                <p className="text-gray-300">{optimizedResume?.skills?.length || 0} skills</p>
                                            </div>
                                            <div className="border-b border-white/20 pb-2 mb-2">
                                                <strong className="text-white block mb-1">Projects:</strong>
                                                <p className="text-gray-300">{optimizedResume?.projects?.length || 0} projects</p>
                                            </div>
                                            <div>
                                                <strong className="text-white block mb-1">Certifications:</strong>
                                                <p className="text-gray-300">{optimizedResume?.certifications?.length || 0} certifications</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => { setOptimizedResume(null); setShowComparison(false); }}
                                        className="flex-1 btn btn-secondary text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleApplyOptimized}
                                        className="flex-1 btn btn-primary text-sm"
                                    >
                                        <svg className="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Apply Optimized Version
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {!suggestions ? (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Job Description
                                    </label>
                                    <textarea
                                        value={jobDescription}
                                        onChange={(e) => setJobDescription(e.target.value)}
                                        placeholder="Paste the job description here to get tailored suggestions..."
                                        className="w-full h-40 resize-none text-sm"
                                    />
                                </div>

                                {error && (
                                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                        {error}
                                    </div>
                                )}

                                <button
                                    onClick={handleJobMatch}
                                    disabled={loading || !jobDescription.trim()}
                                    className="w-full btn btn-primary"
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Analyzing...
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                            Analyze & Get Suggestions
                                        </span>
                                    )}
                                </button>
                            </>
                        ) : (
                            <div className="space-y-4">
                                {/* Message */}
                                <div className="p-3 rounded-lg bg-black dark:bg-white/10 border border-black dark:border-white/20">
                                    <p className="text-sm text-gray-900 dark:text-gray-100">{suggestions.message}</p>
                                </div>

                                {/* Suggested Skills */}
                                {suggestions.suggestedSkills?.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Suggested Skills</h4>
                                            <button
                                                onClick={handleApplySkills}
                                                className="text-xs text-black dark:text-white hover:text-black dark:text-white-hover"
                                            >
                                                + Add all
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {suggestions.suggestedSkills.map((skill, i) => (
                                                <span
                                                    key={i}
                                                    className="px-2 py-1 bg-gray-100 dark:bg-[#27272A] text-gray-700 dark:text-gray-300 rounded text-xs"
                                                >
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Suggested Summary */}
                                {suggestions.suggestedSummary && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Suggested Summary</h4>
                                            <button
                                                onClick={handleApplySummary}
                                                className="text-xs text-black dark:text-white hover:text-black dark:text-white-hover"
                                            >
                                                Use this
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-700 dark:text-gray-300 dark:text-gray-400 bg-gray-50 dark:bg-[#27272A] p-3 rounded-lg">
                                            {suggestions.suggestedSummary}
                                        </p>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => { setSuggestions(null); setJobDescription(''); }}
                                        className="flex-1 btn btn-secondary text-sm"
                                    >
                                        Try Another
                                    </button>
                                    <button
                                        onClick={handleApplyAll}
                                        className="flex-1 btn btn-primary text-sm"
                                    >
                                        Apply All
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
