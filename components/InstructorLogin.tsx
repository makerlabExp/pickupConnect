
import React, { useState } from 'react';
import { useAppStore } from '../store/mockStore';
import { playSound } from '../services/soundService';

export const InstructorLogin: React.FC = () => {
  const { loginInstructor } = useAppStore();
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    playSound.click();
    const success = loginInstructor(password);
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
            <div className="h-16 w-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-3xl text-purple-400">school</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Instructor Portal</h1>
            <p className="text-text-muted">Authorized Staff Only</p>
        </div>
        
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Access Code</label>
                <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="•••••"
                    autoFocus
                    className={`w-full bg-black/20 border rounded-xl px-4 py-3 text-white focus:outline-none transition-all ${error ? 'border-red-500' : 'border-white/10 focus:border-purple-500'}`}
                />
            </div>
            
            {error && <p className="text-red-400 text-xs text-center font-bold animate-pulse">Invalid Access Code</p>}
            
            <button 
                type="submit"
                className="mt-4 w-full py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-500 transition-all shadow-lg shadow-purple-600/20"
            >
                Start Session
            </button>
        </form>
      </div>
    </div>
  );
};
