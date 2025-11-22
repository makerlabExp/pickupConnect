
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useAppStore } from '../store/mockStore';
import { generateAudioAnnouncement } from '../services/geminiService';
import { playGeminiAudio } from '../services/ttsService';
import { playSound } from '../services/soundService';
import { PickupRequest } from '../types';
import { useNavigate } from 'react-router-dom';

export const InstructorView: React.FC = () => {
  const { pickupQueue, students, parents, markAsAnnounced, setAudioAnnouncement, isMuted, toggleMute, updatePickupStatus } = useAppStore();
  const [filterClassroom, setFilterClassroom] = useState<string>('ALL');
  const navigate = useNavigate();
  const processingRef = useRef<Set<string>>(new Set());

  const activeRequests = useMemo(() => pickupQueue
    .filter(r => r.status !== 'scheduled' && r.status !== 'completed')
    .filter(r => {
        if (filterClassroom === 'ALL') return true;
        const student = students.find(s => s.id === r.studentId);
        return student?.classroom === filterClassroom;
    })
    .sort((a, b) => {
        if (a.status === 'released' && b.status !== 'released') return 1;
        if (a.status !== 'released' && b.status === 'released') return -1;
        return b.timestamp - a.timestamp;
    }), [pickupQueue, students, filterClassroom]);

  const playAndCacheAudio = async (req: PickupRequest) => {
      try {
        let audioBase64: string | null | undefined = req.audioBase64;
        if (!audioBase64) {
            const student = students.find(s => s.id === req.studentId);
            const parent = parents.find(p => p.id === req.parentId);
            if (!student || !parent) return;
            audioBase64 = await generateAudioAnnouncement(student.name, parent.name, student.classroom);
            if (audioBase64) setAudioAnnouncement(req.id, audioBase64);
        }
        if (audioBase64 && !isMuted) await playGeminiAudio(audioBase64);
        markAsAnnounced(req.id);
      } catch (err) { console.error(err); }
  };

  useEffect(() => {
    const checkAndAnnounce = async () => {
      for (const req of activeRequests) {
        if (req.status === 'arrived' && !req.hasAnnounced && !processingRef.current.has(req.id)) {
          processingRef.current.add(req.id);
          playSound.notification();
          await new Promise(r => setTimeout(r, 500));
          await playAndCacheAudio(req);
          processingRef.current.delete(req.id);
        }
      }
    };
    checkAndAnnounce();
  }, [activeRequests, isMuted]);

  const handleReleaseStudent = (req: PickupRequest) => {
      playSound.click();
      updatePickupStatus(req.studentId, 'released');
  };

  const tabs = [
      { id: 'ALL', label: 'All' },
      { id: 'Salle 1', label: 'Salle 1' },
      { id: 'Salle 2', label: 'Salle 2' },
      { id: 'Salle DIY', label: 'DIY' },
  ];

  return (
    <div className="flex h-[100dvh] w-full flex-col bg-primary text-text-light font-display overflow-hidden">
      {/* Fixed Header */}
      <div className="shrink-0 bg-surface-dark border-b border-white/5 p-4 shadow-md z-20">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-lg font-bold text-white">Instructor</h1>
            <div className="flex items-center gap-2">
                <button onClick={() => { toggleMute(); playSound.click(); }} className={`p-2 rounded-full ${isMuted ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-white'}`}>
                    <span className="material-symbols-outlined text-xl">{isMuted ? 'volume_off' : 'volume_up'}</span>
                </button>
                <button onClick={() => navigate('/')} className="p-2 rounded-full bg-slate-700 text-white">
                    <span className="material-symbols-outlined text-xl">logout</span>
                </button>
            </div>
          </div>
          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setFilterClassroom(tab.id)}
                    className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${filterClassroom === tab.id ? 'bg-white text-primary' : 'bg-slate-800 text-slate-400'}`}
                  >
                      {tab.label}
                  </button>
              ))}
          </div>
      </div>

      {/* Scrollable Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {activeRequests.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center h-64 opacity-30">
                    <span className="material-symbols-outlined text-5xl mb-2">check_circle</span>
                    <p>All clear for {filterClassroom === 'ALL' ? 'all rooms' : filterClassroom}</p>
                </div>
            )}
            {activeRequests.map(req => {
                const student = students.find(s => s.id === req.studentId);
                if(!student) return null;
                const isArrived = req.status === 'arrived';
                const isReleased = req.status === 'released';

                return (
                    <div key={req.id} className={`relative rounded-xl p-4 transition-all ${isArrived ? 'bg-slate-800 ring-2 ring-accent' : isReleased ? 'bg-blue-900/20 border border-blue-500/30' : 'bg-slate-800 border border-white/5'}`}>
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                                <img src={student.avatarUrl} className="w-10 h-10 rounded-full bg-black/20"/>
                                <div>
                                    <h3 className="font-bold text-white text-base leading-tight">{student.name}</h3>
                                    <span className="text-[10px] uppercase text-slate-400">{student.classroom}</span>
                                </div>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-1 rounded ${isArrived ? 'bg-accent text-primary' : isReleased ? 'bg-blue-500 text-white' : 'bg-warning text-primary'}`}>
                                {isArrived ? 'HERE' : isReleased ? 'OUT' : 'WAY'}
                            </span>
                        </div>

                        <div className="flex gap-2">
                            {isArrived && (
                                <>
                                    <button onClick={() => handleReleaseStudent(req)} className="flex-1 h-10 rounded-lg bg-accent text-primary font-bold text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform">
                                        RELEASE <span className="material-symbols-outlined text-sm">logout</span>
                                    </button>
                                    <button 
                                        onClick={() => playAndCacheAudio(req)} 
                                        className="h-10 w-10 rounded-lg bg-slate-700 text-white flex items-center justify-center active:scale-95"
                                    >
                                        <span className="material-symbols-outlined text-lg">volume_up</span>
                                    </button>
                                </>
                            )}
                            {isReleased && (
                                <button onClick={() => updatePickupStatus(req.studentId, 'completed')} className="w-full h-10 bg-slate-700 text-slate-300 text-xs font-bold rounded-lg hover:bg-slate-600">
                                    Force Complete
                                </button>
                            )}
                             {!isArrived && !isReleased && (
                                <div className="w-full h-10 flex items-center justify-center text-xs text-slate-500 italic bg-black/20 rounded-lg">Waiting arrival...</div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
};
