import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store/mockStore';
import { playSound } from '../services/soundService';

export const ParentView: React.FC = () => {
  const { currentSession, parents, pickupQueue, updatePickupStatus, sendMessage, activeParentId, loginParent, logout } = useAppStore();
  
  // --- Login State ---
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  
  // --- Tab State (Home, Chat, Profile) ---
  const [activeTab, setActiveTab] = useState<'home' | 'chat' | 'profile'>('home');

  // --- Chat State ---
  const [messageInput, setMessageInput] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // --- Timer State ---
  const [timeLeft, setTimeLeft] = useState<{h: number, m: number, s: number}>({ h: 0, m: 0, s: 0 });

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

  // Determine current user
  const currentUser = parents.find(p => p.id === activeParentId);
  const currentPickup = pickupQueue.find(p => p.studentId === currentUser?.studentId);
  const status = currentPickup?.status || 'scheduled';
  const chatHistory = currentPickup?.chatHistory || [];

  // Auto-scroll chat
  useEffect(() => {
    if (activeTab === 'chat' && chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [activeTab, chatHistory.length]);

  // Sound notification logic
  const prevMsgCount = useRef(chatHistory.length);
  useEffect(() => {
      const count = chatHistory.length;
      if (count > prevMsgCount.current) {
          const lastMsg = chatHistory[count - 1];
          if (lastMsg?.sender === 'student') {
              playSound.notification();
          }
      }
      prevMsgCount.current = count;
  }, [chatHistory]);

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      playSound.click();
      sendMessage(currentUser!.studentId, messageInput, 'parent');
      setMessageInput('');
    }
  };

  const handleStatusUpdate = (newStatus: 'on_way' | 'arrived' | 'completed') => {
    playSound.click();
    if (newStatus === 'completed') playSound.success();
    updatePickupStatus(currentUser!.studentId, newStatus);
  };

  // --- UNLOGGED VIEW ---
  if (!currentUser) {
      return (
          <div className="flex h-[100dvh] w-full flex-col bg-primary text-text-light font-display overflow-hidden">
               <div className="flex-1 flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in duration-300">
                   <div className="mb-8 p-6 rounded-3xl bg-surface-dark shadow-2xl border border-white/10 relative overflow-hidden">
                       <div className="absolute inset-0 bg-blue-500/10 blur-xl"></div>
                       <span className="material-symbols-outlined text-6xl text-blue-400 relative z-10">family_restroom</span>
                   </div>
                   
                   <h2 className="text-2xl font-bold mb-2">Welcome Parent</h2>
                   <p className="text-text-muted text-center mb-8 text-sm">Enter your 4-digit family access code.</p>
                   
                   <form onSubmit={handleLogin} className="w-full max-w-xs flex flex-col gap-4">
                       <div className="relative">
                           <input 
                               type="text" 
                               maxLength={4}
                               inputMode="numeric"
                               value={code}
                               onChange={(e) => setCode(e.target.value)}
                               placeholder="0 0 0 0"
                               className={`
                                   w-full bg-surface-dark border rounded-2xl px-4 py-5 text-center text-3xl font-bold tracking-[0.5em] text-white focus:outline-none transition-all shadow-inner
                                   ${error ? 'border-red-500 text-red-500' : 'border-white/10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'}
                               `}
                           />
                       </div>
                       {error && <p className="text-red-400 text-xs text-center font-bold animate-pulse">Invalid code</p>}
                       
                       <button 
                            type="submit"
                            disabled={code.length < 4}
                            className={`
                                w-full py-4 rounded-2xl font-bold text-lg transition-all shadow-lg
                                ${code.length === 4 ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-500/25' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}
                            `}
                       >
                           Connect
                       </button>
                   </form>
               </div>
          </div>
      );
  }

  // --- COMPLETED VIEW ---
  if (status === 'completed') {
      return (
          <div className="flex h-[100dvh] w-full flex-col items-center justify-center bg-primary p-6 text-text-light font-display">
              <div className="w-full max-w-md bg-surface-dark border border-white/10 rounded-3xl p-8 text-center shadow-2xl animate-in zoom-in duration-300">
                  <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                      <span className="material-symbols-outlined text-4xl">check_circle</span>
                  </div>
                  <h1 className="text-2xl font-bold mb-2">Pickup Complete</h1>
                  <p className="text-slate-400 mb-8 text-sm">
                      Have a wonderful evening!
                  </p>
                  <button 
                      onClick={() => logout()}
                      className="w-full py-4 rounded-2xl bg-slate-800 text-white font-bold active:scale-95 transition-transform"
                  >
                      Close App
                  </button>
              </div>
          </div>
      )
  }

  // --- MAIN LOGGED IN LAYOUT ---
  return (
    <div className="flex h-[100dvh] w-full flex-col bg-primary text-text-light font-display overflow-hidden">
      
      {/* HEADER (Common) */}
      <div className="shrink-0 flex items-center justify-between p-4 pt-safe-top bg-primary/90 backdrop-blur-md z-20 border-b border-white/5">
           <div className="flex items-center gap-3">
                <img src={currentUser.avatarUrl} className="w-10 h-10 rounded-full bg-slate-700 object-cover ring-2 ring-surface-dark" />
                <div>
                    <h2 className="font-bold text-sm leading-tight">{currentUser.name}</h2>
                    <p className="text-[10px] text-text-muted">ID: {currentUser.studentId}</p>
                </div>
           </div>
           <div className="px-3 py-1 rounded-full bg-surface-dark border border-white/5 flex items-center gap-2">
               <span className="material-symbols-outlined text-xs text-text-muted">schedule</span>
               <span className="text-xs font-mono font-bold">{String(timeLeft.h).padStart(2,'0')}:{String(timeLeft.m).padStart(2,'0')}</span>
           </div>
      </div>

      {/* CONTENT AREA (Scrollable) */}
      <div className="flex-1 overflow-y-auto relative overscroll-none">
        
        {/* --- HOME TAB --- */}
        {activeTab === 'home' && (
            <div className="p-5 flex flex-col gap-6 min-h-full pb-24 animate-in slide-in-from-right-8 duration-300">
                
                {/* Workshop Card (Compact) */}
                <div className="rounded-2xl bg-surface-dark overflow-hidden shadow-lg border border-white/5 shrink-0 relative group">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
                    <div className="h-32 bg-cover bg-center" style={{ backgroundImage: `url("${currentSession.imageUrl}")` }} />
                    <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
                        <p className="text-[10px] font-bold text-accent uppercase tracking-wider mb-0.5">Ongoing Session</p>
                        <h3 className="text-lg font-bold text-white leading-none">{currentSession.title}</h3>
                    </div>
                </div>

                {/* Action Area */}
                <div className="flex-1 flex flex-col justify-end gap-4">
                    {status === 'released' ? (
                         <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-3xl text-center animate-pulse">
                             <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
                                 <span className="material-symbols-outlined text-3xl text-white">child_care</span>
                             </div>
                             <h2 className="text-2xl font-bold text-white mb-2">Student Released</h2>
                             <p className="text-emerald-200/70 text-sm mb-6">Instructor has sent them out.</p>
                             
                             <button
                                onClick={() => handleStatusUpdate('completed')}
                                className="w-full py-5 rounded-2xl font-bold text-lg bg-emerald-500 text-white shadow-xl shadow-emerald-500/20 active:scale-95 transition-transform flex items-center justify-center gap-2"
                             >
                                <span className="material-symbols-outlined">check_circle</span>
                                Confirm Pickup
                             </button>
                         </div>
                    ) : (
                        <div className="grid gap-4">
                            <button
                                onClick={() => handleStatusUpdate('on_way')}
                                disabled={status === 'on_way' || status === 'arrived'}
                                className={`
                                h-20 w-full rounded-2xl font-bold text-left px-6 relative overflow-hidden transition-all active:scale-[0.98] flex items-center gap-4
                                ${status === 'on_way' || status === 'arrived'
                                    ? 'bg-warning text-slate-900 shadow-[0_0_20px_rgba(245,158,11,0.2)] ring-1 ring-warning'
                                    : 'bg-surface-dark text-slate-400 border border-white/5 hover:bg-white/5'}
                                `}
                            >
                                <span className="material-symbols-outlined text-3xl">local_taxi</span>
                                <div>
                                    <span className="block text-sm uppercase tracking-wider opacity-70">Step 1</span>
                                    <span className="text-lg">{status === 'on_way' ? "Status: On My Way" : "I'm leaving now"}</span>
                                </div>
                                {(status === 'on_way' || status === 'arrived') && <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 opacity-20 text-6xl">check</span>}
                            </button>

                            <button
                                onClick={() => handleStatusUpdate('arrived')}
                                disabled={status === 'arrived'}
                                className={`
                                h-24 w-full rounded-2xl font-bold text-left px-6 relative overflow-hidden transition-all active:scale-[0.98] flex items-center gap-4
                                ${status === 'arrived'
                                    ? 'bg-accent text-slate-900 shadow-[0_0_30px_rgba(16,185,129,0.3)] ring-1 ring-accent'
                                    : status === 'on_way' 
                                        ? 'bg-surface-dark text-white border-2 border-accent shadow-lg'
                                        : 'bg-surface-dark text-slate-600 border border-white/5 opacity-50'}
                                `}
                            >
                                <span className="material-symbols-outlined text-3xl">location_on</span>
                                <div>
                                    <span className="block text-sm uppercase tracking-wider opacity-70">Step 2</span>
                                    <span className="text-xl">{status === 'arrived' ? "Status: Arrived" : "I'm here"}</span>
                                </div>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* --- CHAT TAB --- */}
        {activeTab === 'chat' && (
            <div className="flex flex-col h-full animate-in slide-in-from-right-8 duration-300">
                 <div 
                    ref={chatContainerRef}
                    className="flex-1 overflow-y-auto p-4 pb-24 flex flex-col gap-4"
                 >
                    {chatHistory.length === 0 && (
                        <div className="mt-20 text-center opacity-30">
                            <span className="material-symbols-outlined text-4xl mb-2">chat</span>
                            <p className="text-sm">Send a message to your child.</p>
                        </div>
                    )}
                    {chatHistory.map((msg) => {
                        const isMe = msg.sender === 'parent';
                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                    isMe 
                                    ? 'bg-blue-600 text-white rounded-br-sm' 
                                    : 'bg-surface-dark text-white rounded-bl-sm border border-white/10'
                                }`}>
                                    {msg.text}
                                </div>
                            </div>
                        );
                    })}
                 </div>
                 
                 {/* Input is fixed in the layout via flex, but visually distinct */}
                 <div className="absolute bottom-20 left-0 right-0 p-3 bg-gradient-to-t from-primary via-primary to-transparent z-10">
                     <div className="flex gap-2">
                         <input 
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            className="flex-1 bg-surface-dark border border-white/10 rounded-full px-5 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-lg"
                            placeholder="Type a message..."
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                         />
                         <button 
                            onClick={handleSendMessage}
                            disabled={!messageInput.trim()}
                            className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 transition-colors shadow-lg ${messageInput.trim() ? 'bg-blue-600 text-white' : 'bg-surface-dark text-slate-600'}`}
                         >
                             <span className="material-symbols-outlined">send</span>
                         </button>
                     </div>
                 </div>
            </div>
        )}

        {/* --- PROFILE TAB --- */}
        {activeTab === 'profile' && (
            <div className="p-6 animate-in slide-in-from-right-8 duration-300">
                <h2 className="text-xl font-bold mb-6">Settings</h2>
                <div className="bg-surface-dark rounded-2xl border border-white/5 overflow-hidden">
                    <div className="p-4 flex items-center gap-4 border-b border-white/5">
                        <div className="h-12 w-12 rounded-full bg-slate-700 flex items-center justify-center">
                            <span className="material-symbols-outlined">person</span>
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold">{currentUser.name}</h3>
                            <p className="text-xs text-text-muted">Parent Account</p>
                        </div>
                    </div>
                    <button onClick={() => logout()} className="w-full p-4 text-left text-red-400 hover:bg-white/5 transition-colors flex items-center gap-3">
                        <span className="material-symbols-outlined">logout</span>
                        Logout
                    </button>
                </div>
                
                <div className="mt-6 text-center">
                    <p className="text-xs text-slate-600">MakerLab Connect v1.1</p>
                </div>
            </div>
        )}

      </div>

      {/* BOTTOM NAVIGATION BAR (Fixed) */}
      <div className="shrink-0 h-20 bg-surface-dark/90 backdrop-blur-xl border-t border-white/5 flex justify-around items-center pb-safe-bottom z-30 shadow-2xl">
           <button 
             onClick={() => setActiveTab('home')}
             className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === 'home' ? 'text-white' : 'text-slate-500'}`}
           >
               <span className={`material-symbols-outlined text-2xl transition-transform ${activeTab === 'home' ? 'scale-110 fill-current' : ''}`}>dashboard</span>
               <span className="text-[10px] font-bold">Dashboard</span>
           </button>

           <button 
             onClick={() => setActiveTab('chat')}
             className={`flex flex-col items-center gap-1 p-2 transition-colors relative ${activeTab === 'chat' ? 'text-white' : 'text-slate-500'}`}
           >
               <div className="relative">
                   <span className={`material-symbols-outlined text-2xl transition-transform ${activeTab === 'chat' ? 'scale-110' : ''}`}>chat_bubble</span>
                   {chatHistory.length > 0 && chatHistory[chatHistory.length-1].sender === 'student' && (
                       <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-surface-dark"></span>
                   )}
               </div>
               <span className="text-[10px] font-bold">Chat</span>
           </button>

           <button 
             onClick={() => setActiveTab('profile')}
             className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === 'profile' ? 'text-white' : 'text-slate-500'}`}
           >
               <span className={`material-symbols-outlined text-2xl transition-transform ${activeTab === 'profile' ? 'scale-110' : ''}`}>person</span>
               <span className="text-[10px] font-bold">Profile</span>
           </button>
      </div>

    </div>
  );
};