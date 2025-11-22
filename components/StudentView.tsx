
import React, { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store/mockStore';
import { playSound } from '../services/soundService';

export const StudentView: React.FC = () => {
  const { pickupQueue, students, activeStudentId, sendMessage } = useAppStore();
  const [inputMessage, setInputMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const me = students.find(s => s.id === activeStudentId);
  const myRequest = pickupQueue.find(p => p.studentId === activeStudentId);
  const status = myRequest?.status || 'scheduled';
  const chatHistory = myRequest?.chatHistory || [];

  // Track status to trigger sound on change
  const prevStatusRef = useRef(status);
  useEffect(() => {
    if (prevStatusRef.current !== status) {
      if (status === 'on_way' || status === 'arrived' || status === 'released') {
        playSound.notification();
      }
      prevStatusRef.current = status;
    }
  }, [status]);

  // Track messages to trigger sound
  const prevMsgCount = useRef(chatHistory.length);
  useEffect(() => {
    if (chatHistory.length > prevMsgCount.current) {
        const lastMsg = chatHistory[chatHistory.length - 1];
        if (lastMsg.sender === 'parent') {
            playSound.notification();
        }
        // Scroll to bottom
        setTimeout(() => {
            if (chatEndRef.current) {
                chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
            }
        }, 100);
    }
    prevMsgCount.current = chatHistory.length;
  }, [chatHistory.length]);

  useEffect(() => {
      if (chatEndRef.current) {
          chatEndRef.current.scrollIntoView();
      }
  }, []);

  if (!me) return <div>Error loading profile</div>;

  const handleSend = () => {
      if (inputMessage.trim()) {
          playSound.click();
          sendMessage(me.id, inputMessage, 'student');
          setInputMessage('');
      }
  };

  // Visual configurations based on status
  const statusConfig = {
    scheduled: {
      icon: 'pending',
      color: 'text-text-muted',
      bg: 'bg-surface-dark',
      border: 'border-white/10',
      title: 'Workshop in Progress',
      sub: 'Waiting for pickup...'
    },
    on_way: {
      icon: 'directions_car',
      color: 'text-white',
      bg: 'bg-gradient-to-r from-amber-500 to-orange-600',
      border: 'border-orange-400/50',
      title: 'Parent is on the way',
      sub: 'Get ready to leave'
    },
    arrived: {
      icon: 'sentiment_satisfied',
      color: 'text-white',
      bg: 'bg-gradient-to-r from-emerald-500 to-teal-600',
      border: 'border-emerald-400/50',
      title: 'Parent is Here!',
      sub: 'Go to the pickup point'
    },
    released: {
      icon: 'door_open',
      color: 'text-white',
      bg: 'bg-gradient-to-r from-blue-500 to-indigo-600',
      border: 'border-blue-400/50',
      title: 'You can leave now!',
      sub: 'Go meet your parent outside'
    },
    completed: {
        icon: 'check_circle',
        color: 'text-text-muted',
        bg: 'bg-surface-dark',
        border: 'border-white/10',
        title: 'Pickup Complete',
        sub: 'See you next time!'
      }
  };

  const currentConfig = statusConfig[status] || statusConfig.scheduled;

  return (
    <div className="relative flex h-[100dvh] w-full flex-col bg-primary font-display overflow-hidden text-text-light">
      
      {/* Fixed Header Area: Contains Nav and Status Card. Does NOT scroll. */}
      <div className="shrink-0 z-30 bg-primary border-b border-white/5 shadow-lg relative">
          {/* Top Bar */}
          <header className="flex items-center p-4 pb-2 justify-center">
            <div className="text-center">
                 <h1 className="text-base font-bold">Hi, {me.name}</h1>
                 <p className="text-[10px] text-text-muted tracking-wider uppercase">Student ID: {me.accessCode}</p>
            </div>
          </header>

          {/* Status Notification - Fixed */}
          <div className="px-4 pb-4">
                 <div className={`relative overflow-hidden flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-500 shadow-lg border ${currentConfig.bg} ${currentConfig.border} ${currentConfig.color}`}>
                     {/* Background Pattern */}
                     <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none" />
                     
                     <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur-md shadow-inner`}>
                         <span className={`material-symbols-outlined text-2xl ${status === 'scheduled' ? 'animate-pulse' : ''}`}>
                            {currentConfig.icon}
                         </span>
                     </div>
                     
                     <div className="flex-1 min-w-0 relative z-10">
                         <h2 className="font-bold leading-tight text-lg truncate">{currentConfig.title}</h2>
                         <p className="text-xs font-medium opacity-90 truncate">{currentConfig.sub}</p>
                     </div>
                 </div>
          </div>
      </div>

      {/* Chat Area - This takes up remaining space and scrolls independently */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 scroll-smooth overscroll-contain">
             <div className="mt-auto" /> {/* Push messages to bottom if few */}
             
             <div className="text-center py-4 opacity-30">
                 <p className="text-[10px] text-text-muted uppercase tracking-[0.2em]">Today</p>
             </div>

             {chatHistory.length === 0 && (
                   <div className="text-center text-text-muted text-sm italic py-10 opacity-50">
                       No messages yet.<br/>Type below to start.
                   </div>
             )}

             {chatHistory.map((msg) => {
                   const isMe = msg.sender === 'student';
                   return (
                       <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                           {!isMe && (
                               <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mr-2 shrink-0 self-end mb-1 ring-2 ring-primary shadow-lg">
                                   <span className="material-symbols-outlined text-[10px] text-white">family_restroom</span>
                               </div>
                           )}
                           <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-[15px] leading-relaxed shadow-sm ${
                               isMe 
                               ? 'bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-900/20' 
                               : 'bg-surface-dark border border-white/10 text-white rounded-bl-none'
                           }`}>
                               {msg.text}
                           </div>
                       </div>
                   );
             })}
             <div ref={chatEndRef} className="h-2" />
      </div>

      {/* Input Area - Modern Floating Pill Style - Fixed at bottom */}
      <div className="shrink-0 p-3 pb-[max(1rem,env(safe-area-inset-bottom))] bg-primary/80 backdrop-blur-xl border-t border-white/5 z-30">
            <div className="flex items-end gap-2 max-w-screen-lg mx-auto">
                <div className="flex-1 bg-surface-dark rounded-[1.5rem] ring-1 ring-white/10 focus-within:ring-accent/50 focus-within:ring-2 transition-all flex items-center shadow-inner">
                    <input 
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Message..."
                        className="w-full bg-transparent border-none px-5 py-3.5 text-white placeholder:text-slate-500 focus:ring-0 text-[16px]"
                    />
                </div>
                <button 
                    onClick={handleSend}
                    disabled={!inputMessage.trim()}
                    className={`
                      h-[52px] w-[52px] shrink-0 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg
                      ${inputMessage.trim() 
                        ? 'bg-indigo-500 text-white hover:scale-105 hover:bg-indigo-400 shadow-indigo-500/25' 
                        : 'bg-surface-dark text-slate-600 cursor-not-allowed ring-1 ring-white/5'}
                    `}
                >
                    <span className="material-symbols-outlined text-xl">send</span>
                </button>
            </div>
      </div>

    </div>
  );
};