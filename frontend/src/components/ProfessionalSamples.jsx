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
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-ink-100">Professional Samples</h2>
        <p className="text-sm text-ink-400">Start with a pre-built resume</p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-smooth ${
              selectedCategory === category
                ? 'bg-accent text-white'
                : 'bg-ink-800/50 text-ink-400 hover:bg-ink-800 hover:text-ink-200'
            }`}
          >
            {category === 'all' ? 'All Professions' : category}
          </button>
        ))}
      </div>

      {/* Samples Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {filteredSamples.map((sample) => (
          <button
            key={sample.id}
            onClick={() => handleUseSample(sample.id)}
            className="group p-4 bg-ink-900/50 border border-ink-800 rounded-xl text-left hover:border-accent/50 hover:bg-ink-900/80 transition-all hover:scale-105"
          >
            <div className="text-3xl mb-3">{sample.icon}</div>
            <h3 className="font-medium text-ink-200 text-sm group-hover:text-accent transition-colors">
              {sample.title}
            </h3>
            <p className="text-xs text-ink-500 mt-1">{sample.category}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

