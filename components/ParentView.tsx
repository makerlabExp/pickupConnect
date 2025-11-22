
import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store/mockStore';
import { playSound } from '../services/soundService';

export const ParentView: React.FC = () => {
  const { currentSession, parents, pickupQueue, updatePickupStatus, sendMessage, activeParentId, loginParent, logout } = useAppStore();
  
  // --- Login State ---
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [timeLeft, setTimeLeft] = useState<{h: number, m: number, s: number}>({ h: 0, m: 0, s: 0 });
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // --- Timer Logic ---
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, currentSession.endTime - now);
      
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);
      
      setTimeLeft({ h, m, s });
    }, 1000);
    return () => clearInterval(interval);
  }, [currentSession.endTime]);

  // --- Login Handler ---
  const handleLogin = (e: React.FormEvent) => {
      e.preventDefault();
      playSound.click();
      const success = loginParent(code);
      if (success) {
          playSound.success();
          setError(false);
      } else {
          playSound.error();
          setError(true);
      }
  };

  // Determine current user based on store
  const currentUser = parents.find(p => p.id === activeParentId);
  // Find TODAY's pickup request. The store filters pickupQueue to today mostly, but verify.
  const currentPickup = pickupQueue.find(p => p.studentId === currentUser?.studentId);
  
  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [currentPickup?.chatHistory?.length]);

  // Sound notification for new messages from student
  const prevMsgCount = useRef(currentPickup?.chatHistory?.length || 0);
  useEffect(() => {
      const count = currentPickup?.chatHistory?.length || 0;
      if (count > prevMsgCount.current) {
          const lastMsg = currentPickup?.chatHistory[count - 1];
          if (lastMsg?.sender === 'student') {
              playSound.notification();
          }
      }
      prevMsgCount.current = count;
  }, [currentPickup?.chatHistory]);


  // --- IF NOT LOGGED IN: Show Login Screen ---
  if (!currentUser) {
      return (
          <div className="flex min-h-screen w-full flex-col bg-primary text-text-light font-display">
               <div className="flex items-center justify-center p-4">
                <h1 className="text-lg font-bold text-center">Parent Access</h1>
               </div>

               <div className="flex-1 flex flex-col items-center justify-center p-8">
                   <div className="mb-8 p-6 rounded-full bg-surface-dark ring-1 ring-white/10">
                       <span className="material-symbols-outlined text-6xl text-blue-400">family_restroom</span>
                   </div>
                   
                   <h2 className="text-2xl font-bold mb-2">Welcome, Parent!</h2>
                   <p className="text-text-muted text-center mb-8">Enter your child's access code to connect to the workshop.</p>
                   
                   <form onSubmit={handleLogin} className="w-full max-w-xs flex flex-col gap-4">
                       <input 
                           type="text" 
                           maxLength={4}
                           inputMode="numeric"
                           value={code}
                           onChange={(e) => setCode(e.target.value)}
                           placeholder="Student Code (e.g. 4492)"
                           className={`
                               w-full bg-surface-dark border-2 rounded-xl px-4 py-4 text-center text-2xl font-bold tracking-widest text-white focus:outline-none transition-colors
                               ${error ? 'border-warning' : 'border-slate-700 focus:border-accent'}
                           `}
                       />
                       {error && <p className="text-warning text-sm text-center font-medium">Invalid code. Please try again.</p>}
                       
                       <button 
                            type="submit"
                            disabled={code.length < 4}
                            className={`
                                w-full py-4 rounded-xl font-bold text-lg transition-all
                                ${code.length === 4 ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}
                            `}
                       >
                           Connect
                       </button>
                   </form>
                   
                   <p className="mt-8 text-xs text-slate-600">Use the code provided in the welcome email.</p>
               </div>
          </div>
      );
  }

  // --- IF LOGGED IN: Show Dashboard ---
  const status = currentPickup?.status || 'scheduled';
  const chatHistory = currentPickup?.chatHistory || [];

  // Handle Finished State (Completed)
  if (status === 'completed') {
      return (
          <div className="flex min-h-screen w-full flex-col items-center justify-center bg-primary p-6 text-text-light font-display">
              <div className="w-full max-w-md bg-surface-dark border border-white/10 rounded-3xl p-8 text-center shadow-2xl">
                  <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                      <span className="material-symbols-outlined text-4xl">check_circle</span>
                  </div>
                  <h1 className="text-2xl font-bold mb-2">Pickup Confirmed!</h1>
                  <p className="text-slate-400 mb-8">
                      Thank you for confirming. Have a wonderful evening!
                  </p>
                  <button 
                      onClick={() => logout()}
                      className="w-full py-3 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-700 transition-colors"
                  >
                      Close App
                  </button>
              </div>
          </div>
      )
  }

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      playSound.click();
      sendMessage(currentUser.studentId, messageInput, 'parent');
      setMessageInput('');
    }
  };

  const handleStatusUpdate = (newStatus: 'on_way' | 'arrived' | 'completed') => {
    playSound.click();
    if (newStatus === 'completed') {
        playSound.success();
    }
    updatePickupStatus(currentUser.studentId, newStatus);
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-primary text-text-light overflow-x-hidden font-display">
      {/* App Bar */}
      <div className="flex items-center bg-primary/80 backdrop-blur-sm p-4 pb-2 justify-between shadow-md z-10 sticky top-0 border-b border-white/5">
        <div className="flex items-center gap-3 flex-1">
            <div className="flex size-12 shrink-0 items-center">
            <div 
                className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 ring-2 ring-surface-dark" 
                style={{ backgroundImage: `url("${currentUser.avatarUrl}")` }}
            />
            </div>
            <div className="flex flex-col leading-tight">
                <h2 className="text-text-light text-lg font-bold">Hello, {currentUser.name}</h2>
                <p className="text-xs text-text-muted">Connected to Student ID: {currentUser.studentId}</p>
            </div>
        </div>
        
        <button onClick={() => { playSound.click(); logout(); }} className="flex size-10 items-center justify-center rounded-full bg-surface-dark text-text-muted hover:text-white transition-colors">
          <span className="material-symbols-outlined text-xl">logout</span>
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 pt-6 pb-32">
        
        {/* Workshop Card */}
        <div className="flex flex-col rounded-2xl bg-surface-dark shadow-lg overflow-hidden mb-6 border border-white/5">
          <div 
            className="w-full aspect-[2.5/1] bg-cover bg-center"
            style={{ backgroundImage: `url("${currentSession.imageUrl}")` }}
          />
          <div className="flex items-end justify-between p-4">
            <div>
                <p className="text-text-muted text-xs uppercase tracking-wider font-bold mb-1">Current Workshop</p>
                <p className="text-text-light text-lg font-bold leading-tight">{currentSession.title}</p>
            </div>
             {/* Timer Mini */}
            <div className="flex gap-2 text-center">
                <div className="bg-slate-800 px-2 py-1 rounded">
                    <span className="text-white font-mono font-bold text-sm">{String(timeLeft.h).padStart(2,'0')}</span>
                </div>
                <span className="text-white font-bold">:</span>
                <div className="bg-slate-800 px-2 py-1 rounded">
                    <span className="text-white font-mono font-bold text-sm">{String(timeLeft.m).padStart(2,'0')}</span>
                </div>
            </div>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="flex flex-col gap-3 mb-6">
            <div className="flex items-center justify-between px-1">
               <h3 className="text-text-light text-xs font-bold uppercase tracking-wider opacity-70">Conversation</h3>
               <span className="text-[10px] text-text-muted bg-surface-dark px-2 py-1 rounded-full border border-white/5">Live</span>
            </div>
            
            <div className="bg-surface-dark rounded-[1.5rem] border border-white/5 overflow-hidden flex flex-col shadow-inner h-96 relative">
                 <div 
                    ref={chatContainerRef}
                    className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 scroll-smooth pb-20"
                 >
                    {chatHistory.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-text-muted opacity-50 gap-2">
                            <span className="material-symbols-outlined text-3xl">chat_bubble_outline</span>
                            <p className="text-sm">Send a message to start</p>
                        </div>
                    ) : (
                        chatHistory.map((msg) => {
                            const isMe = msg.sender === 'parent';
                            return (
                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                        isMe 
                                        ? 'bg-blue-600 text-white rounded-br-none' 
                                        : 'bg-slate-700/80 text-white rounded-bl-none'
                                    }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            );
                        })
                    )}
                 </div>
                 
                 {/* Floating Pill Input - Positioned absolutely at the bottom of the card container */}
                 <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-slate-900 via-slate-900/90 to-transparent">
                    <div className="flex items-end gap-2">
                        <div className="flex-1 bg-slate-800/80 backdrop-blur-md rounded-[1.5rem] ring-1 ring-white/10 focus-within:ring-blue-500/50 focus-within:ring-2 transition-all flex items-center shadow-lg">
                            <input 
                                className="w-full bg-transparent border-none px-5 py-3 text-sm text-text-light placeholder:text-slate-500 focus:ring-0"
                                placeholder="Message your child..."
                                value={messageInput}
                                onChange={(e) => setMessageInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            />
                        </div>
                        <button 
                            onClick={handleSendMessage}
                            disabled={!messageInput.trim()}
                            className={`h-[46px] w-[46px] shrink-0 rounded-full flex items-center justify-center transition-all shadow-lg ${
                                messageInput.trim() 
                                ? 'bg-blue-600 text-white hover:scale-105 hover:bg-blue-500' 
                                : 'bg-slate-800 text-white/20 cursor-not-allowed ring-1 ring-white/5'
                            }`}
                        >
                            <span className="material-symbols-outlined text-xl">send</span>
                        </button>
                    </div>
                 </div>
            </div>
        </div>

        {/* Pickup Actions */}
        <h3 className="text-text-light text-sm font-bold uppercase tracking-wider opacity-70 mb-3 px-1">Status Controls</h3>
        
        {status === 'released' ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl mb-4">
                     <div className="flex gap-3 items-center">
                         <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                             <span className="material-symbols-outlined text-emerald-400">check</span>
                         </div>
                         <div>
                             <h4 className="font-bold text-emerald-400">Child Released</h4>
                             <p className="text-xs text-emerald-200/70">Instructor has sent your child out.</p>
                         </div>
                     </div>
                 </div>
                 <button
                    onClick={() => handleStatusUpdate('completed')}
                    className="w-full h-20 flex items-center justify-center rounded-2xl font-bold text-lg bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 hover:scale-[1.02] active:scale-95 transition-all"
                 >
                    <span className="mr-3 material-symbols-outlined text-2xl">how_to_reg</span>
                    Confirm I have my child
                 </button>
            </div>
        ) : (
            <div className="flex flex-col gap-3">
            <button
                onClick={() => handleStatusUpdate('on_way')}
                disabled={status === 'on_way' || status === 'arrived'}
                className={`
                w-full h-16 flex items-center justify-center rounded-2xl font-bold transition-all duration-300 active:scale-95
                ${status === 'on_way' || status === 'arrived' 
                    ? 'bg-warning text-primary opacity-100 shadow-[0_0_20px_rgba(245,158,11,0.3)] ring-2 ring-warning' 
                    : 'bg-surface-dark hover:bg-surface-dark/80 text-text-muted border border-white/5'
                }
                `}
            >
                <span className="mr-3 material-symbols-outlined text-2xl">local_taxi</span>
                {status === 'on_way' ? "Status: On My Way" : "I'm leaving now"}
            </button>

            <button
                onClick={() => handleStatusUpdate('arrived')}
                disabled={status === 'arrived'}
                className={`
                w-full h-16 flex items-center justify-center rounded-2xl font-bold transition-all duration-300 active:scale-95
                ${status === 'arrived'
                    ? 'bg-accent text-primary shadow-[0_0_20px_rgba(16,185,129,0.3)] ring-2 ring-accent'
                    : status === 'on_way' 
                    ? 'bg-surface-dark text-text-light border-2 border-accent hover:bg-accent hover:text-primary shadow-lg'
                    : 'bg-surface-dark text-text-muted opacity-50 cursor-not-allowed border border-white/5'
                }
                `}
            >
                <span className="mr-3 material-symbols-outlined text-2xl">location_on</span>
                {status === 'arrived' ? "Status: Arrived" : "I'm here / Outside"}
            </button>
            </div>
        )}
      </div>
    </div>
  );
};