
import React, { useState } from 'react';
import { useAppStore } from '../store/mockStore';
import { playSound } from '../services/soundService';

export const AdminLogin: React.FC = () => {
  const { loginAdmin } = useAppStore();
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    playSound.click();
    const success = loginAdmin(password);
    if (success) {
        playSound.success();
    } else {
        playSound.error();
        setError(true);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-primary p-6 font-display">
      <div className="w-full max-w-md p-8 rounded-2xl bg-slate-900 border border-white/10 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
            <div className="h-16 w-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 ring-4 ring-slate-800 ring-offset-4 ring-offset-slate-900">
                <span className="material-symbols-outlined text-3xl text-slate-300">admin_panel_settings</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Admin & Setup Portal</h1>
            <p className="text-text-muted text-center mt-1">Configure system and manage users</p>
        </div>
        
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Password</label>
                <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="•••••"
                    autoFocus
                    className={`w-full bg-black/20 border rounded-xl px-4 py-3 text-white focus:outline-none transition-all ${error ? 'border-red-500' : 'border-white/10 focus:border-indigo-500'}`}
                />
            </div>
            
            {error && <p className="text-red-400 text-xs text-center font-bold animate-pulse">Invalid password. Try 'admin'.</p>}
            
            <button 
                type="submit"
                className="mt-4 w-full py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20"
            >
                Login to Setup
            </button>
        </form>
        
        <div className="mt-8 pt-6 border-t border-white/5 text-center">
             <p className="text-[10px] text-slate-600">Default password: <strong>admin</strong></p>
        </div>
      </div>
    </div>
  );
};