
import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/mockStore';
import { playSound } from '../services/soundService';
import { Classroom } from '../types';

export const AdminView: React.FC = () => {
  const { students, parents, sessions, addStudent, addSession, activateSession, resetSystem, seedDatabase, setRole, geminiApiKey, updateGeminiApiKey } = useAppStore();
  
  const [activeTab, setActiveTab] = useState<'students' | 'workshops' | 'settings'>('students');

  // Student Form
  const [studentName, setStudentName] = useState('');
  const [parentName, setParentName] = useState('');
  const [classroom, setClassroom] = useState<string>('Salle 1');

  // Session Form
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionDesc, setSessionDesc] = useState('');

  // Settings Form
  const [apiKeyInput, setApiKeyInput] = useState(geminiApiKey);

  useEffect(() => {
      setApiKeyInput(geminiApiKey);
  }, [geminiApiKey]);

  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (studentName.trim() && parentName.trim()) {
      addStudent(studentName, parentName, classroom);
      playSound.success();
      setStudentName('');
      setParentName('');
    }
  };

  const handleSessionSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (sessionTitle.trim()) {
          addSession(sessionTitle, sessionDesc, "https://source.unsplash.com/random/800x600/?technology,robot");
          playSound.success();
          setSessionTitle('');
          setSessionDesc('');
      }
  };

  const handleSettingsSave = () => {
      updateGeminiApiKey(apiKeyInput.trim());
      playSound.success();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-text-light font-display p-6">
      <header className="flex justify-between items-center mb-8 pb-6 border-b border-white/10">
        <div className="flex items-center gap-4">
           <button onClick={() => setRole(null)} className="hover:text-white text-slate-400 transition-colors">
             <span className="material-symbols-outlined">arrow_back</span>
           </button>
           <div>
             <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
             <p className="text-text-muted">Academy Management System</p>
           </div>
        </div>
        
        <div className="flex gap-3">
            <button 
                onClick={seedDatabase}
                className="px-4 py-2 rounded-lg border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 text-sm font-medium transition-colors flex items-center gap-2"
            >
                <span className="material-symbols-outlined text-lg">database</span>
                Seed Data
            </button>
            <button 
                onClick={() => {
                    if(window.confirm("This will delete EVERYTHING. Continue?")) {
                        resetSystem();
                    }
                }}
                className="px-4 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm font-medium transition-colors flex items-center gap-2"
            >
                <span className="material-symbols-outlined text-lg">delete_forever</span>
                Reset
            </button>
        </div>
      </header>

      {/* Tab Bar */}
      <div className="flex gap-2 mb-6">
          <button 
            onClick={() => setActiveTab('students')}
            className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${activeTab === 'students' ? 'bg-accent text-primary' : 'bg-surface-dark text-text-muted hover:bg-white/5'}`}
          >
              <span className="material-symbols-outlined">group_add</span>
              Student Management
          </button>
          <button 
            onClick={() => setActiveTab('workshops')}
            className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${activeTab === 'workshops' ? 'bg-indigo-500 text-white' : 'bg-surface-dark text-text-muted hover:bg-white/5'}`}
          >
              <span className="material-symbols-outlined">theater_comedy</span>
              Workshop Themes
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${activeTab === 'settings' ? 'bg-slate-700 text-white' : 'bg-surface-dark text-text-muted hover:bg-white/5'}`}
          >
              <span className="material-symbols-outlined">settings</span>
              Settings
          </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* LEFT PANEL (FORMS) */}
        <div className="lg:col-span-1">
            {activeTab === 'students' && (
                <div className="bg-slate-800 rounded-2xl p-6 border border-white/5 shadow-xl sticky top-6">
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-accent">person_add</span>
                        Add New Family
                    </h2>
                    
                    <form onSubmit={handleStudentSubmit} className="flex flex-col gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Student Name</label>
                            <input 
                                type="text"
                                value={studentName}
                                onChange={e => setStudentName(e.target.value)}
                                placeholder="e.g. Alex"
                                className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-accent focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Classroom Space</label>
                            <select 
                                value={classroom}
                                onChange={e => setClassroom(e.target.value)}
                                className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-accent focus:outline-none appearance-none"
                            >
                                <option value="Salle 1">Salle 1 (Standard)</option>
                                <option value="Salle 2">Salle 2 (Advanced)</option>
                                <option value="Salle DIY">Salle DIY (Creative)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Parent Name</label>
                            <input 
                                type="text"
                                value={parentName}
                                onChange={e => setParentName(e.target.value)}
                                placeholder="e.g. John"
                                className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-accent focus:outline-none"
                            />
                        </div>
                        
                        <button 
                            type="submit"
                            disabled={!studentName || !parentName}
                            className="mt-2 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all bg-accent text-primary hover:bg-accent/90"
                        >
                            <span className="material-symbols-outlined">magic_button</span>
                            Generate Accounts
                        </button>
                    </form>
                </div>
            )}
            
            {activeTab === 'workshops' && (
                <div className="bg-slate-800 rounded-2xl p-6 border border-white/5 shadow-xl sticky top-6">
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-indigo-400">add_to_photos</span>
                        Create Workshop Theme
                    </h2>
                    
                    <form onSubmit={handleSessionSubmit} className="flex flex-col gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Theme Title</label>
                            <input 
                                type="text"
                                value={sessionTitle}
                                onChange={e => setSessionTitle(e.target.value)}
                                placeholder="e.g. Space Robots Day"
                                className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Description / Activity</label>
                            <textarea 
                                value={sessionDesc}
                                onChange={e => setSessionDesc(e.target.value)}
                                placeholder="e.g. Building rovers with Lego Mindstorms..."
                                className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none h-24"
                            />
                        </div>
                        
                        <button 
                            type="submit"
                            disabled={!sessionTitle}
                            className="mt-2 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all bg-indigo-600 text-white hover:bg-indigo-500"
                        >
                            <span className="material-symbols-outlined">save</span>
                            Add Theme
                        </button>
                    </form>
                </div>
            )}

            {activeTab === 'settings' && (
                 <div className="bg-slate-800 rounded-2xl p-6 border border-white/5 shadow-xl sticky top-6">
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-slate-400">settings</span>
                        System Configuration
                    </h2>
                    
                    <div className="flex flex-col gap-4">
                        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                            <div className="flex items-start gap-3">
                                <span className="material-symbols-outlined text-blue-400">record_voice_over</span>
                                <div>
                                    <h3 className="text-sm font-bold text-blue-100">Voice Generation (Gemini)</h3>
                                    <p className="text-xs text-blue-200/70 mt-1 leading-relaxed">
                                        Provide a Google Gemini API Key to enable AI voice announcements. 
                                        If left empty, the system will simply play a notification chime.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Gemini API Key (Optional)</label>
                            <input 
                                type="password"
                                value={apiKeyInput}
                                onChange={e => setApiKeyInput(e.target.value)}
                                placeholder="AIzaSy..."
                                className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-sm"
                            />
                        </div>
                        
                        <button 
                            onClick={handleSettingsSave}
                            className="mt-2 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all bg-slate-700 text-white hover:bg-slate-600"
                        >
                            <span className="material-symbols-outlined">save</span>
                            Save Configuration
                        </button>
                    </div>
                </div>
            )}
        </div>

        {/* RIGHT PANEL (LISTS) */}
        <div className="lg:col-span-2">
            {activeTab === 'students' && (
                <>
                    <h2 className="text-lg font-bold text-white mb-4">Registered Families ({students.length})</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {students.map(student => {
                            const parent = parents.find(p => p.id === student.parentId);
                            return (
                                <div key={student.id} className="bg-slate-800 p-4 rounded-xl border border-white/5 flex items-center gap-4">
                                    <img src={student.avatarUrl} alt={student.name} className="w-14 h-14 rounded-full bg-slate-700 object-cover"/>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-bold text-white truncate">{student.name}</h3>
                                            <span className="px-2 py-1 bg-white/5 text-slate-300 rounded text-[10px] font-bold uppercase tracking-wider border border-white/5">
                                                {student.classroom || 'Salle 1'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded text-xs font-mono font-bold">
                                                {student.accessCode}
                                            </span>
                                            <span className="text-xs text-slate-500">• Parent: {parent?.name}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
            
            {activeTab === 'workshops' && (
                <>
                    <h2 className="text-lg font-bold text-white mb-4">Available Workshop Themes</h2>
                    <div className="space-y-4">
                        {sessions.map(session => (
                            <div key={session.id} className={`relative p-4 rounded-xl border flex gap-4 transition-all ${session.isActive ? 'bg-indigo-900/20 border-indigo-500/50 ring-1 ring-indigo-500/50' : 'bg-slate-800 border-white/5 opacity-70 hover:opacity-100'}`}>
                                <div className="w-24 h-24 bg-slate-700 rounded-lg bg-cover bg-center shrink-0" style={{backgroundImage: `url("${session.imageUrl}")`}} />
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-white text-lg">{session.title}</h3>
                                        {session.isActive ? (
                                            <span className="bg-green-500 text-primary text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                                                <span className="material-symbols-outlined text-sm">check</span> Active
                                            </span>
                                        ) : (
                                            <button 
                                                onClick={() => { activateSession(session.id); playSound.click(); }}
                                                className="bg-slate-700 hover:bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded transition-colors"
                                            >
                                                Activate
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-400 mt-1">{session.description}</p>
                                </div>
                            </div>
                        ))}
                        {sessions.length === 0 && (
                             <p className="text-text-muted text-sm italic">No themes created yet.</p>
                        )}
                    </div>
                </>
            )}

            {activeTab === 'settings' && (
                <div className="flex flex-col items-center justify-center h-64 text-text-muted opacity-50">
                    <span className="material-symbols-outlined text-6xl mb-4">tune</span>
                    <p>Select options from the panel on the left</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
