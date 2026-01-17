import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import templateApi from '../api/templateApi';

const countryFlags = {
  usa: '🇺🇸',
  australia: '🇦🇺',
  uk: '🇬🇧',
  india: '🇮🇳',
  europe: '🇪🇺'
};

const countryColors = {
  usa: 'from-blue-500/20 to-red-500/20',
  australia: 'from-green-500/20 to-yellow-500/20',
  uk: 'from-blue-600/20 to-red-600/20',
  india: 'from-orange-500/20 to-green-500/20',
  europe: 'from-blue-500/20 to-yellow-500/20'
};

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [countries, setCountries] = useState({});
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [templatesData, countriesData] = await Promise.all([
        templateApi.getAll(),
        templateApi.getCountries()
      ]);
      setTemplates(templatesData);
      setCountries(countriesData);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = (template) => {
    navigate('/editor', { 
      state: { 
        templateId: template.id,
        baseStyle: template.baseStyle,
        sample: template.sample 
      } 
    });
  };

  const handleUseSample = async (template) => {
    navigate('/editor', { 
      state: { 
        templateId: template.id,
        baseStyle: template.baseStyle,
        sample: template.sample,
        useSample: true 
      } 
    });
  };

  const filteredTemplates = selectedCountry === 'all' 
    ? templates 
    : templates.filter(t => t.country === selectedCountry);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="font-display text-4xl font-bold text-ink-100">
          Choose Your <span className="text-accent">Template</span>
        </h1>
        <p className="text-ink-400 text-lg max-w-2xl mx-auto">
          Select a template optimized for your target country. Each template follows local hiring standards and best practices.
        </p>
      </div>

      {/* Country Filter */}
      <div className="flex flex-wrap justify-center gap-3">
        <button
          onClick={() => setSelectedCountry('all')}
          className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-smooth ${
            selectedCountry === 'all'
              ? 'bg-accent text-white'
              : 'bg-ink-800/50 text-ink-300 hover:bg-ink-800 hover:text-ink-100'
          }`}
        >
          🌍 All Templates
        </button>
        {Object.entries(countries).map(([code, name]) => (
          <button
            key={code}
            onClick={() => setSelectedCountry(code)}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-smooth ${
              selectedCountry === code
                ? 'bg-accent text-white'
                : 'bg-ink-800/50 text-ink-300 hover:bg-ink-800 hover:text-ink-100'
            }`}
          >
            {countryFlags[code]} {name}
          </button>
        ))}
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            className="group bg-ink-900/50 border border-ink-800 rounded-2xl overflow-hidden hover:border-ink-700 transition-smooth"
          >
            {/* Preview Header */}
            <div className={`h-32 bg-gradient-to-br ${countryColors[template.country]} relative overflow-hidden`}>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-28 bg-white rounded shadow-lg transform group-hover:scale-105 transition-transform">
                  <div className="p-2 space-y-1">
                    <div className="h-2 w-10 bg-ink-200 rounded"></div>
                    <div className="h-1 w-14 bg-ink-100 rounded"></div>
                    <div className="h-1 w-12 bg-ink-100 rounded"></div>
                    <div className="mt-2 h-1 w-8 bg-accent/50 rounded"></div>
                    <div className="space-y-0.5">
                      <div className="h-0.5 w-full bg-ink-100 rounded"></div>
                      <div className="h-0.5 w-full bg-ink-100 rounded"></div>
                      <div className="h-0.5 w-10 bg-ink-100 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute top-3 right-3">
                <span className="text-2xl">{countryFlags[template.country]}</span>
              </div>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              <div>
                <h3 className="font-semibold text-ink-100 text-lg">{template.name}</h3>
                <p className="text-ink-400 text-sm mt-1">{template.description}</p>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  template.baseStyle === 'modern' ? 'bg-blue-500/10 text-blue-400' :
                  template.baseStyle === 'classic' ? 'bg-amber-500/10 text-amber-400' :
                  'bg-emerald-500/10 text-emerald-400'
                }`}>
                  {template.baseStyle}
                </span>
                <span className="text-ink-500 text-xs">
                  {countries[template.country]}
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => handleSelectTemplate(template)}
                  className="flex-1 btn btn-primary text-sm py-2.5"
                >
                  Use Template
                </button>
                <button
                  onClick={() => handleUseSample(template)}
                  className="btn btn-secondary text-sm py-2.5 px-4"
                  title="Use with sample data"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <p className="text-ink-400">No templates found for this selection.</p>
        </div>
      )}
    </div>
  );
}

