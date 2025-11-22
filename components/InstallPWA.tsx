
import React, { useEffect, useState } from 'react';

export const InstallPWA: React.FC = () => {
  const [canPrompt, setCanPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // 1. Check if already installed
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || 
                             (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);
    if (isStandaloneMode) return;

    // 2. Detect Platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // 3. Detect "Mobile" loosely (to show button on other mobile browsers like Firefox)
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);

    // 4. Chrome/Edge "beforeinstallprompt" event
    const handler = (e: any) => {
      e.preventDefault();
      setCanPrompt(true);
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // 5. Fallback for iOS / Other Browsers
    // If we are on mobile but NOT standalone, we generally want to allow the user to see the "Install" button
    // which then triggers either the native prompt (if captured) OR the instructions modal.
    if (isMobile && !isStandaloneMode) {
        // We set canPrompt to true to show the button. 
        // Logic inside handleClick handles whether to show native prompt or manual instructions.
        setCanPrompt(true);
    }

    // iOS Auto-Prompt (once)
    if (isIosDevice && !localStorage.getItem('iosPromptSeen')) {
        setTimeout(() => setShowInstructions(true), 3000);
        localStorage.setItem('iosPromptSeen', 'true');
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Case A: Native Chrome/Edge Prompt
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult: any) => {
            if (choiceResult.outcome === 'accepted') {
                setCanPrompt(false);
            }
            setDeferredPrompt(null);
        });
        return;
    }

    // Case B: iOS or Other Browsers (Firefox, etc) -> Show Instructions
    setShowInstructions(true);
  };

  if (isStandalone) return null;
  if (!canPrompt && !showInstructions) return null;

  return (
    <>
        {/* Floating Install Button */}
        {canPrompt && !showInstructions && (
            <div className="fixed bottom-6 left-4 right-4 z-50 animate-in slide-in-from-bottom-10 duration-500 pointer-events-none">
                <button 
                    onClick={handleInstallClick}
                    className="w-full pointer-events-auto bg-primary/90 backdrop-blur-md border border-white/20 shadow-2xl rounded-2xl p-4 flex items-center justify-between group cursor-pointer hover:bg-surface-dark transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-xl">
                             <span className="material-symbols-outlined text-black">download</span>
                        </div>
                        <div className="text-left">
                            <h3 className="text-white font-bold text-sm">Install App</h3>
                            <p className="text-slate-400 text-xs">Add to Home Screen for best experience</p>
                        </div>
                    </div>
                    <div className="bg-indigo-600 px-4 py-2 rounded-lg text-xs font-bold text-white group-hover:bg-indigo-500 transition-colors">
                        Get App
                    </div>
                </button>
            </div>
        )}

        {/* Instructions Modal (iOS / Manual) */}
        {showInstructions && (
            <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="w-full max-w-sm m-4 bg-surface-dark border border-white/10 shadow-2xl rounded-3xl p-6 relative animate-in slide-in-from-bottom-10 duration-300">
                    <button 
                        onClick={() => setShowInstructions(false)} 
                        className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                    
                    <div className="flex flex-col items-center text-center mb-6">
                         <div className="h-16 w-16 bg-blue-600/20 text-blue-500 rounded-2xl flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-3xl">add_to_home_screen</span>
                         </div>
                         <h3 className="text-xl font-bold text-white">Install App</h3>
                         <p className="text-sm text-slate-400 mt-2">
                             {isIOS 
                                ? "Install this app on your iPhone for full screen access." 
                                : "Add to your home screen for the best experience."}
                         </p>
                    </div>
                    
                    <div className="bg-black/20 rounded-xl p-4 space-y-4 text-sm text-slate-300 text-left">
                        {isIOS ? (
                            <>
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-blue-500">ios_share</span>
                                    <span>1. Tap the <strong>Share</strong> button.</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-white">add_box</span>
                                    <span>2. Scroll down and tap <strong>Add to Home Screen</strong>.</span>
                                </div>
                            </>
                        ) : (
                             <>
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-slate-400">more_vert</span>
                                    <span>1. Tap the browser <strong>Menu</strong> (3 dots).</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-white">install_mobile</span>
                                    <span>2. Tap <strong>Install App</strong> or <strong>Add to Home screen</strong>.</span>
                                </div>
                            </>
                        )}
                    </div>
                    
                    <button 
                        onClick={() => setShowInstructions(false)}
                        className="w-full mt-6 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-500 transition-colors"
                    >
                        Understood
                    </button>
                    
                    {/* Visual Pointer for iOS Safari (Bottom Center usually) */}
                    {isIOS && (
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-surface-dark rotate-45 border-b border-r border-white/10"></div>
                    )}
                </div>
            </div>
        )}
    </>
  );
};
