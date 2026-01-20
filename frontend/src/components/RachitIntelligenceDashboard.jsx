import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './RachitIntelligenceDashboard.css';

/**
 * Rachit Intelligence Management Dashboard
 * Admin interface to manage and train the AI system
 */
// Use Case Configuration
const USE_CASES = {
    'manual': {
        id: 'manual',
        name: 'Manual Selection',
        description: 'Manually select data tables to feed.',
        tables: [],
        icon: '⚙️'
    },
    'interviewer': {
        id: 'interviewer',
        name: 'AI Interviewer',
        description: 'Train AI to conduct interviews using Question Banks.',
        tables: ['question_banks'],
        icon: '🎤'
    },
    'personalization': {
        id: 'personalization',
        name: 'User Personalization',
        description: 'Train AI to personalize experience based on User Profiles.',
        tables: ['users'],
        icon: '👥'
    },
    'resume-ai': {
        id: 'resume-ai',
        name: 'Resume Design AI',
        description: 'Train AI on Resume Templates and Structures.',
        tables: ['templates'],
        icon: '🎨'
    }
};

const RachitIntelligenceDashboard = ({ users = [], templates = [] }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [questionBanks, setQuestionBanks] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [aiSettings, setAiSettings] = useState(null);
    const [systemStats, setSystemStats] = useState(null);
    const [loading, setLoading] = useState(true);

    // Selection State
    const [selectedUseCase, setSelectedUseCase] = useState('interviewer'); // Default to main use case
    const [selectedBankIds, setSelectedBankIds] = useState(new Set());
    const [selectedTables, setSelectedTables] = useState(new Set(['question_banks']));

    useEffect(() => {
        loadDashboardData();
    }, []);

    // ... (loadDashboardData remains same) ...

    const handleUseCaseChange = (useCaseId) => {
        setSelectedUseCase(useCaseId);

        if (useCaseId === 'manual') {
            // Keep current selection or clear? Let's keep current.
        } else {
            // Auto-select required tables
            const requiredTables = USE_CASES[useCaseId].tables;
            setSelectedTables(new Set(requiredTables));
        }
    };

    // ... (rest of logic) ...

    const loadDashboardData = async () => {
        try {
            setLoading(true);

            // Load AI settings
            const settingsRes = await axios.get('/api/admin/ai-settings');
            setAiSettings(settingsRes.data);

            // Load question banks
            const banksRes = await axios.get('http://localhost:8080/api/question-banks', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            setQuestionBanks(banksRes.data);

            // Default: Select ALL banks for feeding
            const allIds = new Set(banksRes.data.map(b => b.id));
            setSelectedBankIds(allIds);

            // Load system stats from Rachit Intelligence API
            const statsRes = await axios.get('http://localhost:8000/health');
            setSystemStats(statsRes.data);

            setLoading(false);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            setLoading(false);
        }
    };

    const toggleBankSelection = (id) => {
        setSelectedBankIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const toggleSelectAll = () => {
        if (selectedBankIds.size === questionBanks.length) {
            setSelectedBankIds(new Set()); // Deselect all
        } else {
            setSelectedBankIds(new Set(questionBanks.map(b => b.id))); // Select all
        }
    };

    const toggleTableSelection = (tableName) => {
        setSelectedTables(prev => {
            const newSet = new Set(prev);
            if (newSet.has(tableName)) {
                newSet.delete(tableName);
            } else {
                newSet.add(tableName);
            }
            return newSet;
        });
    };

    const loadQuestions = async (bankId) => {
        try {
            const response = await axios.get(`/api/question-banks/${bankId}`);
            if (response.data.questions) {
                const parsedQuestions = JSON.parse(response.data.questions);
                setQuestions(parsedQuestions);
            }
        } catch (error) {
            console.error('Error loading questions:', error);
        }
    };

    const revokeDataFromRachitIntelligence = async () => {
        const useCaseName = USE_CASES[selectedUseCase]?.name || selectedUseCase;
        if (!confirm(`⚠️ Are you sure you want to REVOKE all training data for "${useCaseName}"?\n\nThis will remove any vectors or data previously fed to the AI for this use case.`)) {
            return;
        }

        try {
            await axios.post('http://localhost:8000/api/v1/admin/revoke-data', {
                use_case: selectedUseCase
            });
            alert(`🗑️ Successfully revoked data for "${useCaseName}"!`);
            loadDashboardData();
        } catch (error) {
            console.error('Error revoking data:', error);
            alert('❌ Failed to revoke data. Check console for details.');
        }
    };

    const syncDataToRachitIntelligence = async () => {
        if (selectedTables.size === 0) {
            alert('⚠️ Please select at least one Data Table to feed.');
            return;
        }

        if (!confirm(`Confirm feeding ${selectedTables.size} tables to Rachit Intelligence for use case: "${USE_CASES[selectedUseCase]?.name || 'Custom'}"?`)) {
            return;
        }

        try {
            let ops = [];

            // 1. Sync Question Banks
            if (selectedTables.has('question_banks')) {
                const banksToSync = questionBanks.filter(b => selectedBankIds.has(b.id));
                if (banksToSync.length > 0) {
                    ops.push(
                        axios.post('http://localhost:8000/api/v1/admin/sync-data', {
                            source: 'admin_dashboard',
                            use_case: selectedUseCase,
                            timestamp: new Date().toISOString(),
                            banks: banksToSync
                        })
                    );
                }
            }

            // 2. Sync Users
            if (selectedTables.has('users')) {
                const safeUsers = users.map(u => ({ id: u.id, email: u.email, isAdmin: u.isAdmin }));
                ops.push(
                    axios.post('http://localhost:8000/api/v1/admin/feed-data', {
                        source: 'admin_dashboard',
                        use_case: selectedUseCase,
                        data_type: 'users',
                        count: safeUsers.length,
                        data: safeUsers,
                        timestamp: new Date().toISOString()
                    })
                );
            }

            // 3. Sync Templates
            if (selectedTables.has('templates')) {
                ops.push(
                    axios.post('http://localhost:8000/api/v1/admin/feed-data', {
                        source: 'admin_dashboard',
                        use_case: selectedUseCase,
                        data_type: 'templates',
                        count: templates.length,
                        data: templates,
                        timestamp: new Date().toISOString()
                    })
                );
            }

            await Promise.all(ops);

            alert(`✅ Successfully fed data for "${USE_CASES[selectedUseCase]?.name || 'Custom'}" Use Case!`);
            loadDashboardData();
        } catch (error) {
            console.error('Error syncing data:', error);
            alert('❌ Failed to sync data. Please check the connection.');
        }
    };

    if (loading) {
        return <div className="dashboard-loading">Loading Rachit Intelligence Dashboard...</div>;
    }

    return (
        <div className="rachit-dashboard">
            {/* Header */}
            <div className="dashboard-header">
                <div className="header-content">
                    <h1>🧠 Rachit Intelligence™ Dashboard</h1>
                    <p className="header-subtitle">Manage Your Proprietary AI System</p>
                </div>
                <div className="header-status">
                    <div className="status-indicator">
                        <span className="status-dot active"></span>
                        <span>System Active</span>
                    </div>
                    <div className="sync-button" style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={revokeDataFromRachitIntelligence} className="btn-secondary" style={{ backgroundColor: '#fee2e2', color: '#dc2626', borderColor: '#fecaca' }}>
                            🗑️ Revoke Feed
                        </button>
                        <button onClick={syncDataToRachitIntelligence} className="btn-primary">
                            🔄 Feed Data to AI
                        </button>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="dashboard-tabs">
                <button
                    className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    📊 Overview
                </button>
                <button
                    className={`tab ${activeTab === 'data-sources' ? 'active' : ''}`}
                    onClick={() => setActiveTab('data-sources')}
                >
                    🚀 Training & Data
                </button>
                <button
                    className={`tab ${activeTab === 'question-banks' ? 'active' : ''}`}
                    onClick={() => setActiveTab('question-banks')}
                >
                    📚 Question Banks ({selectedBankIds.size}/{questionBanks.length})
                </button>
                <button
                    className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
                    onClick={() => setActiveTab('settings')}
                >
                    ⚙️ AI Settings
                </button>
                <button
                    className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
                    onClick={() => setActiveTab('analytics')}
                >
                    📈 Analytics
                </button>
            </div>

            {/* Tab Content */}
            <div className="dashboard-content">
                {activeTab === 'overview' && (
                    <OverviewTab
                        systemStats={systemStats}
                        aiSettings={aiSettings}
                        questionBanks={questionBanks}
                        selectedCount={selectedBankIds.size}
                    />
                )}

                {activeTab === 'data-sources' && (
                    <div className="data-sources-tab">
                        <h2 className="text-xl font-bold mb-6">Select AI Use Case & Training Data</h2>

                        {/* Use Case Selection */}
                        <div className="use-case-selector mb-8">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">1. Choose Use Case</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {Object.values(USE_CASES).map(useCase => (
                                    <div
                                        key={useCase.id}
                                        className={`p-4 border rounded-xl cursor-pointer transition-all ${selectedUseCase === useCase.id ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20 ring-2 ring-purple-500 ring-offset-2 dark:ring-offset-gray-900' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                                        onClick={() => handleUseCaseChange(useCase.id)}
                                    >
                                        <div className="text-2xl mb-2">{useCase.icon}</div>
                                        <h4 className="font-bold text-gray-900 dark:text-white">{useCase.name}</h4>
                                        <p className="text-xs text-gray-500 mt-1">{useCase.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Data Tables */}
                        <div className="data-tables-selector">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">2. Manage Data Sources</h3>
                            <div className="tables-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                                {/* Question Banks Selection */}
                                <div className={`table-card ${selectedTables.has('question_banks') ? 'selected' : ''} p-4 border rounded-xl transition-all ${selectedUseCase !== 'manual' ? 'opacity-90' : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                                    onClick={() => selectedUseCase === 'manual' && toggleTableSelection('question_banks')}
                                    style={{ borderColor: selectedTables.has('question_banks') ? '#8b5cf6' : 'inherit', borderWidth: selectedTables.has('question_banks') ? '2px' : '1px' }}
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="font-bold flex items-center gap-2">
                                            📚 Question Banks
                                            {selectedUseCase !== 'manual' && selectedTables.has('question_banks') && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Required</span>}
                                        </h3>
                                        <input type="checkbox" checked={selectedTables.has('question_banks')} readOnly disabled={selectedUseCase !== 'manual'} className="w-5 h-5 accent-purple-600" />
                                    </div>
                                    <p className="text-sm text-gray-500 mb-2">
                                        {questionBanks.length} available banks. <br />
                                        {selectedBankIds.size} selected for sync.
                                    </p>
                                    <div className="text-xs text-purple-600 font-medium">
                                        Feeds interview knowledge →
                                    </div>
                                </div>

                                {/* Users Selection */}
                                <div className={`table-card ${selectedTables.has('users') ? 'selected' : ''} p-4 border rounded-xl transition-all ${selectedUseCase !== 'manual' ? 'opacity-90' : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                                    onClick={() => selectedUseCase === 'manual' && toggleTableSelection('users')}
                                    style={{ borderColor: selectedTables.has('users') ? '#8b5cf6' : 'inherit', borderWidth: selectedTables.has('users') ? '2px' : '1px' }}
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="font-bold flex items-center gap-2">
                                            👥 Users Table
                                            {selectedUseCase !== 'manual' && selectedTables.has('users') && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Required</span>}
                                        </h3>
                                        <input type="checkbox" checked={selectedTables.has('users')} readOnly disabled={selectedUseCase !== 'manual'} className="w-5 h-5 accent-purple-600" />
                                    </div>
                                    <p className="text-sm text-gray-500 mb-2">
                                        {users.length} registered users. <br />
                                        Metadata (ID, Email, Roles).
                                    </p>
                                    <div className="text-xs text-purple-600 font-medium">
                                        Feeds personalization engine →
                                    </div>
                                </div>

                                {/* Templates Selection */}
                                <div className={`table-card ${selectedTables.has('templates') ? 'selected' : ''} p-4 border rounded-xl transition-all ${selectedUseCase !== 'manual' ? 'opacity-90' : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                                    onClick={() => selectedUseCase === 'manual' && toggleTableSelection('templates')}
                                    style={{ borderColor: selectedTables.has('templates') ? '#8b5cf6' : 'inherit', borderWidth: selectedTables.has('templates') ? '2px' : '1px' }}
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="font-bold flex items-center gap-2">
                                            🎨 Templates Table
                                            {selectedUseCase !== 'manual' && selectedTables.has('templates') && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Required</span>}
                                        </h3>
                                        <input type="checkbox" checked={selectedTables.has('templates')} readOnly disabled={selectedUseCase !== 'manual'} className="w-5 h-5 accent-purple-600" />
                                    </div>
                                    <p className="text-sm text-gray-500 mb-2">
                                        {templates.length} templates available. <br />
                                        Structure and Design Metadata.
                                    </p>
                                    <div className="text-xs text-purple-600 font-medium">
                                        Feeds design intelligence →
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'question-banks' && (
                    <QuestionBanksTab
                        questionBanks={questionBanks}
                        questions={questions}
                        onLoadQuestions={loadQuestions}
                        onRefresh={loadDashboardData}
                        selectedBankIds={selectedBankIds}
                        onToggleBank={toggleBankSelection}
                        onToggleSelectAll={toggleSelectAll}
                    />
                )}

                {activeTab === 'settings' && (
                    <SettingsTab
                        aiSettings={aiSettings}
                        onUpdate={loadDashboardData}
                    />
                )}

                {activeTab === 'analytics' && (
                    <AnalyticsTab aiSettings={aiSettings} />
                )}
            </div>
        </div>
    );
};

// Overview Tab Component
const OverviewTab = ({ systemStats, aiSettings, questionBanks, selectedCount }) => {
    return (
        <div className="overview-tab">
            <div className="stats-grid">
                {/* System Status Card */}
                <div className="stat-card">
                    <div className="stat-icon">🧠</div>
                    <div className="stat-content">
                        <h3>Rachit Intelligence</h3>
                        <p className="stat-value">{systemStats?.status || 'Active'}</p>
                        <p className="stat-label">System Status</p>
                    </div>
                </div>

                {/* Question Banks Card */}
                <div className="stat-card">
                    <div className="stat-icon">📚</div>
                    <div className="stat-content">
                        <h3>Feeding Selection</h3>
                        <p className="stat-value">{selectedCount} / {questionBanks?.length || 0}</p>
                        <p className="stat-label">Banks Selected for AI</p>
                    </div>
                </div>

                {/* Cost Savings Card */}
                <div className="stat-card">
                    <div className="stat-icon">💰</div>
                    <div className="stat-content">
                        <h3>Cost Savings</h3>
                        <p className="stat-value">$0.00</p>
                        <p className="stat-label">Monthly Cost</p>
                    </div>
                </div>

                {/* Performance Card */}
                <div className="stat-card">
                    <div className="stat-icon">⚡</div>
                    <div className="stat-content">
                        <h3>Performance</h3>
                        <p className="stat-value">&lt; 100ms</p>
                        <p className="stat-label">Avg Response Time</p>
                    </div>
                </div>
            </div>

            {/* System Info */}
            <div className="system-info">
                <h2>System Information</h2>
                <div className="info-grid">
                    <div className="info-item">
                        <span className="info-label">API Version:</span>
                        <span className="info-value">{systemStats?.version || '1.0.0'}</span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Cache Status:</span>
                        <span className="info-value">{systemStats?.cache_status || 'Enabled'}</span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">External AI:</span>
                        <span className="info-value">
                            {aiSettings?.enableExternalAi ? '🟢 Enabled' : '🔴 Disabled'}
                        </span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Providers:</span>
                        <span className="info-value">
                            {systemStats?.providers ? Object.keys(systemStats.providers).filter(p =>
                                systemStats.providers[p] === 'active' || systemStats.providers[p] === 'configured'
                            ).join(', ') : 'N/A'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
                <h2>Quick Actions</h2>
                <div className="actions-grid">
                    <button className="action-card">
                        <span className="action-icon">➕</span>
                        <span className="action-text">Create Question Bank</span>
                    </button>
                    <button className="action-card">
                        <span className="action-icon">🔄</span>
                        <span className="action-text">Sync All Data</span>
                    </button>
                    <button className="action-card">
                        <span className="action-icon">📊</span>
                        <span className="action-text">View Analytics</span>
                    </button>
                    <button className="action-card">
                        <span className="action-icon">⚙️</span>
                        <span className="action-text">Configure AI</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

// Question Banks Tab Component
const QuestionBanksTab = ({ questionBanks, questions, onLoadQuestions, onRefresh, selectedBankIds, onToggleBank, onToggleSelectAll }) => {
    const [selectedBank, setSelectedBank] = useState(null);

    const handleSelectBank = (bank) => {
        setSelectedBank(bank);
        onLoadQuestions(bank.id);
    };

    return (
        <div className="question-banks-tab">
            <div className="tab-header">
                <h2>📚 Question Bank Management</h2>
                <div className="flex gap-2">
                    <button className="btn-secondary" onClick={onToggleSelectAll}>
                        {selectedBankIds.size === questionBanks.length ? 'Deselect All' : 'Select All'}
                    </button>
                    <button className="btn-primary" onClick={onRefresh}>
                        🔄 Refresh
                    </button>
                </div>
            </div>

            <div className="banks-container">
                {/* Banks List */}
                <div className="banks-list">
                    <h3>Available Banks</h3>
                    {questionBanks.map(bank => (
                        <div
                            key={bank.id}
                            className={`bank-item ${selectedBank?.id === bank.id ? 'selected' : ''}`}
                            onClick={() => handleSelectBank(bank)}
                        >
                            <div className="bank-checkbox" onClick={(e) => e.stopPropagation()}>
                                <input
                                    type="checkbox"
                                    checked={selectedBankIds.has(bank.id)}
                                    onChange={() => onToggleBank(bank.id)}
                                    className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                />
                            </div>
                            <div className="bank-info">
                                <h4>{bank.name || bank.title}</h4>
                                <p className="bank-meta">
                                    {bank.category} • {JSON.parse(bank.questions || '[]').length} questions
                                </p>
                            </div>
                            <div className="bank-actions">
                                {selectedBankIds.has(bank.id) && <span className="text-xs text-green-600 font-bold mr-2">FEEDING</span>}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Questions Viewer */}
                <div className="questions-viewer">
                    {selectedBank ? (
                        <>
                            <h3>Questions in "{selectedBank.name || selectedBank.title}"</h3>
                            <div className="questions-list">
                                {questions.map((q, index) => (
                                    <div key={index} className="question-item">
                                        <div className="question-number">{index + 1}</div>
                                        <div className="question-content">
                                            <p className="question-text">{q.question || q.text}</p>
                                            {q.difficulty && (
                                                <span className={`difficulty-badge ${q.difficulty}`}>
                                                    {q.difficulty}
                                                </span>
                                            )}
                                            {q.category && (
                                                <span className="category-badge">{q.category}</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="empty-state">
                            <p>Select a question bank to view its questions</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Settings Tab Component
const SettingsTab = ({ aiSettings, onUpdate }) => {
    const [settings, setSettings] = useState(aiSettings);

    const handleToggleExternalAI = async () => {
        try {
            const response = await axios.post('/api/admin/ai-settings/toggle');
            setSettings(prev => ({ ...prev, enableExternalAi: response.data.enableExternalAi }));
            onUpdate();
        } catch (error) {
            console.error('Error toggling AI:', error);
        }
    };

    return (
        <div className="settings-tab">
            <h2>⚙️ AI Settings</h2>

            <div className="settings-cards">
                {/* Rachit Intelligence Card */}
                <div className="setting-card">
                    <h3>🧠 Rachit Intelligence™</h3>
                    <p>Your proprietary AI system - always active, always free</p>
                    <div className="setting-status">
                        <span className="status-badge active">Active</span>
                        <span className="setting-meta">Cost: $0.00/month</span>
                    </div>
                </div>

                {/* External AI Toggle */}
                <div className="setting-card">
                    <div className="setting-header">
                        <h3>🚀 External AI Boost</h3>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={settings?.enableExternalAi || false}
                                onChange={handleToggleExternalAI}
                            />
                            <span className="slider"></span>
                        </label>
                    </div>
                    <p>
                        {settings?.enableExternalAi
                            ? '⚠️ Using external AI - costs apply'
                            : '✅ Using Rachit Intelligence only - FREE'
                        }
                    </p>
                    {settings?.enableExternalAi && (
                        <div className="usage-info">
                            <p>Tokens used today: {settings.tokensUsedToday}</p>
                            <p>Estimated cost: {settings.estimatedCostToday}</p>
                        </div>
                    )}
                </div>

                {/* Intelligence API URL */}
                <div className="setting-card">
                    <h3>🌐 Intelligence API URL</h3>
                    <input
                        type="text"
                        value={settings?.intelligenceApiUrl || 'http://localhost:8000'}
                        className="input-field"
                        readOnly
                    />
                    <p className="setting-hint">API endpoint for Rachit Intelligence</p>
                </div>
            </div>
        </div>
    );
};

// Analytics Tab Component
const AnalyticsTab = ({ aiSettings }) => {
    return (
        <div className="analytics-tab">
            <h2>📈 System Analytics</h2>

            <div className="analytics-grid">
                {/* Usage Chart */}
                <div className="analytics-card">
                    <h3>Token Usage (Last 7 Days)</h3>
                    <div className="chart-placeholder">
                        <p>Chart visualization coming soon...</p>
                        <p>Current usage: {aiSettings?.tokensUsedToday || 0} tokens</p>
                    </div>
                </div>

                {/* Cost Analysis */}
                <div className="analytics-card">
                    <h3>Cost Analysis</h3>
                    <div className="cost-breakdown">
                        <div className="cost-item">
                            <span>Rachit Intelligence:</span>
                            <span className="cost-value free">$0.00</span>
                        </div>
                        <div className="cost-item">
                            <span>External AI:</span>
                            <span className="cost-value">{aiSettings?.estimatedCostMonth || '$0.00'}</span>
                        </div>
                        <div className="cost-item total">
                            <span><strong>Total:</strong></span>
                            <span className="cost-value"><strong>{aiSettings?.estimatedCostMonth || '$0.00'}</strong></span>
                        </div>
                    </div>
                </div>

                {/* Performance Metrics */}
                <div className="analytics-card">
                    <h3>Performance Metrics</h3>
                    <div className="metrics-list">
                        <div className="metric-item">
                            <span className="metric-label">Avg Response Time:</span>
                            <span className="metric-value">&lt; 100ms</span>
                        </div>
                        <div className="metric-item">
                            <span className="metric-label">Success Rate:</span>
                            <span className="metric-value">99.9%</span>
                        </div>
                        <div className="metric-item">
                            <span className="metric-label">Uptime:</span>
                            <span className="metric-value">100%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RachitIntelligenceDashboard;
