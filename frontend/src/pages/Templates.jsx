import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import templateApi from '../api/templateApi';
import ScaledPreview from '../components/LiveResumePreview';

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
  const [previewData, setPreviewData] = useState(null);
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

  const fetchAndNavigate = async (template, useSample = true) => {
    setLoading(true);
    try {
      // Always fetch fresh sample data to ensure fields like jobTitle are present
      const sampleData = await templateApi.getSample(template.id);

      navigate('/editor', {
        state: {
          templateId: template.id,
          baseStyle: template.baseStyle,
          sample: sampleData,
          useSample: useSample
        }
      });
    } catch (error) {
      console.error('Failed to fetch template sample:', error);
      // Fallback navigation without sample data if fetch fails
      navigate('/editor', {
        state: {
          templateId: template.id,
          baseStyle: template.baseStyle,
          useSample: false
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = (template) => {
    fetchAndNavigate(template, true);
  };

  const handleUseSample = (template) => {
    fetchAndNavigate(template, true);
  };

  const filteredTemplates = selectedCountry === 'all'
    ? templates
    : templates.filter(t => t.country === selectedCountry);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-black dark:border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="font-display text-4xl font-bold text-gray-900 dark:text-gray-50">
          Choose Your <span className="text-black dark:text-white">Template</span>
        </h1>
        <p className="text-gray-700 dark:text-gray-300 dark:text-gray-400 text-lg max-w-2xl mx-auto">
          Select a template optimized for your target country. Each template follows local hiring standards and best practices.
        </p>
      </div>

      {/* Country Filter */}
      <div className="flex flex-wrap justify-center gap-2 md:gap-3">
        <button
          onClick={() => setSelectedCountry('all')}
          className={`px-4 md:px-5 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-medium transition-smooth ${selectedCountry === 'all'
            ? 'bg-black dark:bg-white text-white dark:text-black'
            : 'bg-gray-50 dark:bg-[#27272A] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:text-gray-50'
            }`}
        >
          🌍 All Templates
        </button>
        {Object.entries(countries).map(([code, name]) => (
          <button
            key={code}
            onClick={() => setSelectedCountry(code)}
            className={`px-4 md:px-5 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-medium transition-smooth ${selectedCountry === code
              ? 'bg-black dark:bg-white text-white dark:text-black'
              : 'bg-gray-50 dark:bg-[#27272A] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:text-gray-50'
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
            onDoubleClick={() => setPreviewData(template)}
            className="group bg-white dark:bg-[#18181B] border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden hover:border-gray-300 dark:border-gray-700 transition-smooth cursor-pointer"
          >
            {/* Preview Header */}
            <div className="w-full bg-gray-100 dark:bg-[#27272A] relative overflow-hidden" onClick={() => setPreviewData(template)}>
              <ScaledPreview template={template.baseStyle} className="w-full" />

              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
              <div className="absolute top-3 right-3 bg-white/90 dark:bg-black/90 backdrop-blur-sm rounded-full w-8 h-8 flex items-center justify-center shadow-sm z-10">
                <span className="text-lg">{countryFlags[template.country]}</span>
              </div>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-50 text-lg">{template.name}</h3>
                <p className="text-gray-700 dark:text-gray-300 dark:text-gray-400 text-sm mt-1">{template.description}</p>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${template.baseStyle === 'modern' ? 'bg-blue-500/10 text-blue-400' :
                  template.baseStyle === 'classic' ? 'bg-amber-500/10 text-amber-400' :
                    'bg-emerald-500/10 text-emerald-400'
                  }`}>
                  {template.baseStyle}
                </span>
                <span className="text-gray-700 dark:text-gray-300 dark:text-gray-400 text-xs">
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
          <p className="text-gray-700 dark:text-gray-300 dark:text-gray-400">No templates found for this selection.</p>
        </div>
      )}

      {/* Preview Modal */}
      {previewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm" onClick={() => setPreviewData(null)}>
          <div className="relative max-w-4xl max-h-[85vh] sm:max-h-[90vh] w-full bg-white dark:bg-[#18181B] rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-3 sm:p-4 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
              <h3 className="text-base sm:text-xl font-bold truncate pr-2">{previewData.name} Preview</h3>
              <button onClick={() => setPreviewData(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors flex-shrink-0">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-gray-100 dark:bg-[#0A0A0A] min-h-0">
              <div className="max-w-3xl mx-auto shadow-2xl">
                <ScaledPreview template={previewData.baseStyle} />
              </div>
            </div>
            <div className="p-3 sm:p-4 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-2 sm:gap-3 bg-white dark:bg-[#18181B] flex-shrink-0">
              <button onClick={() => setPreviewData(null)} className="btn btn-secondary text-sm sm:text-base px-3 sm:px-4">Close</button>
              <button onClick={() => handleSelectTemplate(previewData)} className="btn btn-primary text-sm sm:text-base px-3 sm:px-4">Use Template</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

