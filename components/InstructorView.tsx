
import React, { useEffect, useState, useRef } from 'react';
import { useAppStore } from '../store/mockStore';
import { generateAudioAnnouncement } from '../services/geminiService';
import { playGeminiAudio, initAudioContext } from '../services/ttsService';
import { playSound } from '../services/soundService';
import { PickupRequest } from '../types';
import { useNavigate } from 'react-router-dom';

export const InstructorView: React.FC = () => {
  const { pickupQueue, students, parents, markAsAnnounced, setAudioAnnouncement, isMuted, toggleMute } = useAppStore();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filterClassroom, setFilterClassroom] = useState<string>('ALL');
  const navigate = useNavigate();
  
  const processingRef = useRef<Set<string>>(new Set());

  // Filter logic
  const activeRequests = pickupQueue
    .filter(r => r.status !== 'scheduled' && r.status !== 'dismissed')
    .filter(r => {
        if (filterClassroom === 'ALL') return true;
        const student = students.find(s => s.id === r.studentId);
        return student?.classroom === filterClassroom;
    })
    .sort((a, b) => b.timestamp - a.timestamp);

  
  const playAndCacheAudio = async (req: PickupRequest) => {
      try {
        // Allow audioBase64 to be null if generation fails, consistent with generateAudioAnnouncement return type
        let audioBase64: string | null | undefined = req.audioBase64;

        // If no audio cached, generate it
        if (!audioBase64) {
            const student = students.find(s => s.id === req.studentId);
            const parent = parents.find(p => p.id === req.parentId);
            if (!student || !parent) return;

            audioBase64 = await generateAudioAnnouncement(student.name, parent.name, student.classroom);
            if (audioBase64) {
                // Save to store/DB immediately
                setAudioAnnouncement(req.id, audioBase64);
            }
        }

        // If we have audio (either cached or just generated), play it
        if (audioBase64 && !isMuted) {
            await playGeminiAudio(audioBase64);
        }
        
        // Mark as announced regardless of mute state to prevent loops
        markAsAnnounced(req.id);

      } catch (err) {
          console.error("Announcement error:", err);
      }
  };


  // AUTOMATIC ANNOUNCEMENT LOGIC
  useEffect(() => {
    const checkAndAnnounce = async () => {
      for (const req of activeRequests) {
        if (req.status === 'arrived' && !req.hasAnnounced && !processingRef.current.has(req.id)) {
          processingRef.current.add(req.id);
          setProcessingId(req.id);
          playSound.notification();

          // Small delay to let notification sound play
          await new Promise(r => setTimeout(r, 500));
          
          await playAndCacheAudio(req);

          setProcessingId(null);
          processingRef.current.delete(req.id);
        }
      }
    };
    checkAndAnnounce();
  }, [activeRequests, students, parents, markAsAnnounced, setAudioAnnouncement, isMuted]);

  // Manual trigger
  const handleManualAnnounce = async (req: PickupRequest) => {
    if (processingRef.current.has(req.id)) return;
    try {
        setProcessingId(req.id);
        playSound.click();
        await initAudioContext(); 
        await playAndCacheAudio(req);
    } catch (e) { 
        console.error(e); 
    } finally { 
        setProcessingId(null); 
    }
  };

  const tabs = [
      { id: 'ALL', label: 'All Rooms' },
      { id: 'Salle 1', label: 'Salle 1' },
      { id: 'Salle 2', label: 'Salle 2' },
      { id: 'Salle DIY', label: 'Salle DIY' },
  ];

  return (
    <div className="min-h-screen bg-primary text-text-light font-display p-6 flex flex-col">
      <header className="flex justify-between items-center mb-6">
        <div>
           <h1 className="text-2xl font-bold text-white">Instructor Dashboard</h1>
           <p className="text-text-muted">Live Pickup Feed</p>
        </div>
        <div className="flex items-center gap-3">
            <button 
                onClick={() => { toggleMute(); playSound.click(); }}
                className={`p-2 rounded-full transition-colors ${isMuted ? 'bg-red-500/20 text-red-400' : 'bg-surface-dark text-white hover:bg-white/10'}`}
                title={isMuted ? "Unmute Sound" : "Mute Sound"}
            >
                <span className="material-symbols-outlined">{isMuted ? 'volume_off' : 'volume_up'}</span>
            </button>
            <button 
                onClick={() => navigate('/')}
                className="px-4 py-2 rounded-lg bg-surface-dark hover:bg-white/10 text-sm font-medium transition-colors"
            >
                Logout
            </button>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-2 scrollbar-hide">
          {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setFilterClassroom(tab.id); playSound.click(); }}
                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                    filterClassroom === tab.id 
                    ? 'bg-white text-primary' 
                    : 'bg-surface-dark text-text-muted hover:bg-white/5'
                }`}
              >
                  {tab.label}
              </button>
          ))}
      </div>

      <main className="flex-1">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {activeRequests.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center h-64 bg-surface-dark/30 rounded-2xl border-2 border-dashed border-slate-700">
                    <span className="material-symbols-outlined text-4xl text-slate-600 mb-2">emoji_food_beverage</span>
                    <p className="text-text-muted">No active pickups for {filterClassroom === 'ALL' ? 'any room' : filterClassroom}.</p>
                </div>
            ) : (
                activeRequests.map(req => {
                    const student = students.find(s => s.id === req.studentId);
                    const parent = parents.find(p => p.id === req.parentId);
                    if(!student || !parent) return null;

                    const isArrived = req.status === 'arrived';
                    const isAnnouncing = processingId === req.id;

                    return (
                        <div key={req.id} className={`relative overflow-hidden rounded-2xl p-5 transition-all duration-500 ${isArrived ? 'bg-surface-dark ring-2 ring-accent shadow-[0_0_30px_rgba(16,185,129,0.15)]' : 'bg-surface-dark ring-1 ring-white/10'}`}>
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <img src={student.avatarUrl} alt={student.name} className="w-12 h-12 rounded-full bg-slate-700 object-cover ring-2 ring-white/10"/>
                                    <div>
                                        <h3 className="font-bold text-white text-lg">{student.name}</h3>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-white/5 px-2 py-0.5 rounded">
                                            {student.classroom}
                                        </span>
                                    </div>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${isArrived ? 'bg-accent text-primary' : 'bg-warning text-primary'}`}>
                                    {isArrived ? 'Arrived' : 'On Way'}
                                </div>
                            </div>

                            {isArrived && (
                                <div className="bg-black/20 rounded-xl p-3 mb-4 flex items-center gap-3">
                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${req.hasAnnounced ? 'bg-green-500/20 text-green-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                                        <span className="material-symbols-outlined text-lg">
                                            {req.hasAnnounced ? 'check' : 'smart_toy'}
                                        </span>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-white uppercase tracking-wider">AI Announcer</p>
                                        <p className="text-xs text-slate-400 truncate">
                                            {isAnnouncing ? 'Generating...' : (req.hasAnnounced ? 'Broadcast sent' : 'Queued...')}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-2">
                                {isArrived && (
                                    <button 
                                        onClick={() => handleManualAnnounce(req)}
                                        disabled={isAnnouncing}
                                        className={`flex-1 h-10 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${isAnnouncing ? 'bg-white/5 text-white/50' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                                    >
                                        <span className="material-symbols-outlined text-lg">{isAnnouncing ? 'progress_activity' : 'campaign'}</span>
                                        {req.audioBase64 ? 'Replay' : 'Call'}
                                    </button>
                                )}
                                <button className="h-10 w-10 rounded-lg border border-white/10 flex items-center justify-center text-text-muted hover:text-white hover:bg-white/5">
                                    <span className="material-symbols-outlined">check</span>
                                </button>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
      </main>
    </div>
  );
};