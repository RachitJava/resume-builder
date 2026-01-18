import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import samplesApi from '../api/samplesApi';

export default function ProfessionalSamples() {
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    loadSamples();
  }, []);

  const loadSamples = async () => {
    try {
      const data = await samplesApi.getAll();
      setSamples(data);
    } catch (error) {
      console.error('Failed to load samples:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUseSample = async (professionId) => {
    try {
      const sampleData = await samplesApi.getByProfession(professionId);
      navigate('/editor', { state: { sample: sampleData, useSample: true } });
    } catch (error) {
      console.error('Failed to load sample:', error);
    }
  };

  const categories = ['all', ...new Set(samples.map(s => s.category))];
  const filteredSamples = selectedCategory === 'all'
    ? samples
    : samples.filter(s => s.category === selectedCategory);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="w-6 h-6 border-2 border-black dark:border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Professional Samples</h2>
        <p className="text-sm text-gray-700 dark:text-gray-300 dark:text-gray-400">Start with a pre-built resume</p>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto invisible-scrollbar pb-2 whitespace-nowrap min-w-full">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-smooth ${selectedCategory === category
              ? 'bg-black dark:bg-white text-white dark:text-black'
              : 'bg-gray-50 dark:bg-[#27272A] text-gray-700 dark:text-gray-300 dark:text-gray-400 hover:bg-gray-100 dark:bg-[#27272A] hover:text-gray-900 dark:text-gray-100'
              }`}
          >
            {category === 'all' ? 'All Professions' : category}
          </button>
        ))}
      </div>

      {/* Samples Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        {filteredSamples.map((sample) => (
          <button
            key={sample.id}
            onClick={() => handleUseSample(sample.id)}
            className="group p-4 bg-white dark:bg-[#18181B] border border-gray-200 dark:border-gray-800 rounded-xl text-left hover:border-black dark:border-white/50 hover:bg-white dark:bg-[#18181B] transition-all hover:scale-105"
          >
            <div className="text-3xl mb-3">{sample.icon}</div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm group-hover:text-black dark:text-white transition-colors">
              {sample.title}
            </h3>
            <p className="text-xs text-gray-700 dark:text-gray-300 dark:text-gray-400 mt-1">{sample.category}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

