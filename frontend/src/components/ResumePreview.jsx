import { useRef, useEffect, useState } from 'react';

export default function ResumePreview({ resume, enableCompression = true }) {
  const previewRef = useRef(null);
  const [exceedsOnePage, setExceedsOnePage] = useState(false);
  const [compressionLevel, setCompressionLevel] = useState(0);


  const templates = {
    modern: ModernTemplate,
    classic: ClassicTemplate,
    minimal: MinimalTemplate,
    executive: ExecutiveTemplate,
    creative: CreativeTemplate,
    ats: AtsTemplate,
    atsclean: AtsCleanTemplate,
    atsbold: AtsBoldTemplate,
    atscompact: AtsCompactTemplate,
    twocolumn: TwoColumnTemplate,
    developer: DeveloperTemplate,
  };

  // Templates that are already optimized and should NEVER be compressed
  const preOptimizedTemplates = ['atscompact', 'atsbold', 'atsclean', 'ats'];

  // Check if current template should allow compression
  const isPreOptimized = preOptimizedTemplates.includes(resume.template);
  const shouldCompress = enableCompression && !isPreOptimized;

  const Template = templates[resume.template] || ModernTemplate;

  // Auto-adjust content to fit one page (only if compression is enabled AND template allows it)
  useEffect(() => {
    if (!shouldCompress) {
      // No compression - just check if it exceeds one page
      if (previewRef.current) {
        const onePageHeight = 1123; // A4 height in pixels at 96dpi
        const height = previewRef.current.scrollHeight;
        setExceedsOnePage(height > onePageHeight);
        setCompressionLevel(0);
      }
      return;
    }

    // Compression enabled and template allows it - try to fit on one page
    if (previewRef.current) {
      const onePageHeight = 1123; // A4 height in pixels at 96dpi
      let currentLevel = 0;

      // Try progressively more aggressive compression levels
      const tryCompressionLevel = (level) => {
        setCompressionLevel(level);

        // Wait for DOM update
        setTimeout(() => {
          if (previewRef.current) {
            const height = previewRef.current.scrollHeight;

            if (height > onePageHeight && level < 4) {
              // Try next compression level
              tryCompressionLevel(level + 1);
            } else {
              // Either fits now or we've exhausted all options
              setExceedsOnePage(height > onePageHeight);
            }
          }
        }, 50);
      };

      tryCompressionLevel(0);
    }
  }, [resume, shouldCompress]);

  // Compression styles based on level
  const getCompressionStyles = () => {
    const levels = [
      // Level 0: Normal
      {
        fontSize: '10pt',
        lineHeight: '1.4',
        padding: '32px',
        sectionSpacing: '20px',
        itemSpacing: '12px'
      },
      // Level 1: Reduce spacing
      {
        fontSize: '10pt',
        lineHeight: '1.35',
        padding: '28px',
        sectionSpacing: '16px',
        itemSpacing: '10px'
      },
      // Level 2: Reduce font and spacing more
      {
        fontSize: '9.5pt',
        lineHeight: '1.3',
        padding: '24px',
        sectionSpacing: '14px',
        itemSpacing: '8px'
      },
      // Level 3: Aggressive compression
      {
        fontSize: '9pt',
        lineHeight: '1.25',
        padding: '20px',
        sectionSpacing: '12px',
        itemSpacing: '6px'
      },
      // Level 4: Maximum compression
      {
        fontSize: '8.5pt',
        lineHeight: '1.2',
        padding: '16px',
        sectionSpacing: '10px',
        itemSpacing: '5px'
      }
    ];

    return levels[compressionLevel] || levels[0];
  };

  const styles = getCompressionStyles();

  return (
    <div className="space-y-4">
      {/* Notifications removed as per user request */}

      <div className="bg-white rounded-xl shadow-2xl overflow-hidden overflow-x-auto">
        {/* A4 page container with dynamic compression */}
        <div
          id="resume-preview-content"
          ref={previewRef}
          className="resume-page resume-auto-fit"
          style={{
            width: '100%',
            maxWidth: '794px',
            minHeight: '1123px',
            margin: '0 auto',
            // Apply default padding if not compressing, otherwise use compression styles
            padding: shouldCompress && compressionLevel > 0 ? styles.padding : '32px',
            // Only apply other compression styles if actually compressing
            ...(shouldCompress && compressionLevel > 0 ? {
              fontSize: styles.fontSize,
              lineHeight: styles.lineHeight,
              '--section-spacing': styles.sectionSpacing,
              '--item-spacing': styles.itemSpacing
            } : {})
          }}
        >
          <Template resume={resume} />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// HELPER: Render Experience (handles service-based with clients)
// ============================================================
function ExperienceBlock({ exp, bulletStyle = '•', showBorder = false }) {
  const hasBullets = exp.highlights?.length > 0;
  const hasClients = exp.serviceBased && exp.clientProjects?.length > 0;

  return (
    <div className={`mb-4 last:mb-0 break-inside-avoid page-break-inside-avoid ${showBorder ? 'border-l-2 border-gray-200 pl-3' : ''}`}>
      <div className="flex justify-between items-start flex-wrap gap-1">
        <div>
          <div className="font-bold text-gray-900">{exp.position}</div>
          <div className="text-gray-700">{exp.company}{exp.location && `, ${exp.location}`}</div>
        </div>
        <span className="text-gray-600 text-sm whitespace-nowrap">
          {exp.startDate} – {exp.endDate || 'Present'}
        </span>
      </div>

      {hasClients ? (
        <div className="mt-2 space-y-3">
          {exp.clientProjects.map((client, ci) => (
            <div key={ci} className="ml-2 pl-3 border-l-2 border-gray-300">
              <div className="flex justify-between items-start flex-wrap gap-1">
                <div>
                  <span className="font-semibold text-gray-800">Client: {client.clientName}</span>
                  {client.projectName && (
                    <span className="text-gray-600"> | {client.projectName}</span>
                  )}
                </div>
                <span className="text-gray-500 text-sm">
                  {client.startDate} – {client.endDate || 'Present'}
                </span>
              </div>
              {client.role && (
                <div className="text-gray-600 text-sm">{client.role}</div>
              )}
              {client.highlights?.length > 0 && (
                <ul className="mt-1 space-y-0.5">
                  {client.highlights.map((h, j) => h && (
                    <li key={j} className="text-gray-700 text-sm">
                      {bulletStyle} {h}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      ) : hasBullets && (
        <ul className="mt-2 space-y-1">
          {exp.highlights.map((h, j) => h && (
            <li key={j} className="text-gray-700 text-sm">
              {bulletStyle} {h}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ============================================================
// MODERN TEMPLATE - Clean, professional, ATS-friendly
// Single column, standard fonts, clear hierarchy
// ============================================================
// ============================================================
// MODERN TEMPLATE - Clean, professional, ATS-friendly
// Single column, standard fonts, clear hierarchy
// ============================================================
export function ModernTemplate({ resume }) {
  return (
    <div className="font-sans text-sm text-gray-800 leading-relaxed">
      {/* Header - Contact at top, not in document header */}
      <header className="text-center mb-5 pb-4 border-b-2 border-blue-600">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {resume.fullName || 'Your Name'}
        </h1>
        <div className="text-gray-600 text-sm space-x-2">
          {resume.email && <span>{resume.email}</span>}
          {resume.phone && <span>| {resume.phone}</span>}
          {resume.location && <span>| {resume.location}</span>}
        </div>
        {(resume.linkedIn || resume.github || resume.website) && (
          <div className="text-gray-500 text-sm mt-1 space-x-2">
            {resume.linkedIn && <span>{resume.linkedIn}</span>}
            {resume.github && <span>| {resume.github}</span>}
            {resume.website && <span>| {resume.website}</span>}
          </div>
        )}
      </header>

      {/* Professional Summary */}
      {resume.summary && (
        <section className="mb-5">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-200 pb-1 mb-2">
            Professional Summary
          </h2>
          <p className="text-gray-700">{resume.summary}</p>
        </section>
      )}

      {/* Skills - Keywords for ATS */}
      {resume.skills?.length > 0 && (
        <section className="mb-5">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-200 pb-1 mb-2">
            Technical Skills
          </h2>
          <p className="text-gray-700">{resume.skills.join(' • ')}</p>
        </section>
      )}

      {/* Work Experience */}
      {resume.experience?.length > 0 && (
        <section className="mb-5">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-200 pb-1 mb-2">
            Work Experience
          </h2>
          {resume.experience.map((exp, i) => (
            <ExperienceBlock key={i} exp={exp} bulletStyle="•" />
          ))}
        </section>
      )}

      {/* Education */}
      {resume.education?.length > 0 && (
        <section className="mb-5">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-200 pb-1 mb-2">
            Education
          </h2>
          {resume.education.map((edu, i) => (
            <div key={i} className="mb-3 last:mb-0 break-inside-avoid page-break-inside-avoid">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-gray-900">
                    {edu.degree}{edu.field && ` in ${edu.field}`}
                  </div>
                  <div className="text-gray-700">{edu.institution}</div>
                </div>
                <span className="text-gray-600 text-sm">
                  {edu.startDate && `${edu.startDate} – `}{edu.endDate}
                </span>
              </div>
              {edu.gpa && <div className="text-gray-600 text-sm">GPA: {edu.gpa}</div>}
            </div>
          ))}
        </section>
      )}

      {/* Projects */}
      {resume.projects?.length > 0 && (
        <section className="mb-5">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-200 pb-1 mb-2">
            Projects
          </h2>
          {resume.projects.map((proj, i) => (
            <div key={i} className="mb-3 last:mb-0">
              <div className="font-bold text-gray-900">{proj.name}</div>
              {proj.description && <p className="text-gray-700 text-sm">{proj.description}</p>}
              {proj.technologies?.length > 0 && (
                <p className="text-gray-600 text-sm">Technologies: {proj.technologies.join(', ')}</p>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Certifications */}
      {resume.certifications?.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-200 pb-1 mb-2">
            Certifications
          </h2>
          <ul className="space-y-1">
            {resume.certifications.map((cert, i) => (
              <li key={i} className="text-gray-700">• {cert}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

// ============================================================
// CLASSIC TEMPLATE - Traditional, serif font, formal
// ============================================================
// ============================================================
// CLASSIC TEMPLATE - Traditional, serif font, formal
// ============================================================
export function ClassicTemplate({ resume }) {
  return (
    <div className="font-serif text-sm text-gray-800 leading-relaxed">
      <header className="text-center mb-6 pb-4 border-b-2 border-gray-800">
        <h1 className="text-3xl font-bold mb-2">{resume.fullName || 'Your Name'}</h1>
        <div className="text-gray-600">
          {[resume.email, resume.phone, resume.location].filter(Boolean).join(' | ')}
        </div>
        {(resume.linkedIn || resume.github) && (
          <div className="text-gray-500 text-sm mt-1">
            {[resume.linkedIn, resume.github, resume.website].filter(Boolean).join(' | ')}
          </div>
        )}
      </header>

      {resume.summary && (
        <section className="mb-5">
          <h2 className="text-base font-bold uppercase border-b border-gray-400 pb-1 mb-2">
            Professional Summary
          </h2>
          <p className="text-gray-700 italic">{resume.summary}</p>
        </section>
      )}

      {resume.experience?.length > 0 && (
        <section className="mb-5">
          <h2 className="text-base font-bold uppercase border-b border-gray-400 pb-1 mb-2">
            Professional Experience
          </h2>
          {resume.experience.map((exp, i) => (
            <ExperienceBlock key={i} exp={exp} bulletStyle="•" />
          ))}
        </section>
      )}

      {resume.education?.length > 0 && (
        <section className="mb-5">
          <h2 className="text-base font-bold uppercase border-b border-gray-400 pb-1 mb-2">
            Education
          </h2>
          {resume.education.map((edu, i) => (
            <div key={i} className="mb-2">
              <div className="flex justify-between">
                <span className="font-bold">{edu.degree} in {edu.field}</span>
                <span className="text-gray-600">{edu.endDate}</span>
              </div>
              <div className="text-gray-700">{edu.institution}</div>
              {edu.gpa && <div className="text-gray-600 text-sm">GPA: {edu.gpa}</div>}
            </div>
          ))}
        </section>
      )}

      {resume.skills?.length > 0 && (
        <section className="mb-5">
          <h2 className="text-base font-bold uppercase border-b border-gray-400 pb-1 mb-2">
            Skills
          </h2>
          <p className="text-gray-700">{resume.skills.join(', ')}</p>
        </section>
      )}

      {resume.certifications?.length > 0 && (
        <section>
          <h2 className="text-base font-bold uppercase border-b border-gray-400 pb-1 mb-2">
            Certifications
          </h2>
          <p className="text-gray-700">{resume.certifications.join(' | ')}</p>
        </section>
      )}
    </div>
  );
}

// ============================================================
// MINIMAL TEMPLATE - Ultra clean, lots of white space
// ============================================================
// ============================================================
// MINIMAL TEMPLATE - Ultra clean, lots of white space
// ============================================================
export function MinimalTemplate({ resume }) {
  return (
    <div className="font-sans text-sm text-gray-800 leading-relaxed">
      <header className="mb-8">
        <h1 className="text-2xl font-light tracking-wide mb-1">
          {resume.fullName || 'Your Name'}
        </h1>
        <div className="text-gray-500 text-sm">
          {[resume.email, resume.phone, resume.location].filter(Boolean).join(' / ')}
        </div>
        {(resume.linkedIn || resume.github) && (
          <div className="text-gray-400 text-sm mt-1">
            {[resume.linkedIn, resume.github].filter(Boolean).join(' / ')}
          </div>
        )}
      </header>

      {resume.summary && (
        <section className="mb-8">
          <p className="text-gray-600 leading-relaxed">{resume.summary}</p>
        </section>
      )}

      {resume.experience?.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Experience</h2>
          {resume.experience.map((exp, i) => (
            <ExperienceBlock key={i} exp={exp} bulletStyle="—" />
          ))}
        </section>
      )}

      {resume.education?.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Education</h2>
          {resume.education.map((edu, i) => (
            <div key={i} className="mb-3">
              <div className="font-medium">{edu.degree} in {edu.field}</div>
              <div className="text-gray-500 text-sm">{edu.institution} / {edu.endDate}</div>
            </div>
          ))}
        </section>
      )}

      {resume.skills?.length > 0 && (
        <section>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Skills</h2>
          <p className="text-gray-600">{resume.skills.join(' / ')}</p>
        </section>
      )}
    </div>
  );
}

// ============================================================
// EXECUTIVE TEMPLATE - Senior/leadership roles
// ============================================================
// ============================================================
// EXECUTIVE TEMPLATE - Senior/leadership roles
// ============================================================
export function ExecutiveTemplate({ resume }) {
  return (
    <div className="font-sans text-sm text-gray-800 leading-relaxed">
      <header className="bg-slate-800 text-white p-6 -m-6 mb-6 md:-m-8 md:mb-6 md:p-8">
        <h1 className="text-2xl font-bold tracking-wide mb-2">
          {resume.fullName || 'Your Name'}
        </h1>
        <div className="text-slate-300 text-sm">
          {[resume.email, resume.phone, resume.location].filter(Boolean).join(' | ')}
        </div>
        {(resume.linkedIn || resume.github) && (
          <div className="text-slate-400 text-sm mt-1">
            {[resume.linkedIn, resume.github, resume.website].filter(Boolean).join(' | ')}
          </div>
        )}
      </header>

      {resume.summary && (
        <section className="mb-6 p-4 bg-slate-50 border-l-4 border-slate-800">
          <h2 className="text-sm font-bold text-slate-700 uppercase mb-2">Executive Summary</h2>
          <p className="text-gray-700">{resume.summary}</p>
        </section>
      )}

      {resume.skills?.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-bold text-slate-800 uppercase border-b-2 border-slate-800 pb-1 mb-3">
            Core Competencies
          </h2>
          <div className="flex flex-wrap gap-2">
            {resume.skills.map((skill, i) => (
              <span key={i} className="px-3 py-1 bg-slate-100 text-slate-700 text-sm rounded">
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {resume.experience?.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-bold text-slate-800 uppercase border-b-2 border-slate-800 pb-1 mb-3">
            Professional Experience
          </h2>
          {resume.experience.map((exp, i) => (
            <ExperienceBlock key={i} exp={exp} bulletStyle="▸" />
          ))}
        </section>
      )}

      {resume.education?.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-bold text-slate-800 uppercase border-b-2 border-slate-800 pb-1 mb-3">
            Education
          </h2>
          {resume.education.map((edu, i) => (
            <div key={i} className="mb-2">
              <div className="font-semibold">{edu.degree} in {edu.field}</div>
              <div className="text-gray-600">{edu.institution} | {edu.endDate}</div>
            </div>
          ))}
        </section>
      )}

      {resume.certifications?.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-slate-800 uppercase border-b-2 border-slate-800 pb-1 mb-3">
            Certifications & Licenses
          </h2>
          <ul className="space-y-1">
            {resume.certifications.map((cert, i) => (
              <li key={i} className="text-gray-700">• {cert}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

// ============================================================
// CREATIVE TEMPLATE - For design/marketing roles
// Note: Use only when applying to creative roles, NOT for ATS-heavy companies
// ============================================================
// ============================================================
// CREATIVE TEMPLATE - For design/marketing roles
// Note: Use only when applying to creative roles, NOT for ATS-heavy companies
// ============================================================
export function CreativeTemplate({ resume }) {
  return (
    <div className="font-sans text-sm text-gray-800 leading-relaxed">
      <header className="bg-gradient-to-r from-purple-600 to-purple-500 text-white p-6 -m-6 mb-6 md:-m-8 md:mb-6 md:p-8">
        <h1 className="text-3xl font-black mb-2">
          {resume.fullName || 'Your Name'}
        </h1>
        <div className="text-purple-100 text-sm">
          {[resume.email, resume.phone, resume.location].filter(Boolean).join(' • ')}
        </div>
      </header>

      {resume.summary && (
        <section className="mb-6">
          <p className="text-gray-600 text-base italic leading-relaxed">"{resume.summary}"</p>
        </section>
      )}

      {resume.skills?.length > 0 && (
        <section className="mb-6">
          <div className="flex flex-wrap gap-2">
            {resume.skills.map((skill, i) => (
              <span key={i} className="px-3 py-1 bg-gradient-to-r from-purple-100 to-purple-100 text-purple-700 rounded-full text-sm font-medium">
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {resume.experience?.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-bold text-purple-600 mb-4 flex items-center gap-2">
            <span className="w-8 h-1 bg-gradient-to-r from-purple-600 to-purple-500 rounded"></span>
            Experience
          </h2>
          {resume.experience.map((exp, i) => (
            <div key={i} className="mb-4 pl-4 border-l-2 border-gray-200">
              <ExperienceBlock exp={exp} bulletStyle="•" />
            </div>
          ))}
        </section>
      )}

      {resume.education?.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-purple-600 mb-4 flex items-center gap-2">
            <span className="w-8 h-1 bg-gradient-to-r from-purple-600 to-purple-500 rounded"></span>
            Education
          </h2>
          {resume.education.map((edu, i) => (
            <div key={i} className="mb-2 pl-4 border-l-2 border-gray-200">
              <div className="font-bold">{edu.degree} in {edu.field}</div>
              <div className="text-gray-500 text-sm">{edu.institution} • {edu.endDate}</div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

// ============================================================
// ATS TEMPLATE - MAXIMUM ATS COMPATIBILITY
// Single column, standard fonts, simple formatting
// ============================================================
// ============================================================
// ATS TEMPLATE - MAXIMUM ATS COMPATIBILITY
// Single column, standard fonts, simple formatting
// ============================================================
export function AtsTemplate({ resume }) {
  return (
    <div className="font-sans text-sm text-gray-900 leading-relaxed" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Simple header - No graphics, tables, or special formatting */}
      <header className="mb-4 pb-3 border-b border-gray-400">
        <h1 className="text-xl font-bold mb-1">{resume.fullName || 'Your Name'}</h1>
        <div className="text-gray-700 text-sm">
          {resume.email && <span>{resume.email}</span>}
          {resume.phone && <span> | {resume.phone}</span>}
          {resume.location && <span> | {resume.location}</span>}
        </div>
        {(resume.linkedIn || resume.github) && (
          <div className="text-gray-600 text-sm mt-1">
            {resume.linkedIn && <span>{resume.linkedIn}</span>}
            {resume.github && <span> | {resume.github}</span>}
          </div>
        )}
      </header>

      {/* Professional Summary - Standard heading */}
      {resume.summary && (
        <section className="mb-4">
          <h2 className="text-sm font-bold uppercase mb-2">Professional Summary</h2>
          <p className="text-gray-700">{resume.summary}</p>
        </section>
      )}

      {/* Technical Skills - Keyword rich for ATS matching */}
      {resume.skills?.length > 0 && (
        <section className="mb-4">
          <h2 className="text-sm font-bold uppercase mb-2">Technical Skills</h2>
          <p className="text-gray-700">{resume.skills.join(', ')}</p>
        </section>
      )}

      {/* Work Experience - Standard format */}
      {resume.experience?.length > 0 && (
        <section className="mb-4">
          <h2 className="text-sm font-bold uppercase mb-2">Work Experience</h2>
          {resume.experience.map((exp, i) => (
            <div key={i} className="mb-4">
              <div className="font-bold">{exp.position}</div>
              <div className="text-gray-700">{exp.company} | {exp.startDate} – {exp.endDate || 'Present'}</div>
              {exp.serviceBased && exp.clientProjects?.length > 0 ? (
                <div className="mt-2 ml-4">
                  {exp.clientProjects.map((client, ci) => (
                    <div key={ci} className="mb-2">
                      <div className="font-semibold text-sm">Client: {client.clientName}</div>
                      {client.role && <div className="text-gray-600 text-sm">{client.role}</div>}
                      <div className="text-gray-500 text-sm">{client.startDate} – {client.endDate || 'Present'}</div>
                      {client.highlights?.map((h, j) => h && (
                        <div key={j} className="text-gray-700 text-sm">- {h}</div>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                exp.highlights?.map((h, j) => h && (
                  <div key={j} className="text-gray-700 text-sm">- {h}</div>
                ))
              )}
            </div>
          ))}
        </section>
      )}

      {/* Education */}
      {resume.education?.length > 0 && (
        <section className="mb-4">
          <h2 className="text-sm font-bold uppercase mb-2">Education</h2>
          {resume.education.map((edu, i) => (
            <div key={i} className="mb-2">
              <div className="font-bold">{edu.degree} in {edu.field}</div>
              <div className="text-gray-700">{edu.institution} | {edu.startDate && `${edu.startDate} – `}{edu.endDate}</div>
              {edu.gpa && <div className="text-gray-600 text-sm">GPA: {edu.gpa}</div>}
            </div>
          ))}
        </section>
      )}

      {/* Projects */}
      {resume.projects?.length > 0 && (
        <section className="mb-4">
          <h2 className="text-sm font-bold uppercase mb-2">Projects</h2>
          {resume.projects.map((proj, i) => (
            <div key={i} className="mb-2">
              <div className="font-bold">{proj.name}</div>
              {proj.description && <div className="text-gray-700 text-sm">{proj.description}</div>}
              {proj.technologies?.length > 0 && (
                <div className="text-gray-600 text-sm">Technologies: {proj.technologies.join(', ')}</div>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Certifications */}
      {resume.certifications?.length > 0 && (
        <section>
          <h2 className="text-sm font-bold uppercase mb-2">Certifications</h2>
          {resume.certifications.map((cert, i) => (
            <div key={i} className="text-gray-700">- {cert}</div>
          ))}
        </section>
      )}
    </div>
  );
}

// ============================================================
// ATS CLEAN - Harvard/Stanford style, very traditional
// ============================================================
// ============================================================
// ATS CLEAN - Harvard/Stanford style, very traditional
// ============================================================
export function AtsCleanTemplate({ resume }) {
  return (
    <div className="font-serif text-sm text-gray-900 leading-relaxed" style={{ fontFamily: 'Times New Roman, serif' }}>
      <header className="text-center mb-4 pb-3 border-b-2 border-gray-800">
        <h1 className="text-2xl font-bold uppercase tracking-wide mb-2">
          {resume.fullName || 'YOUR NAME'}
        </h1>
        <div className="text-gray-700 text-sm">
          {[resume.location, resume.phone, resume.email].filter(Boolean).join(' • ')}
        </div>
        {(resume.linkedIn || resume.github) && (
          <div className="text-gray-600 text-sm mt-1">
            {[resume.linkedIn, resume.github, resume.website].filter(Boolean).join(' • ')}
          </div>
        )}
      </header>

      {resume.summary && (
        <section className="mb-4">
          <h2 className="text-sm font-bold uppercase border-b border-gray-400 pb-1 mb-2">
            Professional Summary
          </h2>
          <p className="text-gray-800">{resume.summary}</p>
        </section>
      )}

      {resume.experience?.length > 0 && (
        <section className="mb-4">
          <h2 className="text-sm font-bold uppercase border-b border-gray-400 pb-1 mb-2">
            Work Experience
          </h2>
          {resume.experience.map((exp, i) => (
            <div key={i} className="mb-3">
              <div className="flex justify-between items-baseline">
                <span className="font-bold">{exp.position}</span>
                <span className="text-gray-600 text-sm">{exp.startDate} – {exp.endDate || 'Present'}</span>
              </div>
              <div className="text-gray-700 italic">{exp.company}{exp.location && `, ${exp.location}`}</div>
              {exp.serviceBased && exp.clientProjects?.length > 0 ? (
                <div className="mt-2 ml-2">
                  {exp.clientProjects.map((client, ci) => (
                    <div key={ci} className="mb-2 pl-2 border-l-2 border-gray-300">
                      <div className="flex justify-between items-baseline">
                        <span className="font-semibold text-sm">Client: {client.clientName}</span>
                        <span className="text-gray-500 text-sm">{client.startDate} – {client.endDate || 'Present'}</span>
                      </div>
                      {client.role && <div className="text-gray-600 text-sm italic">{client.role}</div>}
                      {client.highlights?.length > 0 && (
                        <ul className="mt-1 list-disc ml-4">
                          {client.highlights.map((h, j) => h && (
                            <li key={j} className="text-gray-700 text-sm">{h}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              ) : exp.highlights?.length > 0 && (
                <ul className="mt-1 list-disc ml-4">
                  {exp.highlights.map((h, j) => h && (
                    <li key={j} className="text-gray-700 text-sm">{h}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {resume.education?.length > 0 && (
        <section className="mb-4">
          <h2 className="text-sm font-bold uppercase border-b border-gray-400 pb-1 mb-2">
            Education
          </h2>
          {resume.education.map((edu, i) => (
            <div key={i} className="mb-2">
              <div className="flex justify-between items-baseline">
                <span className="font-bold">{edu.degree} in {edu.field}</span>
                <span className="text-gray-600 text-sm">{edu.endDate}</span>
              </div>
              <div className="text-gray-700">{edu.institution}</div>
              {edu.gpa && <div className="text-gray-600 text-sm">GPA: {edu.gpa}</div>}
            </div>
          ))}
        </section>
      )}

      {resume.skills?.length > 0 && (
        <section className="mb-4">
          <h2 className="text-sm font-bold uppercase border-b border-gray-400 pb-1 mb-2">
            Skills
          </h2>
          <p className="text-gray-800">{resume.skills.join(', ')}</p>
        </section>
      )}

      {resume.certifications?.length > 0 && (
        <section>
          <h2 className="text-sm font-bold uppercase border-b border-gray-400 pb-1 mb-2">
            Certifications
          </h2>
          <ul className="list-disc ml-4">
            {resume.certifications.map((cert, i) => (
              <li key={i} className="text-gray-700 text-sm">{cert}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

// ============================================================
// ATS BOLD - Strong visual hierarchy, still ATS-friendly
// ============================================================
// ============================================================
// ATS BOLD - Strong headers, clear separation
// ============================================================
export function AtsBoldTemplate({ resume }) {
  return (
    <div className="font-sans text-sm text-gray-900 leading-relaxed" style={{ fontFamily: 'Arial, sans-serif' }}>
      <header className="mb-4">
        <h1 className="text-xl font-black uppercase">
          {resume.fullName || 'YOUR NAME'}
        </h1>
        <div className="text-gray-700 mt-1">
          {resume.email && <span>{resume.email}</span>}
          {resume.phone && <span> | {resume.phone}</span>}
          {resume.location && <span> | {resume.location}</span>}
        </div>
        {(resume.linkedIn || resume.github) && (
          <div className="text-gray-600 text-sm mt-1">
            {resume.linkedIn && <span>{resume.linkedIn}</span>}
            {resume.github && <span> | {resume.github}</span>}
          </div>
        )}
      </header>

      <hr className="border-gray-900 border-t-2 mb-4" />

      {resume.summary && (
        <section className="mb-4">
          <h2 className="text-base font-black uppercase bg-gray-100 px-2 py-1 mb-2">
            Professional Summary
          </h2>
          <p className="text-gray-700 px-2">{resume.summary}</p>
        </section>
      )}

      {resume.skills?.length > 0 && (
        <section className="mb-4">
          <h2 className="text-base font-black uppercase bg-gray-100 px-2 py-1 mb-2">
            Core Competencies
          </h2>
          <div className="px-2 grid grid-cols-3 gap-1">
            {resume.skills.map((skill, i) => (
              <span key={i} className="text-gray-700 text-sm">• {skill}</span>
            ))}
          </div>
        </section>
      )}

      {resume.experience?.length > 0 && (
        <section className="mb-4">
          <h2 className="text-base font-black uppercase bg-gray-100 px-2 py-1 mb-2">
            Professional Experience
          </h2>
          {resume.experience.map((exp, i) => (
            <div key={i} className="mb-3 px-2">
              <div className="font-bold text-gray-900">{exp.position}</div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">{exp.company}</span>
                <span className="text-gray-500">{exp.startDate} – {exp.endDate || 'Present'}</span>
              </div>
              {exp.serviceBased && exp.clientProjects?.length > 0 ? (
                <div className="mt-2 ml-2 space-y-2">
                  {exp.clientProjects.map((client, ci) => (
                    <div key={ci} className="bg-gray-50 p-2 rounded">
                      <div className="flex justify-between">
                        <span className="font-semibold text-sm">Client: {client.clientName}</span>
                        <span className="text-gray-500 text-sm">{client.startDate} – {client.endDate || 'Present'}</span>
                      </div>
                      {client.role && <div className="text-gray-600 text-sm">{client.role}</div>}
                      {client.highlights?.map((h, j) => h && (
                        <div key={j} className="text-gray-700 text-sm">► {h}</div>
                      ))}
                    </div>
                  ))}
                </div>
              ) : exp.highlights?.length > 0 && (
                <ul className="mt-1">
                  {exp.highlights.map((h, j) => h && (
                    <li key={j} className="text-gray-700 text-sm">► {h}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {resume.education?.length > 0 && (
        <section className="mb-4">
          <h2 className="text-base font-black uppercase bg-gray-100 px-2 py-1 mb-2">
            Education
          </h2>
          {resume.education.map((edu, i) => (
            <div key={i} className="px-2 mb-2">
              <div className="font-bold">{edu.institution}</div>
              <div className="text-gray-700 text-sm">
                {edu.degree} in {edu.field} | {edu.endDate}
                {edu.gpa && <span> | GPA: {edu.gpa}</span>}
              </div>
            </div>
          ))}
        </section>
      )}

      {resume.certifications?.length > 0 && (
        <section>
          <h2 className="text-base font-black uppercase bg-gray-100 px-2 py-1 mb-2">
            Certifications
          </h2>
          <div className="px-2">
            {resume.certifications.map((cert, i) => (
              <span key={i} className="text-gray-700 text-sm">• {cert}  </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ============================================================
// ATS COMPACT - Dense, single page optimized
// ============================================================
// ============================================================
// ATS COMPACT - Optimized for one page
// ============================================================
export function AtsCompactTemplate({ resume }) {
  return (
    <div className="font-sans text-xs text-gray-900 leading-snug" style={{ fontFamily: 'Arial, sans-serif' }}>
      <header className="text-center mb-3">
        <h1 className="text-lg font-bold">{resume.fullName || 'Your Name'}</h1>
        <div className="text-gray-600">
          {[resume.email, resume.phone, resume.location].filter(Boolean).join(' | ')}
          {(resume.linkedIn || resume.github) && (
            <span> | {[resume.linkedIn, resume.github].filter(Boolean).join(' | ')}</span>
          )}
        </div>
      </header>

      {resume.summary && (
        <section className="mb-2">
          <div className="font-bold uppercase border-b border-black mb-1">Summary</div>
          <p className="text-gray-700">{resume.summary}</p>
        </section>
      )}

      {resume.skills?.length > 0 && (
        <section className="mb-2">
          <div className="font-bold uppercase border-b border-black mb-1">Technical Skills</div>
          <p className="text-gray-700">{resume.skills.join(' • ')}</p>
        </section>
      )}

      {resume.experience?.length > 0 && (
        <section className="mb-2">
          <div className="font-bold uppercase border-b border-black mb-1">Experience</div>
          {resume.experience.map((exp, i) => (
            <div key={i} className="mb-2">
              <div className="flex justify-between">
                <span className="font-semibold">{exp.position}, {exp.company}</span>
                <span className="text-gray-500">{exp.startDate}–{exp.endDate || 'Present'}</span>
              </div>
              {exp.serviceBased && exp.clientProjects?.length > 0 ? (
                <div className="ml-2 mt-1">
                  {exp.clientProjects.map((client, ci) => (
                    <div key={ci}>
                      <span className="font-medium">→ {client.clientName}</span>
                      <span className="text-gray-500"> ({client.startDate}–{client.endDate || 'Present'})</span>
                      {client.highlights?.slice(0, 2).map((h, j) => h && (
                        <span key={j} className="text-gray-700 ml-1">• {h}</span>
                      ))}
                    </div>
                  ))}
                </div>
              ) : exp.highlights?.length > 0 && (
                <ul className="ml-3">
                  {exp.highlights.slice(0, 3).map((h, j) => h && (
                    <li key={j} className="text-gray-700">• {h}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {resume.education?.length > 0 && (
        <section className="mb-2">
          <div className="font-bold uppercase border-b border-black mb-1">Education</div>
          {resume.education.map((edu, i) => (
            <div key={i} className="flex justify-between">
              <span>
                <span className="font-semibold">{edu.degree}</span> in {edu.field}, {edu.institution}
                {edu.gpa && <span className="text-gray-500"> (GPA: {edu.gpa})</span>}
              </span>
              <span className="text-gray-500">{edu.endDate}</span>
            </div>
          ))}
        </section>
      )}

      {resume.projects?.length > 0 && (
        <section className="mb-2">
          <div className="font-bold uppercase border-b border-black mb-1">Projects</div>
          {resume.projects.map((proj, i) => (
            <div key={i}>
              <span className="font-semibold">{proj.name}</span>
              {proj.technologies?.length > 0 && (
                <span className="text-gray-500"> ({proj.technologies.join(', ')})</span>
              )}
              {proj.description && <span className="text-gray-600"> – {proj.description}</span>}
            </div>
          ))}
        </section>
      )}

      {resume.certifications?.length > 0 && (
        <section>
          <div className="font-bold uppercase border-b border-black mb-1">Certifications</div>
          <p className="text-gray-700">{resume.certifications.join(' | ')}</p>
        </section>
      )}
    </div>
  );
}

// ============================================================
// TWO COLUMN - Visual template (less ATS-friendly, use for direct applications)
// ============================================================
// ============================================================
// TWO COLUMN TEMPLATE - Modern sidebar layout
// ============================================================
export function TwoColumnTemplate({ resume }) {
  return (
    <div className="font-sans text-sm text-gray-800 flex gap-6">
      {/* Sidebar */}
      <div className="w-1/3 bg-gray-900 text-white p-4 -ml-6 -my-6 md:-ml-8 md:-my-8 min-h-full">
        <div className="mb-6">
          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center text-2xl font-bold mb-3">
            {resume.fullName?.charAt(0) || '?'}
          </div>
          <h1 className="text-lg font-bold">{resume.fullName || 'Your Name'}</h1>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <h3 className="text-gray-400 uppercase text-xs font-bold mb-2">Contact</h3>
            {resume.email && <p className="mb-1">{resume.email}</p>}
            {resume.phone && <p className="mb-1">{resume.phone}</p>}
            {resume.location && <p className="mb-1">{resume.location}</p>}
          </div>

          {resume.skills?.length > 0 && (
            <div>
              <h3 className="text-gray-400 uppercase text-xs font-bold mb-2">Skills</h3>
              <div className="space-y-1">
                {resume.skills.slice(0, 10).map((skill, i) => (
                  <div key={i} className="text-xs">{skill}</div>
                ))}
              </div>
            </div>
          )}

          {resume.education?.length > 0 && (
            <div>
              <h3 className="text-gray-400 uppercase text-xs font-bold mb-2">Education</h3>
              {resume.education.map((edu, i) => (
                <div key={i} className="mb-2">
                  <div className="font-medium">{edu.degree}</div>
                  <div className="text-gray-400 text-xs">{edu.institution}</div>
                  <div className="text-gray-500 text-xs">{edu.endDate}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 py-2">
        {resume.summary && (
          <section className="mb-5">
            <h2 className="text-sm font-bold uppercase tracking-wide mb-2">About Me</h2>
            <p className="text-gray-600">{resume.summary}</p>
          </section>
        )}

        {resume.experience?.length > 0 && (
          <section className="mb-5">
            <h2 className="text-sm font-bold uppercase tracking-wide mb-3">Experience</h2>
            {resume.experience.map((exp, i) => (
              <ExperienceBlock key={i} exp={exp} bulletStyle="•" showBorder />
            ))}
          </section>
        )}

        {resume.projects?.length > 0 && (
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wide mb-3">Projects</h2>
            {resume.projects.map((proj, i) => (
              <div key={i} className="mb-3">
                <div className="font-bold">{proj.name}</div>
                {proj.description && <p className="text-gray-600 text-sm">{proj.description}</p>}
                {proj.technologies?.length > 0 && (
                  <p className="text-gray-600 text-xs">{proj.technologies.join(', ')}</p>
                )}
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}

// ============================================================
// DEVELOPER TEMPLATE - Tech-focused with code aesthetics
// ============================================================
// ============================================================
// DEVELOPER TEMPLATE - Code-inspired aesthetics
// ============================================================
export function DeveloperTemplate({ resume }) {
  return (
    <div className="font-mono text-sm text-gray-800 bg-gray-50 p-4 -m-6 md:-m-8 min-h-full">
      {/* Terminal-style header */}
      <div className="bg-gray-900 text-green-400 p-4 rounded-lg mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-3 h-3 rounded-full bg-red-500"></span>
          <span className="w-3 h-3 rounded-full bg-gray-500"></span>
          <span className="w-3 h-3 rounded-full bg-green-500"></span>
          <span className="text-gray-500 text-xs ml-2">~/resume</span>
        </div>
        <div className="text-xs">
          <p><span className="text-gray-400">const</span> developer = {'{'}</p>
          <p className="ml-4"><span className="text-gray-400">name</span>: <span className="text-gray-300">"{resume.fullName || 'Your Name'}"</span>,</p>
          {resume.email && <p className="ml-4"><span className="text-gray-400">email</span>: <span className="text-gray-300">"{resume.email}"</span>,</p>}
          {resume.location && <p className="ml-4"><span className="text-gray-400">location</span>: <span className="text-gray-300">"{resume.location}"</span>,</p>}
          {resume.github && <p className="ml-4"><span className="text-gray-400">github</span>: <span className="text-gray-300">"{resume.github}"</span></p>}
          <p>{'}'}</p>
        </div>
      </div>

      {resume.summary && (
        <section className="mb-5 bg-white p-4 rounded-lg border border-gray-200">
          <h2 className="text-xs font-bold text-gray-500 uppercase mb-2">// README.md</h2>
          <p className="text-gray-700 font-sans">{resume.summary}</p>
        </section>
      )}

      {resume.skills?.length > 0 && (
        <section className="mb-5 bg-white p-4 rounded-lg border border-gray-200">
          <h2 className="text-xs font-bold text-gray-500 uppercase mb-2">// tech_stack</h2>
          <div className="flex flex-wrap gap-2">
            {resume.skills.map((skill, i) => (
              <span key={i} className="px-2 py-1 bg-gray-900 text-green-400 rounded text-xs">
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {resume.experience?.length > 0 && (
        <section className="mb-5 bg-white p-4 rounded-lg border border-gray-200">
          <h2 className="text-xs font-bold text-gray-500 uppercase mb-3">// work_history</h2>
          {resume.experience.map((exp, i) => (
            <div key={i} className="mb-4 last:mb-0 font-sans">
              <div className="flex items-center gap-2">
                <span className="text-green-600 font-mono">▶</span>
                <span className="font-bold">{exp.position}</span>
              </div>
              <p className="text-gray-600 text-xs ml-5">@{exp.company}</p>
              <p className="text-gray-400 text-xs ml-5 mb-1">{exp.startDate} → {exp.endDate || 'present'}</p>
              {exp.serviceBased && exp.clientProjects?.length > 0 ? (
                <div className="ml-5 mt-2 space-y-2">
                  {exp.clientProjects.map((client, ci) => (
                    <div key={ci} className="bg-gray-50 p-2 rounded border-l-2 border-green-500">
                      <span className="text-green-500 font-mono text-xs">└──</span>
                      <span className="font-medium text-xs ml-1">{client.clientName}</span>
                      <span className="text-gray-400 text-xs"> ({client.startDate} → {client.endDate || 'present'})</span>
                      {client.role && <p className="text-gray-500 text-xs ml-4">{client.role}</p>}
                      {client.highlights?.map((h, j) => (
                        <p key={j} className="text-gray-600 text-xs ml-4">- {h}</p>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                exp.highlights?.map((h, j) => (
                  <p key={j} className="text-gray-600 text-xs ml-5">- {h}</p>
                ))
              )}
            </div>
          ))}
        </section>
      )}

      {resume.projects?.length > 0 && (
        <section className="bg-white p-4 rounded-lg border border-gray-200">
          <h2 className="text-xs font-bold text-gray-500 uppercase mb-3">// projects</h2>
          {resume.projects.map((proj, i) => (
            <div key={i} className="mb-3 last:mb-0 font-sans">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 font-mono">★</span>
                <span className="font-bold">{proj.name}</span>
              </div>
              {proj.description && <p className="text-gray-600 text-xs ml-5">{proj.description}</p>}
              {proj.technologies?.length > 0 && (
                <div className="ml-5 mt-1 flex flex-wrap gap-1">
                  {proj.technologies.map((tech, ti) => (
                    <span key={ti} className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                      {tech}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
