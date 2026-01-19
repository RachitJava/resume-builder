import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function QuestionBanks() {
    const navigate = useNavigate();
    const [banks, setBanks] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [newBank, setNewBank] = useState({
        name: '',
        category: 'technical',
        description: '',
        questions: []
    });
    const [uploadData, setUploadData] = useState({
        name: '',
        category: 'technical',
        description: '',
        file: null
    });
    const [editingId, setEditingId] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState({
        question: '',
        answer: '',
        difficulty: 'medium',
        tags: ''
    });

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

    const addQuestion = () => {
        if (!currentQuestion.question.trim()) {
            alert('Question is required');
            return;
        }

        const question = {
            question: currentQuestion.question,
            answer: currentQuestion.answer || 'Not provided',
            difficulty: currentQuestion.difficulty,
            tags: currentQuestion.tags.split(',').map(t => t.trim()).filter(t => t)
        };

        setNewBank({
            ...newBank,
            questions: [...newBank.questions, question]
        });

        setCurrentQuestion({
            question: '',
            answer: '',
            difficulty: 'medium',
            tags: ''
        });
    };

    const removeQuestion = (index) => {
        setNewBank({
            ...newBank,
            questions: newBank.questions.filter((_, i) => i !== index)
        });
    };

    const saveBank = async () => {
        if (!newBank.name || newBank.questions.length === 0) {
            alert('Please provide a name and at least one question');
            return;
        }

        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const url = editingId
                ? `/api/question-banks/${editingId}`
                : '/api/question-banks';
            const method = editingId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newBank)
            });

            if (response.ok) {
                await fetchBanks();
                closeCreateModal();
            } else {
                alert(`Failed to ${editingId ? 'update' : 'create'} question bank`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error saving question bank');
        }
        setIsLoading(false);
    };

    const handleEdit = (bank) => {
        setEditingId(bank.id);
        const questions = typeof bank.questions === 'string'
            ? JSON.parse(bank.questions || '[]')
            : bank.questions;

        setNewBank({
            name: bank.name,
            category: bank.category,
            description: bank.description || '',
            questions: questions
        });
        setShowCreateModal(true);
    };

    const closeCreateModal = () => {
        setShowCreateModal(false);
        setEditingId(null);
        setNewBank({ name: '', category: 'technical', description: '', questions: [] });
    };

    const uploadFile = async () => {
        if (!uploadData.name || !uploadData.file) {
            alert('Please provide a name and select a file');
            return;
        }

        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('file', uploadData.file);
            formData.append('name', uploadData.name);
            formData.append('category', uploadData.category);
            if (uploadData.description) {
                formData.append('description', uploadData.description);
            }

            const response = await fetch('/api/question-banks/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                await fetchBanks();
                setShowUploadModal(false);
                setUploadData({ name: '', category: 'technical', description: '', file: null });
            } else {
                const error = await response.json();
                alert('Failed to upload: ' + (error.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error uploading file');
        }
        setIsLoading(false);
    };

    const deleteBank = async (id) => {
        if (!confirm('Are you sure you want to delete this question bank?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/question-banks/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                await fetchBanks();
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-black py-8">
            <div className="max-w-6xl mx-auto px-4">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/mock-interview')}
                        className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-4"
                    >
                        ← Back to Mock Interview
                    </button>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-2">
                                Question Banks
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                Create and manage your interview question collections
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowUploadModal(true)}
                                className="btn btn-secondary"
                            >
                                📤 Upload File
                            </button>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="btn btn-primary"
                            >
                                + Create New
                            </button>
                        </div>
                    </div>
                </div>

                {/* Question Banks Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {banks.map((bank) => {
                        const category = categories.find(c => c.id === bank.category);
                        const questions = JSON.parse(bank.questions || '[]');

                        return (
                            <div
                                key={bank.id}
                                className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl p-6 hover:border-gray-400 dark:hover:border-gray-600 transition-all"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="text-3xl">{category?.icon || '📝'}</div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(bank)}
                                            className="text-blue-500 hover:text-blue-700 text-sm"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => deleteBank(bank.id)}
                                            className="text-red-500 hover:text-red-700 text-sm"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                                <h3 className="font-semibold text-gray-900 dark:text-gray-50 mb-2">
                                    {bank.name}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                    {bank.description || 'No description'}
                                </p>
                                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                    <span>{questions.length} questions</span>
                                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-900 rounded">
                                        {category?.name}
                                    </span>
                                </div>
                            </div>
                        );
                    })}

                    {banks.length === 0 && (
                        <div className="col-span-full text-center py-12">
                            <div className="text-6xl mb-4">📚</div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-2">
                                No Question Banks Yet
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                Create your first question bank to get started
                            </p>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="btn btn-primary"
                            >
                                Create Question Bank
                            </button>
                        </div>
                    )}
                </div>

                {/* Create Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-6">
                                {editingId ? 'Edit Question Bank' : 'Create Question Bank'}
                            </h2>

                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Bank Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={newBank.name}
                                        onChange={(e) => setNewBank({ ...newBank, name: e.target.value })}
                                        placeholder="e.g., Java Backend Questions"
                                        className="w-full"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Category *
                                    </label>
                                    <select
                                        value={newBank.category}
                                        onChange={(e) => setNewBank({ ...newBank, category: e.target.value })}
                                        className="w-full"
                                    >
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.icon} {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={newBank.description}
                                        onChange={(e) => setNewBank({ ...newBank, description: e.target.value })}
                                        placeholder="Optional description..."
                                        rows={2}
                                        className="w-full"
                                    />
                                </div>
                            </div>

                            {/* Add Question Form */}
                            <div className="border-t border-gray-200 dark:border-gray-800 pt-6 mb-6">
                                <h3 className="font-semibold text-gray-900 dark:text-gray-50 mb-4">
                                    Add Questions
                                </h3>
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        value={currentQuestion.question}
                                        onChange={(e) => setCurrentQuestion({ ...currentQuestion, question: e.target.value })}
                                        placeholder="Question *"
                                        className="w-full"
                                    />
                                    <textarea
                                        value={currentQuestion.answer}
                                        onChange={(e) => setCurrentQuestion({ ...currentQuestion, answer: e.target.value })}
                                        placeholder="Answer (optional)"
                                        rows={3}
                                        className="w-full"
                                    />
                                    <div className="grid grid-cols-2 gap-3">
                                        <select
                                            value={currentQuestion.difficulty}
                                            onChange={(e) => setCurrentQuestion({ ...currentQuestion, difficulty: e.target.value })}
                                            className="w-full"
                                        >
                                            <option value="easy">Easy</option>
                                            <option value="medium">Medium</option>
                                            <option value="hard">Hard</option>
                                        </select>
                                        <input
                                            type="text"
                                            value={currentQuestion.tags}
                                            onChange={(e) => setCurrentQuestion({ ...currentQuestion, tags: e.target.value })}
                                            placeholder="Tags (comma-separated)"
                                            className="w-full"
                                        />
                                    </div>
                                    <button
                                        onClick={addQuestion}
                                        className="btn btn-secondary w-full"
                                    >
                                        + Add Question
                                    </button>
                                </div>
                            </div>

                            {/* Questions List */}
                            {newBank.questions.length > 0 && (
                                <div className="mb-6">
                                    <h4 className="font-medium text-gray-900 dark:text-gray-50 mb-3">
                                        Questions ({newBank.questions.length})
                                    </h4>
                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                        {newBank.questions.map((q, idx) => (
                                            <div
                                                key={idx}
                                                className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg flex items-start justify-between"
                                            >
                                                <div className="flex-1">
                                                    <div className="font-medium text-sm text-gray-900 dark:text-gray-50">
                                                        {q.question}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                        {q.difficulty} • {q.tags.join(', ')}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => removeQuestion(idx)}
                                                    className="text-red-500 hover:text-red-700 text-sm ml-3"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    onClick={closeCreateModal}
                                    className="btn btn-secondary flex-1"
                                    disabled={isLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={saveBank}
                                    className="btn btn-primary flex-1"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Saving...' : (editingId ? 'Update Bank' : 'Create Bank')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Upload Modal */}
                {showUploadModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl max-w-lg w-full p-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-6">
                                Upload Question File
                            </h2>

                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Bank Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={uploadData.name}
                                        onChange={(e) => setUploadData({ ...uploadData, name: e.target.value })}
                                        placeholder="e.g., React Interview Questions"
                                        className="w-full"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Category *
                                    </label>
                                    <select
                                        value={uploadData.category}
                                        onChange={(e) => setUploadData({ ...uploadData, category: e.target.value })}
                                        className="w-full"
                                    >
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.icon} {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Description
                                    </label>
                                    <input
                                        type="text"
                                        value={uploadData.description}
                                        onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                                        placeholder="Optional description..."
                                        className="w-full"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        File * (TXT, PDF, DOCX)
                                    </label>
                                    <input
                                        type="file"
                                        accept=".txt,.pdf,.doc,.docx"
                                        onChange={(e) => setUploadData({ ...uploadData, file: e.target.files[0] })}
                                        className="w-full"
                                    />
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                        AI will automatically extract questions and answers from your file
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowUploadModal(false)}
                                    className="btn btn-secondary flex-1"
                                    disabled={isLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={uploadFile}
                                    className="btn btn-primary flex-1"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Uploading...' : 'Upload & Parse'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
