import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Learning() {
    const navigate = useNavigate();
    const [banks, setBanks] = useState([]);
    const [selectedBank, setSelectedBank] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [filteredQuestions, setFilteredQuestions] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [viewMode, setViewMode] = useState('flashcard'); // flashcard or list

    const categories = [
        { id: 'hr', name: 'HR', icon: '👔' },
        { id: 'technical', name: 'Technical', icon: '💻' },
        { id: 'coding', name: 'Coding', icon: '⌨️' },
        { id: 'technical_coding', name: 'Technical+Coding', icon: '🚀' },
        { id: 'mixed', name: 'Mixed', icon: '🎯' }
    ];

    useEffect(() => {
        fetchBanks();
    }, []);

    useEffect(() => {
        if (searchQuery.trim()) {
            const filtered = questions.filter(q =>
                q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (q.answer && q.answer.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (q.tags && q.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
            );
            setFilteredQuestions(filtered);
        } else {
            setFilteredQuestions(questions);
        }
    }, [searchQuery, questions]);

    const fetchBanks = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/question-banks', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setBanks(data);
            }
        } catch (error) {
            console.error('Error fetching banks:', error);
        }
    };

    const selectBank = (bank) => {
        setSelectedBank(bank);
        const parsedQuestions = JSON.parse(bank.questions || '[]');
        setQuestions(parsedQuestions);
        setFilteredQuestions(parsedQuestions);
        setCurrentQuestionIndex(0);
        setShowAnswer(false);
        setSearchQuery('');
    };

    const nextQuestion = () => {
        if (currentQuestionIndex < filteredQuestions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setShowAnswer(false);
        }
    };

    const prevQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
            setShowAnswer(false);
        }
    };

    const currentQuestion = filteredQuestions[currentQuestionIndex];

    return (
        <div className="min-h-screen bg-white dark:bg-black py-8">
            <div className="max-w-6xl mx-auto px-4">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/')}
                        className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-4"
                    >
                        ← Back to Dashboard
                    </button>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-2">
                                📚 Learning Center
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                Study and revise your question banks
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/question-banks')}
                            className="btn btn-secondary"
                        >
                            Manage Banks
                        </button>
                    </div>
                </div>

                {!selectedBank ? (
                    /* Bank Selection */
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-6">
                            Select a Question Bank
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {banks.map((bank) => {
                                const category = categories.find(c => c.id === bank.category);
                                const questionCount = JSON.parse(bank.questions || '[]').length;

                                return (
                                    <button
                                        key={bank.id}
                                        onClick={() => selectBank(bank)}
                                        className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl p-6 hover:border-gray-400 dark:hover:border-gray-600 transition-all text-left"
                                    >
                                        <div className="text-3xl mb-4">{category?.icon || '📝'}</div>
                                        <h3 className="font-semibold text-gray-900 dark:text-gray-50 mb-2">
                                            {bank.name}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                            {bank.description || 'No description'}
                                        </p>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-gray-600 dark:text-gray-400">
                                                {questionCount} questions
                                            </span>
                                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-900 rounded">
                                                {category?.name}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}

                            {banks.length === 0 && (
                                <div className="col-span-full text-center py-12">
                                    <div className="text-6xl mb-4">📚</div>
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-2">
                                        No Question Banks Yet
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                                        Create a question bank to start learning
                                    </p>
                                    <button
                                        onClick={() => navigate('/question-banks')}
                                        className="btn btn-primary"
                                    >
                                        Create Question Bank
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    /* Learning Interface */
                    <div>
                        {/* Bank Header */}
                        <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl p-6 mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => {
                                            setSelectedBank(null);
                                            setQuestions([]);
                                            setFilteredQuestions([]);
                                        }}
                                        className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                                    >
                                        ← Back
                                    </button>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50">
                                            {selectedBank.name}
                                        </h2>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {filteredQuestions.length} questions
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setViewMode('flashcard')}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'flashcard'
                                            ? 'bg-gray-900 dark:bg-gray-50 text-white dark:text-gray-900'
                                            : 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300'
                                            }`}
                                    >
                                        🃏 Flashcard
                                    </button>
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'list'
                                            ? 'bg-gray-900 dark:bg-gray-50 text-white dark:text-gray-900'
                                            : 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300'
                                            }`}
                                    >
                                        📋 List
                                    </button>
                                </div>
                            </div>

                            {/* Search Bar */}
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="🔍 Search questions, answers, or tags..."
                                    className="w-full pl-4 pr-10"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        </div>

                        {filteredQuestions.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-6xl mb-4">🔍</div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-2">
                                    No questions found
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Try a different search term
                                </p>
                            </div>
                        ) : viewMode === 'flashcard' ? (
                            /* Flashcard Mode */
                            <div className="max-w-3xl mx-auto">
                                <div className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-2xl p-8 min-h-[400px] flex flex-col justify-between">
                                    {/* Question */}
                                    <div>
                                        <div className="flex items-center justify-between mb-6">
                                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                Question {currentQuestionIndex + 1} of {filteredQuestions.length}
                                            </span>
                                            <div className="flex gap-2">
                                                {currentQuestion.topic && (
                                                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-medium rounded-full">
                                                        📂 {currentQuestion.topic}
                                                    </span>
                                                )}
                                                {currentQuestion.difficulty && (
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${currentQuestion.difficulty === 'easy'
                                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                                        : currentQuestion.difficulty === 'medium'
                                                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                                                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                                        }`}>
                                                        {currentQuestion.difficulty}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-50 mb-4">
                                            {currentQuestion.question}
                                        </h3>
                                        {currentQuestion.tags && currentQuestion.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mb-6">
                                                {currentQuestion.tags.map((tag, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="px-2 py-1 bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 text-xs rounded"
                                                    >
                                                        #{tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* Answer */}
                                        {showAnswer && currentQuestion.answer && (
                                            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                                <div className="text-sm font-medium text-green-700 dark:text-green-400 mb-2">
                                                    Answer:
                                                </div>
                                                <div className="text-gray-900 dark:text-gray-50 whitespace-pre-wrap">
                                                    {currentQuestion.answer}
                                                </div>
                                            </div>
                                        )}
                                        {showAnswer && !currentQuestion.answer && (
                                            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg">
                                                <div className="text-gray-500 dark:text-gray-400 text-center">
                                                    No answer provided for this question
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Controls */}
                                    <div className="flex items-center justify-between mt-8">
                                        <button
                                            onClick={prevQuestion}
                                            disabled={currentQuestionIndex === 0}
                                            className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            ← Previous
                                        </button>
                                        <button
                                            onClick={() => setShowAnswer(!showAnswer)}
                                            className="btn btn-primary"
                                        >
                                            {showAnswer ? 'Hide Answer' : 'Show Answer'}
                                        </button>
                                        <button
                                            onClick={nextQuestion}
                                            disabled={currentQuestionIndex === filteredQuestions.length - 1}
                                            className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Next →
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* List Mode */
                            <div className="space-y-6">
                                {(() => {
                                    // Group questions by topic
                                    const groupedByTopic = filteredQuestions.reduce((acc, q) => {
                                        const topic = q.topic || 'Uncategorized';
                                        if (!acc[topic]) {
                                            acc[topic] = [];
                                        }
                                        acc[topic].push(q);
                                        return acc;
                                    }, {});

                                    return Object.entries(groupedByTopic).map(([topic, topicQuestions]) => (
                                        <div key={topic}>
                                            {/* Topic Header */}
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800"></div>
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-50 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                                    📂 {topic} ({topicQuestions.length})
                                                </h3>
                                                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800"></div>
                                            </div>

                                            {/* Questions in this topic */}
                                            <div className="space-y-4">
                                                {topicQuestions.map((q, idx) => {
                                                    const globalIdx = filteredQuestions.indexOf(q);
                                                    return (
                                                        <div
                                                            key={globalIdx}
                                                            className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl p-6"
                                                        >
                                                            <div className="flex items-start justify-between mb-3">
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-3 mb-2">
                                                                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                                            Q{globalIdx + 1}
                                                                        </span>
                                                                        {q.difficulty && (
                                                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${q.difficulty === 'easy'
                                                                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                                                                    : q.difficulty === 'medium'
                                                                                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                                                                                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                                                                }`}>
                                                                                {q.difficulty}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-3">
                                                                        {q.question}
                                                                    </h4>
                                                                    {q.answer && (
                                                                        <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                                                            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                                                                Answer:
                                                                            </div>
                                                                            <div className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap">
                                                                                {q.answer}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                    {!q.answer && (
                                                                        <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                                                                            No answer provided
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {q.tags && q.tags.length > 0 && (
                                                                <div className="flex flex-wrap gap-2 mt-3">
                                                                    {q.tags.map((tag, tagIdx) => (
                                                                        <span
                                                                            key={tagIdx}
                                                                            className="px-2 py-1 bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 text-xs rounded"
                                                                        >
                                                                            #{tag}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ));
                                })()}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
