
import React, { useState } from 'react';
import { useAppStore } from '../store/mockStore';
import { playSound } from '../services/soundService';

export const StudentLogin: React.FC = () => {
  const { loginStudent, isConfigured } = useAppStore();
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);

  const handlePress = (digit: string) => {
    playSound.click();
    if (code.length < 4) {
      const newCode = code + digit;
      setCode(newCode);
      setError(false);
      if (newCode.length === 4) {
        const success = loginStudent(newCode);
        if (!success) {
          playSound.error();
          setError(true);
          setTimeout(() => setCode(''), 500);
        } else {
          playSound.success();
        }
      }
    }
  };

  const handleBackspace = () => {
    playSound.click();
    setCode(prev => prev.slice(0, -1));
    setError(false);
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-primary font-display overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-5 pointer-events-none">
        <svg height="100%" width="100%"><defs><pattern height="40" id="a" patternTransform="scale(2) rotate(45)" patternUnits="userSpaceOnUse" width="40"><rect fill="none" height="100%" width="100%" x="0" y="0"/><path d="M10-10v40M30-10v40M-10 10h40M-10 30h40" stroke="#e2e8f0" strokeWidth="0.5"/></pattern></defs><rect fill="url(#a)" height="100%" width="100%"/></svg>
      </div>
      
      {/* Config Status Indicator */}
      {!isConfigured && (
          <div className="absolute top-4 right-4 z-20 bg-orange-500/10 border border-orange-500/20 px-3 py-1 rounded-full">
              <p className="text-[10px] font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                  Demo Mode
              </p>
          </div>
      )}

      <div className="relative z-10 flex flex-col h-full">
        <header className="p-6 flex justify-center">
          <h2 className="text-text-light font-bold tracking-wide opacity-80">Workshop Access</h2>
        </header>

        <main className="flex flex-col items-center flex-grow pt-8 px-4">
          <h1 className="text-text-light text-3xl font-bold text-center mb-2">Enter Access Code</h1>
          <p className="text-text-muted text-center mb-8">Enter the 4-digit code provided by your instructor.</p>

          {/* Code Display */}
          <div className="flex gap-3 mb-8">
            {[0, 1, 2, 3].map((i) => (
              <div 
                key={i}
                className={`
                  flex h-16 w-14 items-center justify-center rounded-xl border-2 text-3xl font-bold text-white transition-all
                  ${error ? 'border-warning bg-warning/10' : 'border-surface-dark bg-surface-dark/50'}
                  ${code[i] ? 'border-accent/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : ''}
                `}
              >
                {code[i]}
              </div>
            ))}
          </div>
          
          <div className="h-8">
            {error && <p className="text-warning font-medium animate-pulse">Incorrect code. Try again.</p>}
          </div>
        </main>

        {/* Keypad */}
        <footer className="pb-8 px-4">
          <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => handlePress(String(num))}
                className="h-20 w-full rounded-full bg-surface-dark/50 text-white text-3xl font-medium hover:bg-surface-dark active:scale-95 active:bg-surface-dark/80 transition-all"
              >
                {num}
              </button>
            ))}
            <div />
            <button
              onClick={() => handlePress("0")}
              className="h-20 w-full rounded-full bg-surface-dark/50 text-white text-3xl font-medium hover:bg-surface-dark active:scale-95 active:bg-surface-dark/80 transition-all"
            >
              0
            </button>
            <button
              onClick={handleBackspace}
              className="h-20 w-full rounded-full flex items-center justify-center text-white/70 hover:text-white active:scale-95 active:bg-surface-dark/80 transition-all"
            >
              <span className="material-symbols-outlined !text-3xl">backspace</span>
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};
