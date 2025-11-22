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

  // Track messages
  const prevMsgCount = useRef(chatHistory.length);
  useEffect(() => {
    if (chatHistory.length > prevMsgCount.current) {
        const lastMsg = chatHistory[chatHistory.length - 1];
        if (lastMsg.sender === 'parent') playSound.notification();
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
    prevMsgCount.current = chatHistory.length;
  }, [chatHistory.length]);

  if (!me) return <div>Error loading profile</div>;

  const handleSend = () => {
      if (inputMessage.trim()) {
          playSound.click();
          sendMessage(me.id, inputMessage, 'student');
          setInputMessage('');
      }
  };

  const statusConfig = {
    scheduled: { icon: 'pending', color: 'text-slate-400', bg: 'bg-surface-dark', border: 'border-white/10', title: 'Workshop', sub: 'Waiting...' },
    on_way: { icon: 'directions_car', color: 'text-white', bg: 'bg-gradient-to-r from-amber-500 to-orange-600', border: 'border-orange-400/50', title: 'Parent En Route', sub: 'Get ready' },
    arrived: { icon: 'sentiment_satisfied', color: 'text-white', bg: 'bg-gradient-to-r from-emerald-500 to-teal-600', border: 'border-emerald-400/50', title: 'Parent Here!', sub: 'Go to pickup' },
    released: { icon: 'door_open', color: 'text-white', bg: 'bg-gradient-to-r from-blue-500 to-indigo-600', border: 'border-blue-400/50', title: 'Leave Class', sub: 'Meet parent' },
    completed: { icon: 'check_circle', color: 'text-slate-500', bg: 'bg-surface-dark', border: 'border-white/10', title: 'Done', sub: 'Bye!' }
  };

  const currentConfig = statusConfig[status] || statusConfig.scheduled;

  return (
    <div className="flex h-[100dvh] w-full flex-col bg-primary font-display overflow-hidden text-text-light">
      
      {/* Header & Status Card */}
      <div className="shrink-0 z-10 bg-primary border-b border-white/5 shadow-lg pb-4 px-4 pt-4">
          <div className="flex justify-between items-center mb-4 px-2">
              <div>
                 <h1 className="text-sm font-bold">{me.name}</h1>
                 <p className="text-[10px] text-text-muted tracking-widest font-mono">{me.accessCode}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-surface-dark flex items-center justify-center border border-white/10">
                  <span className="material-symbols-outlined text-sm text-slate-400">person</span>
              </div>
          </div>

          <div className={`relative overflow-hidden flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-500 shadow-lg border ${currentConfig.bg} ${currentConfig.border} ${currentConfig.color}`}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_white_0%,_transparent_70%)] opacity-10 pointer-events-none" />
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur-md shadow-sm`}>
                    <span className={`material-symbols-outlined text-xl ${status === 'scheduled' ? 'animate-pulse' : ''}`}>{currentConfig.icon}</span>
                </div>
                <div className="flex-1 min-w-0 relative z-10">
                    <h2 className="font-bold leading-none text-base">{currentConfig.title}</h2>
                    <p className="text-[10px] font-medium opacity-90 mt-0.5 uppercase tracking-wide">{currentConfig.sub}</p>
                </div>
          </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-2 overscroll-none">
             <div className="mt-auto" /> 
             {chatHistory.length === 0 && (
                   <div className="text-center text-text-muted text-xs italic py-10 opacity-40">No messages yet.</div>
             )}
             {chatHistory.map((msg) => {
                   const isMe = msg.sender === 'student';
                   return (
                       <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-200`}>
                           <div className={`max-w-[85%] px-4 py-2 rounded-2xl text-[14px] leading-snug shadow-sm ${
                               isMe ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-surface-dark border border-white/10 text-white rounded-bl-sm'
                           }`}>
                               {msg.text}
                           </div>
                       </div>
                   );
             })}
             <div ref={chatEndRef} className="h-1" />
      </div>

      {/* Input Area */}
      <div className="shrink-0 p-3 pb-safe-bottom bg-surface-dark/80 backdrop-blur-lg border-t border-white/5">
            <div className="flex gap-2 max-w-md mx-auto">
                <input 
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Message..."
                    className="flex-1 bg-black/20 border border-white/10 rounded-full px-5 py-3 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm placeholder:text-slate-500"
                />
                <button 
                    onClick={handleSend}
                    disabled={!inputMessage.trim()}
                    className={`h-[46px] w-[46px] shrink-0 rounded-full flex items-center justify-center transition-transform active:scale-90 shadow-lg ${inputMessage.trim() ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-500'}`}
                >
                    <span className="material-symbols-outlined text-xl">send</span>
                </button>
            </div>
      </div>
    </div>
  );
};