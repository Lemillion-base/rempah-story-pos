import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { LogIn } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, getRedirectPath } = useAuthStore();
  const { settings } = useSettingsStore();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = login(username, password);
    if (user) {
      navigate(getRedirectPath(user.role));
    } else {
      setError('Username atau password salah');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-brand-100 p-4">
      <div className="card w-full max-w-sm p-8">
        <div className="text-center mb-8">
          {settings.storeLogo ? (
            <img src={settings.storeLogo} alt="Logo" className="w-16 h-16 mx-auto mb-3 rounded-xl object-contain" />
          ) : (
            <div className="text-4xl mb-3">🌿</div>
          )}
          <h1 className="text-2xl font-bold text-brand-700">{settings.storeName}</h1>
          <p className="text-sm text-slate-500 mt-1">Point of Sale System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(''); }}
              className="input"
              placeholder="Masukkan username"
              autoFocus
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              className="input"
              placeholder="Masukkan password"
            />
          </div>
          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}
          <button type="submit" className="btn-primary w-full">
            <LogIn size={18} /> Masuk
          </button>
        </form>

        {settings.demoMode && (
          <div className="mt-6 p-3 bg-slate-50 rounded-xl text-xs text-slate-500 space-y-1">
            <p className="font-medium text-slate-600">Demo Accounts:</p>
            <p>Manager: manager / manager123</p>
            <p>Kasir: kasir / kasir123</p>
            <p>Acaraki: acaraki / acaraki123</p>
          </div>
        )}
      </div>
    </div>
  );
}
