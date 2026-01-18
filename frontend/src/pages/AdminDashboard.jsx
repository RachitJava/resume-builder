import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../api/adminApi';
import ScaledPreview from '../components/LiveResumePreview';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('api-keys'); // 'api-keys', 'users', 'templates'

  const [aiConfigs, setAiConfigs] = useState([]);
  const [showAddConfigForm, setShowAddConfigForm] = useState(false);
  const [newConfig, setNewConfig] = useState({ providerName: 'groq', apiUrl: '', modelName: '' });

  // General API Keys State (for Mail, etc)
  const [generalApiKeys, setGeneralApiKeys] = useState([]);
  const [showAddKeyForm, setShowAddKeyForm] = useState(false);
  const [newKey, setNewKey] = useState({ name: '', provider: 'mail', apiKey: '', priority: 0 });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Missing State Variables
  const [users, setUsers] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showTemplateCreator, setShowTemplateCreator] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [templateImage, setTemplateImage] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  const checkAdminAndLoad = async () => {
    try {
      // 1. Verify Admin Status first (Critical Security)
      const { isAdmin } = await adminApi.checkAdmin();
      if (!isAdmin) {
        navigate('/');
        return;
      }
      setIsAdmin(true);

      // 2. Load all dashboard data in parallel for speed
      try {
        await Promise.all([
          loadAiConfigs(),
          loadGeneralApiKeys(),
          loadUsers(),
          loadTemplates()
        ]);
      } catch (partialError) {
        console.warn('Some dashboard data failed to load', partialError);
        // Continue anyway so partial UI is visible
      }

    } catch (err) {
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  // ===== AI CONFIG MANAGEMENT =====
  const loadAiConfigs = async () => {
    try {
      const configs = await adminApi.getAiConfigs();
      setAiConfigs(configs);
    } catch (err) {
      console.error('Failed to load AI configs:', err);
    }
  };

  const handleAddConfig = async (e) => {
    e.preventDefault();
    try {
      await adminApi.saveAiConfig(newConfig);
      setNewConfig({ providerName: 'groq', apiUrl: '', modelName: '' });
      setShowAddConfigForm(false);
      setSuccess('AI Strategy added!');
      await loadAiConfigs();
    } catch (err) {
      setError('Failed to add AI strategy');
    }
  };

  const handleAddKeyToConfig = async (id, key) => {
    try {
      await adminApi.addAiKey(id, key);
      setSuccess('Key added!');
      await loadAiConfigs();
    } catch (err) {
      setError('Failed to add key');
    }
  };

  const handleActivateConfig = async (id) => {
    try {
      await adminApi.activateAiConfig(id);
      setSuccess('Provider activated!');
      await loadAiConfigs();
    } catch (err) {
      setError('Failed to activate provider');
    }
  };

  const handleDeleteConfig = async (id) => {
    if (!confirm('Delete this AI strategy?')) return;
    try {
      await adminApi.deleteAiConfig(id);
      setSuccess('Strategy deleted');
      await loadAiConfigs();
    } catch (err) {
      setError('Failed to delete');
    }
  };

  const handleSelectKey = async (id, index) => {
    try {
      await adminApi.selectAiKey(id, index);
      setSuccess('Active key updated!');
      await loadAiConfigs();
    } catch (err) {
      setError('Failed to update active key');
    }
  };

  // ===== GENERAL API KEY MANAGEMENT =====
  const loadGeneralApiKeys = async () => {
    try {
      const keys = await adminApi.getApiKeys();
      setGeneralApiKeys(keys);
    } catch (err) {
      console.error('Failed to load general API keys:', err);
    }
  };

  const handleAddGeneralKey = async (e) => {
    e.preventDefault();
    try {
      await adminApi.createApiKey(newKey);
      setNewKey({ name: '', provider: 'mail', apiKey: '', priority: 0, owner: '' });
      setShowAddKeyForm(false);
      setSuccess('API Key added!');
      await loadGeneralApiKeys();
    } catch (err) {
      setError('Failed to add API key');
    }
  };

  const handleDeleteGeneralKey = async (id) => {
    if (!confirm('Delete this API key?')) return;
    try {
      await adminApi.deleteApiKey(id);
      setSuccess('API Key deleted');
      await loadGeneralApiKeys();
    } catch (err) {
      setError('Failed to delete');
    }
  };

  // ===== USER MANAGEMENT =====
  const loadUsers = async () => {
    try {
      const response = await adminApi.getAllUsers();
      setUsers(response || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const handleAddUser = async (userData) => {
    try {
      await adminApi.createUser(userData);
      setShowAddUserForm(false);
      setSuccess('User created successfully!');
      await loadUsers();
    } catch (err) {
      setError('Failed to create user');
    }
  };

  const handleUpdateUser = async (userId, userData) => {
    try {
      await adminApi.updateUser(userId, userData);
      setEditingUser(null);
      setSuccess('User updated successfully!');
      await loadUsers();
    } catch (err) {
      setError('Failed to update user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await adminApi.deleteUser(userId);
      setSuccess('User deleted successfully!');
      await loadUsers();
    } catch (err) {
      setError('Failed to delete user');
    }
  };

  // ===== TEMPLATE MANAGEMENT =====
  const loadTemplates = async () => {
    try {
      const response = await adminApi.getAllTemplates();
      setTemplates(response || []);
    } catch (err) {
      console.error('Failed to load templates:', err);
    }
  };

  const handleGenerateTemplateFromImage = async (imageFile) => {
    setAiGenerating(true);
    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const newTemplate = await adminApi.generateTemplateFromImage(formData);
      setSuccess('Template generated successfully from image!');
      setTemplateImage(null);
      await loadTemplates();
    } catch (err) {
      setError('Failed to generate template from image');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleGenerateTemplateFromAI = async (description) => {
    setAiGenerating(true);
    try {
      const newTemplate = await adminApi.generateTemplateFromAI({ description });
      setSuccess('Template generated successfully by AI!');
      await loadTemplates();
    } catch (err) {
      setError('Failed to generate template with AI');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      await adminApi.deleteTemplate(templateId);
      setSuccess('Template deleted successfully!');
      await loadTemplates();
    } catch (err) {
      setError('Failed to delete template');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-12 h-12 border-3 border-gray-900 dark:border-gray-50 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-white dark:bg-[#0A0A0A] text-gray-900 dark:text-gray-50">
      {/* Header */}
      <header className="bg-white dark:bg-[#18181B] border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Manage API keys, users, and templates</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="btn btn-secondary text-sm"
          >
            ← Back to App
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Notifications */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-xl">&times;</button>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 flex justify-between items-center">
            <span>{success}</span>
            <button onClick={() => setSuccess('')} className="text-xl">&times;</button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={() => setActiveTab('api-keys')}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${activeTab === 'api-keys'
              ? 'border-gray-900 dark:border-gray-50 text-gray-900 dark:text-gray-50'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
          >
            🔑 API Keys
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${activeTab === 'users'
              ? 'border-gray-900 dark:border-gray-50 text-gray-900 dark:text-gray-50'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
          >
            👥 Users
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${activeTab === 'templates'
              ? 'border-gray-900 dark:border-gray-50 text-gray-900 dark:text-gray-50'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
          >
            🎨 Templates
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'api-keys' && (
          <div className="space-y-8">
            <ApiKeysSection
              aiConfigs={aiConfigs}
              onAddKey={handleAddKeyToConfig}
              onActivate={handleActivateConfig}
              onDelete={handleDeleteConfig}
              onAddConfig={handleAddConfig}
              showAddConfigForm={showAddConfigForm}
              setShowAddConfigForm={setShowAddConfigForm}
              newConfig={newConfig}
              setNewConfig={setNewConfig}
              onSelectKey={handleSelectKey}
            />

            <GeneralKeysSection
              keys={generalApiKeys}
              showAddForm={showAddKeyForm}
              setShowAddForm={setShowAddKeyForm}
              newKey={newKey}
              setNewKey={setNewKey}
              onAddKey={handleAddGeneralKey}
              onDelete={handleDeleteGeneralKey}
            />
          </div>
        )}

        {activeTab === 'users' && (
          <UsersSection
            users={users}
            showAddForm={showAddUserForm}
            setShowAddForm={setShowAddUserForm}
            editingUser={editingUser}
            setEditingUser={setEditingUser}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
          />
        )}

        {activeTab === 'templates' && (
          <TemplatesSection
            templates={templates}
            showCreator={showTemplateCreator}
            setShowCreator={setShowTemplateCreator}
            aiGenerating={aiGenerating}
            onGenerateFromAI={handleGenerateTemplateFromAI}
            onDelete={handleDeleteTemplate}
            setPreviewTemplate={setPreviewTemplate}
          />
        )}

        {/* Template Preview Modal */}
        {previewTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setPreviewTemplate(null)}>
            <div className="relative max-w-4xl max-h-[90vh] w-full bg-white dark:bg-[#18181B] rounded-2xl overflow-hidden shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-800">
                <h3 className="text-xl font-bold">{previewTemplate.name} Preview</h3>
                <button onClick={() => setPreviewTemplate(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 bg-gray-100 dark:bg-[#0A0A0A]">
                <div className="max-w-3xl mx-auto shadow-2xl">
                  <ScaledPreview template={previewTemplate.baseStyle} />
                </div>
              </div>
              <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3 bg-white dark:bg-[#18181B]">
                <button onClick={() => setPreviewTemplate(null)} className="btn btn-secondary">Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ===== AI PROVIDER SECTION COMPONENT =====
function ApiKeysSection({ aiConfigs, onAddKey, onActivate, onDelete, onAddConfig, showAddConfigForm, setShowAddConfigForm, newConfig, setNewConfig, onSelectKey }) {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#18181B] border border-gray-200 dark:border-gray-800 rounded-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold">AI Provider Management</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Configure multiple AI providers and rotate their API keys
            </p>
          </div>
          <button
            onClick={() => setShowAddConfigForm(!showAddConfigForm)}
            className="btn btn-primary text-sm"
          >
            {showAddConfigForm ? 'Cancel' : '+ Add Provider'}
          </button>
        </div>

        {showAddConfigForm && (
          <form onSubmit={onAddConfig} className="bg-gray-50 dark:bg-[#27272A] rounded-lg p-6 mb-6 grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Provider Name</label>
              <input
                placeholder="e.g. Groq, OpenAI, Anthropic"
                value={newConfig.providerName}
                onChange={e => setNewConfig({ ...newConfig, providerName: e.target.value })}
                className="w-full"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">API Endpoint URL</label>
              <input
                placeholder="https://..."
                value={newConfig.apiUrl}
                onChange={e => setNewConfig({ ...newConfig, apiUrl: e.target.value })}
                className="w-full px-3 py-2 border rounded dark:bg-[#18181B] dark:border-gray-700"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Model Name</label>
              <input
                placeholder="e.g. llama-3.3-70b-versatile"
                value={newConfig.modelName}
                onChange={e => setNewConfig({ ...newConfig, modelName: e.target.value })}
                className="w-full px-3 py-2 border rounded dark:bg-[#18181B] dark:border-gray-700"
                required
              />
            </div>
            <button className="btn btn-primary col-span-2 mt-2">Create Strategy</button>
          </form>
        )}

        <div className="grid gap-6">
          {aiConfigs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No AI strategies configured. Click "+ Add Provider" to begin.</div>
          ) : aiConfigs.map(config => (
            <div key={config.id} className={`border rounded-xl p-6 transition-all ${config.active ? 'border-blue-500 bg-blue-500/5 ring-1 ring-blue-500/20' : 'border-gray-200 dark:border-gray-800'}`}>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-3">
                    {config.providerName.toUpperCase()}
                    {config.active && <span className="text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded-full uppercase tracking-tighter">Current Provider</span>}
                  </h3>
                  <div className="flex flex-col mt-2 gap-1">
                    <span className="text-xs font-mono text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded w-fit">{config.modelName}</span>
                    <span className="text-[10px] text-gray-500 break-all">{config.apiUrl}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!config.active && (
                    <button
                      onClick={() => onActivate(config.id)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors"
                    >
                      Activate
                    </button>
                  )}
                  <button
                    onClick={() => onDelete(config.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete Provider"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Rotational API Keys</h4>
                  <span className="text-[10px] text-gray-500">{config.apiKeys.length} keys total</span>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {config.apiKeys.map((k, i) => (
                    <div key={i} className={`px-3 py-2 rounded-lg border flex items-center gap-3 transition-all ${config.currentKeyIndex === i ? 'border-green-500 bg-green-500/5 text-green-600 ring-1 ring-green-500/20' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50'}`}>
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-gray-400">Key {i + 1}</span>
                        <span className="font-mono text-xs tracking-widest">••••{k.slice(-6)}</span>
                      </div>
                      {config.currentKeyIndex === i && (
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                          <span className="text-[9px] font-bold uppercase">Ready</span>
                        </div>
                      )}
                      {config.currentKeyIndex !== i && (
                        <button
                          onClick={() => onSelectKey(config.id, i)}
                          className="text-[10px] bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 px-2 py-1 rounded transition-colors"
                        >
                          Select
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="relative group">
                  <input
                    className="w-full text-xs py-2.5 pl-4 pr-12 border rounded-xl dark:bg-[#0A0A0A] dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all border-dashed"
                    placeholder="Type new API key and press Enter to add..."
                    onKeyDown={e => {
                      if (e.key === 'Enter' && e.target.value.trim()) {
                        onAddKey(config.id, e.target.value.trim());
                        e.target.value = '';
                      }
                    }}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-bold uppercase bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">⏎ Enter</div>
                </div>
                <p className="mt-2 text-[10px] text-gray-500 italic">Keys are rotated automatically on 429 Too Many Requests errors.</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ===== USERS SECTION COMPONENT =====
function UsersSection({ users, showAddForm, setShowAddForm, editingUser, setEditingUser, onAddUser, onUpdateUser, onDeleteUser }) {
  const [formData, setFormData] = useState({ email: '', password: '', isAdmin: false });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingUser) {
      onUpdateUser(editingUser.id, formData);
    } else {
      onAddUser(formData);
    }
    setFormData({ email: '', password: '', isAdmin: false });
  };

  return (
    <div className="bg-white dark:bg-[#18181B] border border-gray-200 dark:border-gray-800 rounded-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold">User Management</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Add, edit, and manage user accounts
          </p>
        </div>
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            setEditingUser(null);
            setFormData({ email: '', password: '', isAdmin: false });
          }}
          className="btn btn-primary text-sm"
        >
          {showAddForm ? 'Cancel' : '+ Add User'}
        </button>
      </div>

      {/* Add/Edit Form */}
      {(showAddForm || editingUser) && (
        <form onSubmit={handleSubmit} className="bg-gray-50 dark:bg-[#27272A] rounded-lg p-6 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-50 mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="user@example.com"
                className="w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-50 mb-2">
                Password {editingUser && '(leave blank to keep current)'}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="w-full"
                required={!editingUser}
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isAdmin}
                onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-900 dark:text-gray-50">Admin privileges</span>
            </label>
          </div>
          <button type="submit" className="mt-4 btn btn-primary">
            {editingUser ? 'Update User' : 'Add User'}
          </button>
        </form>
      )}

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-gray-200 dark:border-gray-800">
            <tr>
              <th className="pb-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Email</th>
              <th className="pb-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Role</th>
              <th className="pb-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Created</th>
              <th className="pb-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="4" className="py-12 text-center text-gray-500 dark:text-gray-400">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 dark:border-gray-800/50">
                  <td className="py-4 font-medium">{user.email}</td>
                  <td className="py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.isAdmin
                      ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                      : 'bg-gray-500/10 text-gray-600 dark:text-gray-400'
                      }`}>
                      {user.isAdmin ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td className="py-4 text-sm text-gray-600 dark:text-gray-400">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const newStatus = !user.isAdmin;
                          onUpdateUser(user.id, { isAdmin: newStatus });
                        }}
                        className={`px-3 py-1 rounded text-xs font-medium ${user.isAdmin
                          ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20'
                          : 'bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20'}`}
                      >
                        {user.isAdmin ? 'Revoke Admin' : 'Make Admin'}
                      </button>
                      <button
                        onClick={() => {
                          setEditingUser(user);
                          setFormData({ email: user.email, password: '', isAdmin: user.isAdmin });
                          setShowAddForm(false);
                        }}
                        className="px-3 py-1 rounded text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDeleteUser(user.id)}
                        className="px-3 py-1 rounded text-xs font-medium bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20"
                      >
                        Delete
                      </button>

                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ===== TEMPLATES SECTION COMPONENT =====
function TemplatesSection({ templates, showCreator, setShowCreator, aiGenerating, onGenerateFromImage, onGenerateFromAI, onDelete, setPreviewTemplate }) {
  const [aiDescription, setAiDescription] = useState('');
  const [imageFile, setImageFile] = useState(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Template Creator */}
      <div className="bg-white dark:bg-[#18181B] border border-gray-200 dark:border-gray-800 rounded-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold">🤖 AI Template Creator</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Generate new resume templates using AI or upload an image
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Generate from Description */}
          <div className="bg-gray-50 dark:bg-[#27272A] rounded-lg p-6">
            <h3 className="font-semibold mb-3">Generate from Description</h3>
            <textarea
              value={aiDescription}
              onChange={(e) => setAiDescription(e.target.value)}
              placeholder="Describe the template you want to create... e.g., 'A modern, minimalist template with a sidebar for skills, using blue accents and clean typography'"
              rows={5}
              className="w-full mb-4"
            />
            <button
              onClick={() => {
                if (aiDescription.trim()) {
                  onGenerateFromAI(aiDescription);
                  setAiDescription('');
                }
              }}
              disabled={aiGenerating || !aiDescription.trim()}
              className="btn btn-primary w-full"
            >
              {aiGenerating ? 'Generating...' : '✨ Generate Template'}
            </button>
          </div>

          {/* Generate from Image */}
          <div className="bg-gray-50 dark:bg-[#27272A] rounded-lg p-6">
            <h3 className="font-semibold mb-3">Generate from Image</h3>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center mb-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="template-image"
              />
              <label htmlFor="template-image" className="cursor-pointer">
                {imageFile ? (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {imageFile.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Click to change</p>
                  </div>
                ) : (
                  <div>
                    <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Upload template image
                    </p>
                  </div>
                )}
              </label>
            </div>
            <button
              onClick={() => {
                if (imageFile) {
                  onGenerateFromImage(imageFile);
                  setImageFile(null);
                }
              }}
              disabled={aiGenerating || !imageFile}
              className="btn btn-primary w-full"
            >
              {aiGenerating ? 'Analyzing...' : '🎨 Generate from Image'}
            </button>
          </div>
        </div>
      </div>

      {/* Existing Templates */}
      <div className="bg-white dark:bg-[#18181B] border border-gray-200 dark:border-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-6">Existing Templates</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.length === 0 ? (
            <div className="col-span-3 py-12 text-center text-gray-500 dark:text-gray-400">
              No templates yet. Create one using AI!
            </div>
          ) : (
            templates.map((template) => (
              <div key={template.id} className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 group">
                <div
                  className="aspect-[8.5/11] bg-gray-100 dark:bg-[#27272A] rounded mb-3 overflow-hidden border border-gray-200 dark:border-gray-700 cursor-pointer relative"
                  onClick={() => setPreviewTemplate(template)}
                >
                  <ScaledPreview template={template.baseStyle} className="w-full" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="bg-white/90 dark:bg-black/90 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm backdrop-blur-sm">Quick Look</span>
                  </div>
                </div>
                <h3 className="font-semibold mb-1">{template.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{template.description}</p>
                <button
                  onClick={() => onDelete(template.id)}
                  className="text-sm text-red-600 dark:text-red-400 hover:underline"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ===== GENERAL API KEYS SECTION COMPONENT (Mail, etc) =====
function GeneralKeysSection({ keys, showAddForm, setShowAddForm, newKey, setNewKey, onAddKey, onDelete }) {
  return (
    <div className="bg-white dark:bg-[#18181B] border border-gray-200 dark:border-gray-800 rounded-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold">System API Keys</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage infrastructure keys like Mail (Gmail App Password), Groq, etc.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn btn-secondary text-sm"
        >
          {showAddForm ? 'Cancel' : '+ Add System Key'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={onAddKey} className="bg-gray-50 dark:bg-[#27272A] rounded-lg p-6 mb-6 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Key Name</label>
            <input
              placeholder="e.g. My Mail Password"
              value={newKey.name}
              onChange={e => setNewKey({ ...newKey, name: e.target.value })}
              className="w-full px-3 py-2 border rounded dark:bg-[#18181B] dark:border-gray-700"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Provider</label>
            <select
              value={newKey.provider}
              onChange={e => setNewKey({ ...newKey, provider: e.target.value })}
              className="w-full px-3 py-2 border rounded dark:bg-[#18181B] dark:border-gray-700"
            >
              <option value="mail">Mail (Gmail App Password)</option>
              <option value="groq">Groq</option>
              <option value="openai">OpenAI</option>
            </select>
          </div>
          {newKey.provider === 'mail' && (
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email Address (Sender)</label>
              <input
                type="email"
                placeholder="e.g. your-email@gmail.com"
                value={newKey.owner || ''}
                onChange={e => setNewKey({ ...newKey, owner: e.target.value })}
                className="w-full px-3 py-2 border rounded dark:bg-[#18181B] dark:border-gray-700"
                required={newKey.provider === 'mail'}
              />
              <p className="text-[10px] text-gray-500 mt-1">This email address must match the account generating the App Password.</p>
            </div>
          )}
          <div className="col-span-2">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">API Key / Password</label>
            <input
              type="password"
              placeholder="Enter sensitive key..."
              value={newKey.apiKey}
              onChange={e => setNewKey({ ...newKey, apiKey: e.target.value })}
              className="w-full px-3 py-2 border rounded dark:bg-[#18181B] dark:border-gray-700"
              required
            />
          </div>
          <button className="btn btn-primary col-span-2 mt-2">Save System Key</button>
        </form>
      )}

      <div className="space-y-3">
        {keys.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No system keys configured.</div>
        ) : keys.map(key => (
          <div key={key.id} className="flex justify-between items-center p-4 border border-gray-100 dark:border-gray-800 rounded-lg">
            <div>
              <div className="flex items-center gap-3">
                <span className="font-bold">{key.name}</span>
                <span className="text-[10px] bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded uppercase">{key.provider}</span>
              </div>
              <p className="text-xs font-mono text-gray-400 mt-1">{key.apiKey}</p>
            </div>
            <button
              onClick={() => onDelete(key.id)}
              className="text-gray-400 hover:text-red-500 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
