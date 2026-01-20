import React, { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * Admin component to control AI boost settings
 * By default, uses our own intelligent system (FREE)
 * Admin can enable AI boost for enhanced features (costs money)
 */
const AiBoostAdmin = () => {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const { data } = await axios.get('/api/admin/ai-settings');
            setSettings(data);
            setLoading(false);
        } catch (err) {
            setError('Failed to load AI settings');
            setLoading(false);
        }
    };

    const toggleAiBoost = async () => {
        try {
            const { data } = await axios.post('/api/admin/ai-settings/toggle');
            setSettings(prev => ({ ...prev, enableExternalAi: data.enableExternalAi }));

            // Show notification
            if (data.enableExternalAi) {
                alert('⚠️ AI Boost ENABLED - This will cost money for external AI calls!');
            } else {
                alert('✅ AI Boost DISABLED - Using free built-in intelligence.');
            }
        } catch (err) {
            setError('Failed to toggle AI boost');
        }
    };

    if (loading) return <div className="loading">Loading AI settings...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="ai-boost-admin">
            <h2>🤖 AI Intelligence Settings</h2>

            {/* Rachit Intelligence Status */}
            <div className="setting-card built-in">
                <div className="card-header">
                    <h3>🧠 Rachit Intelligence™</h3>
                    <span className="status-badge active">Always Active</span>
                </div>
                <div className="card-body">
                    <p className="description">
                        Your proprietary intelligent system handles all interviews automatically - no external AI needed!
                    </p>
                    <ul className="features">
                        <li>✅ Smart question selection from your question banks</li>
                        <li>✅ Intelligent answer evaluation</li>
                        <li>✅ Adaptive difficulty adjustment</li>
                        <li>✅ Performance analytics & feedback</li>
                    </ul>
                    <div className="stats">
                        <div className="stat">
                            <span className="label">Cost:</span>
                            <span className="value free">FREE</span>
                        </div>
                        <div className="stat">
                            <span className="label">Speed:</span>
                            <span className="value">&lt; 100ms</span>
                        </div>
                        <div className="stat">
                            <span className="label">Quality:</span>
                            <span className="value">Excellent</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Boost (External AI) Toggle */}
            <div className={`setting-card ai-boost ${settings?.enableExternalAi ? 'enabled' : 'disabled'}`}>
                <div className="card-header">
                    <h3>🚀 AI Boost (External AI)</h3>
                    <label className="toggle-switch">
                        <input
                            type="checkbox"
                            checked={settings?.enableExternalAi || false}
                            onChange={toggleAiBoost}
                        />
                        <span className="slider"></span>
                    </label>
                </div>
                <div className="card-body">
                    <p className="description">
                        {settings?.enableExternalAi
                            ? '⚠️ AI Boost is ENABLED - Enhanced features active (costs money)'
                            : 'AI Boost is OFF - Using free built-in intelligence only'
                        }
                    </p>

                    {settings?.enableExternalAi && (
                        <div className="warning-box">
                            <strong>⚠️ Cost Warning:</strong> External AI calls cost money.
                            Monitor your usage below to control spending.
                        </div>
                    )}

                    <div className="ai-boost-details">
                        <p><strong>Provider:</strong> {settings?.preferredProvider || 'Groq (fastest & cheapest)'}</p>
                        <p><strong>Enhancement:</strong> Better feedback quality, contextual hints</p>
                        <p><strong>Cost:</strong> ~$0.0001 per request</p>
                    </div>

                    {settings?.enableExternalAi && (
                        <div className="usage-stats">
                            <h4>📊 Token Usage Today</h4>
                            <div className="progress-bar">
                                <div
                                    className="progress-fill"
                                    style={{
                                        width: `${(settings.tokensUsedToday / settings.dailyTokenBudget) * 100}%`
                                    }}
                                ></div>
                            </div>
                            <p className="usage-text">
                                {settings.tokensUsedToday?.toLocaleString()} / {settings.dailyTokenBudget?.toLocaleString()} tokens
                            </p>
                            <p className="cost-estimate">
                                Estimated cost today: <strong>{settings.estimatedCostToday}</strong>
                            </p>

                            <h4>📊 Monthly Usage</h4>
                            <div className="progress-bar">
                                <div
                                    className="progress-fill"
                                    style={{
                                        width: `${(settings.tokensUsedThisMonth / settings.monthlyTokenBudget) * 100}%`
                                    }}
                                ></div>
                            </div>
                            <p className="usage-text">
                                {settings.tokensUsedThisMonth?.toLocaleString()} / {settings.monthlyTokenBudget?.toLocaleString()} tokens
                            </p>
                            <p className="cost-estimate">
                                Estimated cost this month: <strong>{settings.estimatedCostMonth}</strong>
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Recommendation */}
            <div className="recommendation-box">
                <h4>💡 Recommendation</h4>
                <p>
                    <strong>Keep AI Boost OFF</strong> for maximum cost savings.
                    Our built-in intelligence provides excellent interview quality at zero cost.
                    Only enable AI Boost if you need premium features or enhanced feedback.
                </p>
            </div>
        </div>
    );
};

export default AiBoostAdmin;
