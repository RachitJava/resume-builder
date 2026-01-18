import { useState } from 'react';

export default function ResumeForm({ resume, onChange }) {
  const [activeSection, setActiveSection] = useState('personal');

  const updateField = (field, value) => {
    onChange({ ...resume, [field]: value });
  };

  const addExperience = () => {
    onChange({
      ...resume,
      experience: [...(resume.experience || []), {
        company: '',
        position: '',
        startDate: '',
        endDate: '',
        description: '',
        highlights: [],
        serviceBased: false,
        clientProjects: [],
      }],
    });
  };

  const updateExperience = (index, field, value) => {
    const updated = [...resume.experience];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...resume, experience: updated });
  };

  const removeExperience = (index) => {
    onChange({ ...resume, experience: resume.experience.filter((_, i) => i !== index) });
  };

  // Client Project handlers for service-based companies
  const addClientProject = (expIndex) => {
    const updated = [...resume.experience];
    const clientProjects = updated[expIndex].clientProjects || [];
    updated[expIndex] = {
      ...updated[expIndex],
      clientProjects: [...clientProjects, {
        clientName: '',
        projectName: '',
        role: '',
        startDate: '',
        endDate: '',
        description: '',
        highlights: [],
      }],
    };
    onChange({ ...resume, experience: updated });
  };

  const updateClientProject = (expIndex, clientIndex, field, value) => {
    const updated = [...resume.experience];
    const clientProjects = [...updated[expIndex].clientProjects];
    clientProjects[clientIndex] = { ...clientProjects[clientIndex], [field]: value };
    updated[expIndex] = { ...updated[expIndex], clientProjects };
    onChange({ ...resume, experience: updated });
  };

  const removeClientProject = (expIndex, clientIndex) => {
    const updated = [...resume.experience];
    updated[expIndex] = {
      ...updated[expIndex],
      clientProjects: updated[expIndex].clientProjects.filter((_, i) => i !== clientIndex),
    };
    onChange({ ...resume, experience: updated });
  };

  const addEducation = () => {
    onChange({
      ...resume,
      education: [...(resume.education || []), {
        institution: '',
        degree: '',
        field: '',
        startDate: '',
        endDate: '',
        gpa: '',
      }],
    });
  };

  const updateEducation = (index, field, value) => {
    const updated = [...resume.education];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...resume, education: updated });
  };

  const removeEducation = (index) => {
    onChange({ ...resume, education: resume.education.filter((_, i) => i !== index) });
  };

  const addProject = () => {
    onChange({
      ...resume,
      projects: [...(resume.projects || []), {
        name: '',
        description: '',
        url: '',
        technologies: [],
      }],
    });
  };

  const updateProject = (index, field, value) => {
    const updated = [...resume.projects];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...resume, projects: updated });
  };

  const removeProject = (index) => {
    onChange({ ...resume, projects: resume.projects.filter((_, i) => i !== index) });
  };

  const sections = [
    { id: 'personal', label: 'Personal', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { id: 'experience', label: 'Experience', icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    { id: 'education', label: 'Education', icon: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222' },
    { id: 'skills', label: 'Skills', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
    { id: 'projects', label: 'Projects', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' },
  ];

  return (
    <div className="bg-white dark:bg-[#18181B] border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
      {/* Section Navigation */}
      <div className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#27272A]">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-smooth border-b-2 ${activeSection === section.id
                ? 'border-gray-900 dark:border-gray-50 text-gray-900 dark:text-gray-50 bg-white dark:bg-[#18181B]'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-[#18181B]/50'
              }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={section.icon} />
            </svg>
            {section.label}
          </button>
        ))}
      </div>

      {/* Form Content */}
      <div className="p-6 space-y-5 max-h-[calc(100vh-300px)] overflow-y-auto">
        {/* Personal Section */}
        {activeSection === 'personal' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-50 mb-2">Full Name *</label>
              <input
                type="text"
                value={resume.fullName}
                onChange={(e) => updateField('fullName', e.target.value)}
                placeholder="John Doe"
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-50 mb-2">Email</label>
                <input
                  type="email"
                  value={resume.email || ''}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="john@example.com"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-50 mb-2">Phone</label>
                <input
                  type="tel"
                  value={resume.phone || ''}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="+1 234 567 8900"
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-50 mb-2">Location</label>
              <input
                type="text"
                value={resume.location || ''}
                onChange={(e) => updateField('location', e.target.value)}
                placeholder="New York, NY"
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-50 mb-2">LinkedIn</label>
                <input
                  type="url"
                  value={resume.linkedIn || ''}
                  onChange={(e) => updateField('linkedIn', e.target.value)}
                  placeholder="linkedin.com/in/johndoe"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-50 mb-2">GitHub</label>
                <input
                  type="url"
                  value={resume.github || ''}
                  onChange={(e) => updateField('github', e.target.value)}
                  placeholder="github.com/johndoe"
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-50 mb-2">Website</label>
              <input
                type="url"
                value={resume.website || ''}
                onChange={(e) => updateField('website', e.target.value)}
                placeholder="johndoe.com"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-50 mb-2">Professional Summary</label>
              <textarea
                value={resume.summary || ''}
                onChange={(e) => updateField('summary', e.target.value)}
                placeholder="A brief summary of your professional background and goals..."
                rows={4}
                className="w-full resize-none"
              />
            </div>
          </div>
        )}

        {/* Experience Section */}
        {activeSection === 'experience' && (
          <div className="space-y-5">
            {(resume.experience || []).map((exp, index) => (
              <div key={index} className="p-4 bg-gray-50 dark:bg-[#27272A] rounded-lg border border-gray-200 dark:border-gray-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-300">Experience {index + 1}</span>
                  <button
                    onClick={() => removeExperience(index)}
                    className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-smooth"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1.5">Company</label>
                    <input
                      type="text"
                      value={exp.company}
                      onChange={(e) => updateExperience(index, 'company', e.target.value)}
                      placeholder="Company Name"
                      className="w-full text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1.5">Position</label>
                    <input
                      type="text"
                      value={exp.position}
                      onChange={(e) => updateExperience(index, 'position', e.target.value)}
                      placeholder="Job Title"
                      className="w-full text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1.5">Start Date</label>
                    <input
                      type="text"
                      value={exp.startDate}
                      onChange={(e) => updateExperience(index, 'startDate', e.target.value)}
                      placeholder="Jan 2022"
                      className="w-full text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1.5">End Date</label>
                    <input
                      type="text"
                      value={exp.endDate || ''}
                      onChange={(e) => updateExperience(index, 'endDate', e.target.value)}
                      placeholder="Present"
                      className="w-full text-sm"
                    />
                  </div>
                </div>

                {/* Service-Based Company Toggle */}
                <div className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-lg border border-gray-700/30">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={exp.serviceBased || false}
                      onChange={(e) => updateExperience(index, 'serviceBased', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-black dark:bg-white"></div>
                  </label>
                  <div>
                    <span className="text-sm font-medium text-gray-200">Service-Based Company</span>
                    <p className="text-xs text-gray-500">Enable for consulting firms (TCS, Cognizant, Accenture, etc.)</p>
                  </div>
                </div>

                {/* Regular Experience Fields */}
                {!exp.serviceBased && (
                  <>
                    <div>
                      <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
                      <textarea
                        value={exp.description || ''}
                        onChange={(e) => updateExperience(index, 'description', e.target.value)}
                        placeholder="Brief job description..."
                        rows={2}
                        className="w-full text-sm resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1.5">Key Highlights (one per line)</label>
                      <textarea
                        value={(exp.highlights || []).join('\n')}
                        onChange={(e) => updateExperience(index, 'highlights', e.target.value.split('\n').filter(h => h.trim()))}
                        placeholder="Achieved 20% increase in sales&#10;Led team of 5 developers&#10;Implemented new CI/CD pipeline"
                        rows={3}
                        className="w-full text-sm resize-none"
                      />
                    </div>
                  </>
                )}

                {/* Client Projects for Service-Based Companies */}
                {exp.serviceBased && (
                  <div className="space-y-4 mt-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-black dark:text-white flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        Client Projects
                      </h4>
                    </div>

                    {(exp.clientProjects || []).map((client, clientIndex) => (
                      <div key={clientIndex} className="p-3 bg-gray-900/50 rounded-lg border border-black dark:border-white/20 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-black dark:text-white">Client {clientIndex + 1}</span>
                          <button
                            onClick={() => removeClientProject(index, clientIndex)}
                            className="p-1 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-smooth"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1.5">Client Name</label>
                            <input
                              type="text"
                              value={client.clientName || ''}
                              onChange={(e) => updateClientProject(index, clientIndex, 'clientName', e.target.value)}
                              placeholder="e.g., Verizon"
                              className="w-full text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1.5">Project Name</label>
                            <input
                              type="text"
                              value={client.projectName || ''}
                              onChange={(e) => updateClientProject(index, clientIndex, 'projectName', e.target.value)}
                              placeholder="e.g., Network Automation"
                              className="w-full text-sm"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1.5">Role at Client</label>
                          <input
                            type="text"
                            value={client.role || ''}
                            onChange={(e) => updateClientProject(index, clientIndex, 'role', e.target.value)}
                            placeholder="e.g., Senior Developer"
                            className="w-full text-sm"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1.5">Start Date</label>
                            <input
                              type="text"
                              value={client.startDate || ''}
                              onChange={(e) => updateClientProject(index, clientIndex, 'startDate', e.target.value)}
                              placeholder="Jan 2022"
                              className="w-full text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1.5">End Date</label>
                            <input
                              type="text"
                              value={client.endDate || ''}
                              onChange={(e) => updateClientProject(index, clientIndex, 'endDate', e.target.value)}
                              placeholder="Dec 2023"
                              className="w-full text-sm"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1.5">Key Highlights (one per line)</label>
                          <textarea
                            value={(client.highlights || []).join('\n')}
                            onChange={(e) => updateClientProject(index, clientIndex, 'highlights', e.target.value.split('\n').filter(h => h.trim()))}
                            placeholder="Built microservices architecture&#10;Reduced API response time by 40%"
                            rows={3}
                            className="w-full text-sm resize-none"
                          />
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={() => addClientProject(index)}
                      className="w-full py-2 px-3 text-xs font-medium text-black dark:text-white border border-black dark:border-white/30 rounded-lg hover:bg-black dark:bg-white/10 transition-smooth flex items-center justify-center gap-2"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Client Project
                    </button>
                  </div>
                )}
              </div>
            ))}

            <button onClick={addExperience} className="w-full btn btn-secondary text-sm">
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Experience
              </span>
            </button>
          </div>
        )}

        {/* Education Section */}
        {activeSection === 'education' && (
          <div className="space-y-5">
            {(resume.education || []).map((edu, index) => (
              <div key={index} className="p-4 bg-gray-50 dark:bg-[#27272A] rounded-lg border border-gray-200 dark:border-gray-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-300">Education {index + 1}</span>
                  <button
                    onClick={() => removeEducation(index)}
                    className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-smooth"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div>
                  <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1.5">Institution</label>
                  <input
                    type="text"
                    value={edu.institution}
                    onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                    placeholder="University Name"
                    className="w-full text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1.5">Degree</label>
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                      placeholder="Bachelor's"
                      className="w-full text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1.5">Field of Study</label>
                    <input
                      type="text"
                      value={edu.field}
                      onChange={(e) => updateEducation(index, 'field', e.target.value)}
                      placeholder="Computer Science"
                      className="w-full text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1.5">Start Date</label>
                    <input
                      type="text"
                      value={edu.startDate}
                      onChange={(e) => updateEducation(index, 'startDate', e.target.value)}
                      placeholder="2018"
                      className="w-full text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1.5">End Date</label>
                    <input
                      type="text"
                      value={edu.endDate || ''}
                      onChange={(e) => updateEducation(index, 'endDate', e.target.value)}
                      placeholder="2022"
                      className="w-full text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1.5">GPA</label>
                    <input
                      type="text"
                      value={edu.gpa || ''}
                      onChange={(e) => updateEducation(index, 'gpa', e.target.value)}
                      placeholder="3.8"
                      className="w-full text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}

            <button onClick={addEducation} className="w-full btn btn-secondary text-sm">
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Education
              </span>
            </button>
          </div>
        )}

        {/* Skills Section */}
        {activeSection === 'skills' && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-50 mb-2">Skills (one per line)</label>
              <textarea
                value={(resume.skills || []).join('\n')}
                onChange={(e) => updateField('skills', e.target.value.split('\n').filter(s => s.trim()))}
                placeholder="JavaScript&#10;React&#10;Node.js&#10;Python&#10;SQL"
                rows={8}
                className="w-full resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-50 mb-2">Certifications (one per line)</label>
              <textarea
                value={(resume.certifications || []).join('\n')}
                onChange={(e) => updateField('certifications', e.target.value.split('\n').filter(c => c.trim()))}
                placeholder="AWS Solutions Architect&#10;Google Cloud Professional&#10;PMP Certification"
                rows={4}
                className="w-full resize-none"
              />
            </div>
          </div>
        )}

        {/* Projects Section */}
        {activeSection === 'projects' && (
          <div className="space-y-5">
            {(resume.projects || []).map((proj, index) => (
              <div key={index} className="p-4 bg-gray-50 dark:bg-[#27272A] rounded-lg border border-gray-200 dark:border-gray-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-300">Project {index + 1}</span>
                  <button
                    onClick={() => removeProject(index)}
                    className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-smooth"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div>
                  <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1.5">Project Name</label>
                  <input
                    type="text"
                    value={proj.name}
                    onChange={(e) => updateProject(index, 'name', e.target.value)}
                    placeholder="My Awesome Project"
                    className="w-full text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
                  <textarea
                    value={proj.description || ''}
                    onChange={(e) => updateProject(index, 'description', e.target.value)}
                    placeholder="Brief project description..."
                    rows={2}
                    className="w-full text-sm resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1.5">Project URL</label>
                  <input
                    type="url"
                    value={proj.url || ''}
                    onChange={(e) => updateProject(index, 'url', e.target.value)}
                    placeholder="https://github.com/..."
                    className="w-full text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1.5">Technologies (comma separated)</label>
                  <input
                    type="text"
                    value={(proj.technologies || []).join(', ')}
                    onChange={(e) => updateProject(index, 'technologies', e.target.value.split(',').map(t => t.trim()).filter(t => t))}
                    placeholder="React, Node.js, MongoDB"
                    className="w-full text-sm"
                  />
                </div>
              </div>
            ))}

            <button onClick={addProject} className="w-full btn btn-secondary text-sm">
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Project
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
