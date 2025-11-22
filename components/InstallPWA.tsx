
import React, { useEffect, useState } from 'react';

export const InstallPWA: React.FC = () => {
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [promptInstall, setPromptInstall] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed/standalone
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || 
                             (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);
    if (isStandaloneMode) return;

    // Check for iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    if (isIosDevice) {
        // Show iOS prompt after a short delay if not closed before
        const hasClosed = localStorage.getItem('iosPromptClosed');
        if (!hasClosed) {
            setTimeout(() => setShowIOSPrompt(true), 3000);
        }
    }

    // Check for Android/Desktop (Chrome/Edge)
    const handler = (e: any) => {
      e.preventDefault();
      setSupportsPWA(true);
      setPromptInstall(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!promptInstall) return;
    
    promptInstall.prompt();
    promptInstall.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
            setSupportsPWA(false);
        }
        setPromptInstall(null);
    });
  };

  const closeIOSPrompt = () => {
      setShowIOSPrompt(false);
      localStorage.setItem('iosPromptClosed', 'true');
  };

  if (isStandalone) return null;

  return (
    <>
        {/* Android / Chrome Install Button */}
        {supportsPWA && (
            <div className="fixed bottom-24 left-4 right-4 z-50 animate-in slide-in-from-bottom-10 duration-500">
                <button 
                    onClick={handleInstallClick}
                    className="w-full bg-primary/90 backdrop-blur-md border border-white/20 shadow-2xl rounded-2xl p-4 flex items-center justify-between group"
                >
                    <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-xl">
                             <span className="material-symbols-outlined text-black">download</span>
                        </div>
                        <div className="text-left">
                            <h3 className="text-white font-bold text-sm">Install App</h3>
                            <p className="text-slate-400 text-xs">Add to Home Screen</p>
                        </div>
                    </div>
                    <div className="bg-indigo-600 px-4 py-2 rounded-lg text-xs font-bold text-white group-hover:bg-indigo-500 transition-colors">
                        Install
                    </div>
                </button>
            </div>
        )}

        {/* iOS Instructions */}
        {showIOSPrompt && (
            <div className="fixed bottom-6 left-4 right-4 z-50 animate-in slide-in-from-bottom-10 duration-500">
                <div className="bg-surface-dark/95 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl p-5 relative">
                    <button onClick={closeIOSPrompt} className="absolute top-2 right-2 text-slate-400 hover:text-white p-2">
                        <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                    
                    <div className="flex gap-4 mb-3">
                         <span className="material-symbols-outlined text-4xl text-blue-500">ios_share</span>
                         <div>
                             <h3 className="font-bold text-white">Install for iOS</h3>
                             <p className="text-xs text-slate-300 mt-1">To install this app on your iPhone:</p>
                         </div>
                    </div>
                    
                    <ol className="text-sm text-slate-300 space-y-2 list-decimal pl-4">
                        <li>Tap the <span className="font-bold text-blue-400">Share</span> button below.</li>
                        <li>Scroll down and tap <span className="font-bold text-white flex items-center gap-1 inline-flex"><span className="material-symbols-outlined text-sm">add_box</span> Add to Home Screen</span>.</li>
                    </ol>
                    
                    {/* Pointing Arrow */}
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-surface-dark rotate-45 border-b border-r border-white/10"></div>
                </div>
            </div>
        )}
    </>
  );
};
