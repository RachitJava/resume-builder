import { useState } from 'react';
import aiApi from '../api/aiApi';

export default function AiChat({ resume, onApplySuggestions }) {
  const [isOpen, setIsOpen] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
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
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all z-50 ${
          isOpen 
            ? 'bg-ink-800 text-ink-300 rotate-45' 
            : 'bg-gradient-to-r from-accent to-gray-500 text-white hover:shadow-accent/25 hover:shadow-xl'
        }`}
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 max-h-[70vh] bg-ink-900 border border-ink-700 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-ink-800 bg-gradient-to-r from-accent/10 to-gray-500/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-accent to-gray-500 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-ink-100">AI Resume Assistant</h3>
                <p className="text-xs text-ink-400">Paste a job description to optimize your resume</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {!suggestions ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-ink-300 mb-2">
                    Job Description
                  </label>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the job description here..."
                    className="w-full h-40 resize-none text-sm"
                  />
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleAnalyze}
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
                <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
                  <p className="text-sm text-ink-200">{suggestions.message}</p>
                </div>

                {/* Suggested Skills */}
                {suggestions.suggestedSkills?.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-ink-300">Suggested Skills</h4>
                      <button
                        onClick={handleApplySkills}
                        className="text-xs text-accent hover:text-accent-hover"
                      >
                        + Add all
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {suggestions.suggestedSkills.map((skill, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-ink-800 text-ink-300 rounded text-xs"
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
                      <h4 className="text-sm font-medium text-ink-300">Suggested Summary</h4>
                      <button
                        onClick={handleApplySummary}
                        className="text-xs text-accent hover:text-accent-hover"
                      >
                        Use this
                      </button>
                    </div>
                    <p className="text-xs text-ink-400 bg-ink-800/50 p-3 rounded-lg">
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
        </div>
      )}
    </>
  );
}

