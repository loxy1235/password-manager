import React, { useState, useEffect } from 'react';
import { Lock, Plus, Eye, EyeOff, Copy, Trash2, Edit2, Save, X, Key, Shield } from 'lucide-react';

export default function PasswordManager() {
  const [masterPassword, setMasterPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwords, setPasswords] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    website: '',
    username: '',
    password: '',
    notes: ''
  });

  useEffect(() => {
    loadPasswords();
  }, []);

  const loadPasswords = async () => {
    try {
      const result = await window.storage.list('pwd:');
      if (result && result.keys) {
        const loadedPasswords = await Promise.all(
          result.keys.map(async (key) => {
            try {
              const data = await window.storage.get(key);
              return data ? JSON.parse(data.value) : null;
            } catch {
              return null;
            }
          })
        );
        setPasswords(loadedPasswords.filter(p => p !== null));
      }
    } catch (error) {
      console.log('No existing passwords found');
    }
    setLoading(false);
  };

  const handleUnlock = (e) => {
    e.preventDefault();
    if (masterPassword.length >= 8) {
      setIsUnlocked(true);
    } else {
      alert('Master password must be at least 8 characters');
    }
  };

  const handleAddPassword = async (e) => {
    e.preventDefault();
    
    if (!formData.website || !formData.username || !formData.password) {
      alert('Please fill in all required fields');
      return;
    }

    const newPassword = {
      id: editingId || `pwd_${Date.now()}`,
      ...formData,
      createdAt: editingId ? passwords.find(p => p.id === editingId)?.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await window.storage.set(`pwd:${newPassword.id}`, JSON.stringify(newPassword));
      
      if (editingId) {
        setPasswords(passwords.map(p => p.id === editingId ? newPassword : p));
      } else {
        setPasswords([...passwords, newPassword]);
      }
      
      resetForm();
    } catch (error) {
      alert('Failed to save password. Please try again.');
    }
  };

  const handleEdit = (password) => {
    setFormData({
      website: password.website,
      username: password.username,
      password: password.password,
      notes: password.notes || ''
    });
    setEditingId(password.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this password?')) {
      try {
        await window.storage.delete(`pwd:${id}`);
        setPasswords(passwords.filter(p => p.id !== id));
      } catch (error) {
        alert('Failed to delete password');
      }
    }
  };

  const togglePasswordVisibility = (id) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    alert(`${field} copied to clipboard!`);
  };

  const generatePassword = () => {
    const length = 16;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setFormData({ ...formData, password });
  };

  const resetForm = () => {
    setFormData({ website: '', username: '', password: '', notes: '' });
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="flex justify-center mb-6">
            <div className="bg-indigo-100 p-4 rounded-full">
              <Shield className="w-12 h-12 text-indigo-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">Password Manager</h1>
          <p className="text-center text-gray-600 mb-8">Enter your master password to unlock</p>
          
          <form onSubmit={handleUnlock}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Master Password</label>
              <input
                type="password"
                value={masterPassword}
                onChange={(e) => setMasterPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter master password"
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2"
            >
              <Lock className="w-5 h-5" />
              Unlock Vault
            </button>
          </form>
          
          <p className="text-xs text-gray-500 text-center mt-6">
            Your passwords are stored locally and encrypted
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-800">Password Manager</h1>
          </div>
          <button
            onClick={() => setIsUnlocked(false)}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            Lock Vault
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">
            Your Passwords ({passwords.length})
          </h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
          >
            {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {showForm ? 'Cancel' : 'Add Password'}
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingId ? 'Edit Password' : 'Add New Password'}
            </h3>
            <form onSubmit={handleAddPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website/App *</label>
                <input
                  type="text"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g., Gmail, Facebook"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username/Email *</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter password"
                    required
                  />
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                  >
                    <Key className="w-4 h-4" />
                    Generate
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Additional notes"
                  rows="3"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {editingId ? 'Update' : 'Save'} Password
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid gap-4">
          {passwords.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <Lock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No passwords saved yet</h3>
              <p className="text-gray-500">Click "Add Password" to save your first password</p>
            </div>
          ) : (
            passwords.map((pwd) => (
              <div key={pwd.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">{pwd.website}</h3>
                    <p className="text-gray-600 text-sm">{pwd.username}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(pwd)}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(pwd.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-50 px-4 py-2 rounded-lg font-mono text-sm">
                      {visiblePasswords[pwd.id] ? pwd.password : '••••••••••••'}
                    </div>
                    <button
                      onClick={() => togglePasswordVisibility(pwd.id)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                    >
                      {visiblePasswords[pwd.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => copyToClipboard(pwd.password, 'Password')}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>

                  {pwd.notes && (
                    <div className="bg-yellow-50 border border-yellow-200 px-4 py-2 rounded-lg">
                      <p className="text-sm text-gray-700">{pwd.notes}</p>
                    </div>
                  )}

                  <div className="text-xs text-gray-500">
                    Last updated: {new Date(pwd.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
