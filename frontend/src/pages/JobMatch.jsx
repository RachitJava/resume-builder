import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import jobMatchApi from '../api/jobMatchApi';

export default function JobMatch() {
  const [jobDescription, setJobDescription] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleAnalyze = async () => {
    if (!jobDescription.trim()) {
      setError('Please paste a job description');
      return;
    }

    setLoading(true);
    setError('');
    setAnalysis(null);

    try {
      const result = await jobMatchApi.analyzeJob({
        jobDescription,
        jobTitle: jobTitle || null,
        company: company || null,
      });
      setAnalysis(result);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to analyze job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUseResume = () => {
    if (analysis?.tailoredResume) {
      navigate('/editor', { 
        state: { 
          sample: analysis.tailoredResume, 
          useSample: true,
          fromJobMatch: true 
        } 
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-full">
          <span className="text-2xl">🎯</span>
          <span className="text-accent font-semibold">AI Job Match</span>
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-ink-100">
          Create Resume from Job Description
        </h1>
        <p className="text-ink-400 max-w-2xl mx-auto">
          Paste any job posting and our AI will analyze the requirements and create a 
          perfectly tailored, ATS-optimized resume with the right skills and keywords.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-4">
          <div className="bg-ink-900/50 border border-ink-800 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-ink-100 flex items-center gap-2">
              <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Job Details
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-ink-400 mb-1">Job Title (optional)</label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g., Senior Software Engineer"
                  className="w-full text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-ink-400 mb-1">Company (optional)</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g., Google"
                  className="w-full text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-ink-400 mb-1">
                Job Description <span className="text-red-400">*</span>
              </label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the complete job description here...

Example:
We are looking for a Senior Software Engineer to join our team. 

Requirements:
- 5+ years of experience with Java, Python, or Go
- Experience with cloud platforms (AWS, GCP, Azure)
- Strong understanding of microservices architecture
- Excellent problem-solving skills

Responsibilities:
- Design and implement scalable backend services
- Collaborate with cross-functional teams
- Mentor junior engineers"
                rows={12}
                className="w-full resize-none"
              />
            </div>

            <button
              onClick={handleAnalyze}
              disabled={loading || !jobDescription.trim()}
              className="w-full btn btn-primary flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Analyzing Job & Creating Resume...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Analyze & Create Resume
                </>
              )}
            </button>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}
          </div>

          {/* Tips */}
          <div className="bg-ink-900/30 border border-ink-800/50 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-ink-300 mb-2">💡 Tips for Best Results</h3>
            <ul className="text-xs text-ink-500 space-y-1">
              <li>• Copy the entire job description including requirements & responsibilities</li>
              <li>• Include technical skills, tools, and technologies mentioned</li>
              <li>• The more detail you provide, the better the tailored resume</li>
              <li>• Works with any job posting from LinkedIn, Indeed, company websites, etc.</li>
            </ul>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-4">
          {analysis ? (
            <>
              {/* Job Analysis Card */}
              <div className="bg-ink-900/50 border border-ink-800 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-ink-100 flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Job Analysis
                  </h2>
                  {analysis.matchScore > 0 && (
                    <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      analysis.matchScore >= 70 ? 'bg-green-500/20 text-green-400' :
                      analysis.matchScore >= 40 ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {analysis.matchScore}% Match
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-ink-500 uppercase tracking-wide">Position</span>
                    <p className="text-ink-200 font-medium">{analysis.jobTitle}</p>
                    {analysis.company && <p className="text-ink-400 text-sm">{analysis.company}</p>}
                  </div>

                  <div>
                    <span className="text-xs text-ink-500 uppercase tracking-wide">Experience Level</span>
                    <p className="text-ink-200">{analysis.experienceLevel}</p>
                  </div>

                  <div>
                    <span className="text-xs text-ink-500 uppercase tracking-wide">Required Skills</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {analysis.requiredSkills?.map((skill, i) => (
                        <span key={i} className="px-2 py-1 bg-red-500/10 text-red-400 rounded text-xs">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {analysis.preferredSkills?.length > 0 && (
                    <div>
                      <span className="text-xs text-ink-500 uppercase tracking-wide">Preferred Skills</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {analysis.preferredSkills?.map((skill, i) => (
                          <span key={i} className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded text-xs">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <span className="text-xs text-ink-500 uppercase tracking-wide">ATS Keywords</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {analysis.keywords?.map((keyword, i) => (
                        <span key={i} className="px-2 py-1 bg-accent/10 text-accent rounded text-xs">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Suggestions Card */}
              {analysis.suggestions?.length > 0 && (
                <div className="bg-ink-900/50 border border-ink-800 rounded-xl p-6">
                  <h3 className="text-sm font-semibold text-ink-200 mb-3 flex items-center gap-2">
                    <span className="text-lg">💡</span> Resume Tips
                  </h3>
                  <ul className="space-y-2">
                    {analysis.suggestions.map((suggestion, i) => (
                      <li key={i} className="text-sm text-ink-400 flex items-start gap-2">
                        <span className="text-accent mt-1">→</span>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tailored Resume Preview */}
              {analysis.tailoredResume && (
                <div className="bg-gradient-to-br from-accent/10 to-purple-500/10 border border-accent/30 rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-ink-100 flex items-center gap-2">
                      <span className="text-2xl">✨</span>
                      Tailored Resume Ready!
                    </h3>
                  </div>

                  <div className="bg-ink-900/50 rounded-lg p-4 space-y-2">
                    <p className="text-ink-200 font-medium">{analysis.tailoredResume.fullName}</p>
                    <p className="text-ink-400 text-sm line-clamp-3">{analysis.tailoredResume.summary}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {analysis.tailoredResume.skills?.slice(0, 8).map((skill, i) => (
                        <span key={i} className="px-2 py-0.5 bg-ink-800 text-ink-300 rounded text-xs">
                          {skill}
                        </span>
                      ))}
                      {analysis.tailoredResume.skills?.length > 8 && (
                        <span className="text-xs text-ink-500">+{analysis.tailoredResume.skills.length - 8} more</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={handleUseResume}
                    className="w-full btn btn-primary flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit & Customize Resume
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="bg-ink-900/30 border border-ink-800/50 rounded-xl p-12 text-center">
              <div className="w-20 h-20 mx-auto bg-ink-800/50 rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-ink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-ink-300 mb-2">Paste a Job Description</h3>
              <p className="text-ink-500 text-sm max-w-sm mx-auto">
                Copy any job posting and our AI will create a perfectly tailored resume with the right skills, keywords, and achievements.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

