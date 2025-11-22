
import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/mockStore';
import { playSound } from '../services/soundService';
import { useNavigate } from 'react-router-dom';
import { getStoredCredentials } from '../services/firebase';

export const AdminView: React.FC = () => {
  const { students, parents, sessions, addStudent, addSession, activateSession, resetSystem, seedDatabase, logout, isConfigured } = useAppStore();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'students' | 'workshops' | 'settings' | 'links'>('students');

  // Student Form
  const [studentName, setStudentName] = useState('');
  const [parentName, setParentName] = useState('');
  const [classroom, setClassroom] = useState<string>('Salle 1');

  // Session Form
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionDesc, setSessionDesc] = useState('');
  
  // Auto-switch to settings if not configured
  useEffect(() => {
      if (!isConfigured) {
          setActiveTab('settings');
      }
  }, [isConfigured]);

  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (studentName.trim() && studentName.trim()) {
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

  const copyToClipboard = async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        playSound.success();
        alert("Link copied to clipboard!");
      } catch (err) {
        console.error('Failed to copy:', err);
        alert(`Could not copy automatically. Please copy this URL:\n${text}`);
      }
  };

  const handleShareConfig = (redirectPath?: string) => {
      const { url, key } = getStoredCredentials();
      if (!url || !key) {
          alert("System is not configured yet. Connect Supabase first.");
          return;
      }
      
      const configData = JSON.stringify({ url, key });
      const payload = btoa(configData);
      
      const origin = window.location.origin;
      // For HashRouter, we construct the URL carefully:
      // https://domain.com/#/setup?config=...&redirect=/parent
      // The hash comes before the path in React Router 7/6 HashRouter, but queries can be tricky.
      // Standard format: https://domain.com/#/setup?config=...
      
      const pathname = window.location.pathname === '/' ? '' : window.location.pathname;
      let link = `${origin}${pathname}/#/setup?config=${payload}`;
      
      if (redirectPath) {
          link += `&redirect=${redirectPath}`;
      }
      
      copyToClipboard(link);
      
      const roleName = redirectPath ? redirectPath.replace('/', '').toUpperCase() : 'Main App';
      alert(`Magic Link for ${roleName} copied!\n\nShare this with users. It will auto-configure the app and open the correct screen.`);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-text-light font-display p-6">
      <header className="flex justify-between items-center mb-8 pb-6 border-b border-white/10">
        <div className="flex items-center gap-4">
           <div>
             <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
             <p className="text-text-muted">Academy Management System</p>
           </div>
        </div>
        
        <div className="flex items-center gap-3">
             <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 ${isConfigured ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'}`}>
                 <span className={`h-2 w-2 rounded-full ${isConfigured ? 'bg-emerald-500' : 'bg-orange-500'}`}></span>
                 {isConfigured ? 'DB Connected' : 'Demo Mode (Offline)'}
             </div>
             <button onClick={() => { logout(); playSound.click(); }} className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm font-medium transition-colors">
                 Logout
             </button>
        </div>
      </header>

      {/* Tab Bar */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('students')}
            className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'students' ? 'bg-accent text-primary' : 'bg-surface-dark text-text-muted hover:bg-white/5'}`}
          >
              <span className="material-symbols-outlined">group_add</span>
              Families
          </button>
          <button 
            onClick={() => setActiveTab('workshops')}
            className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'workshops' ? 'bg-indigo-500 text-white' : 'bg-surface-dark text-text-muted hover:bg-white/5'}`}
          >
              <span className="material-symbols-outlined">theater_comedy</span>
              Workshops
          </button>
          <button 
            onClick={() => setActiveTab('links')}
            className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'links' ? 'bg-blue-600 text-white' : 'bg-surface-dark text-text-muted hover:bg-white/5'}`}
          >
              <span className="material-symbols-outlined">link</span>
              Kiosk & Links
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'settings' ? 'bg-slate-700 text-white' : 'bg-surface-dark text-text-muted hover:bg-white/5'}`}
          >
              <span className="material-symbols-outlined">settings</span>
              Settings
          </button>
      </div>
      
      {!isConfigured && activeTab !== 'settings' && (
          <div className="mb-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-orange-400">warning</span>
                  <div>
                      <h3 className="font-bold text-orange-400">System not configured</h3>
                      <p className="text-xs text-orange-400/70">You are using Mock Data. Connect Supabase in Settings.</p>
                  </div>
              </div>
              <button onClick={() => setActiveTab('settings')} className="px-4 py-2 bg-orange-500 text-white text-xs font-bold rounded-lg hover:bg-orange-600">Go to Settings</button>
          </div>
      )}

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
                    
                    <div className="mt-6 pt-6 border-t border-white/10">
                        <button 
                            onClick={seedDatabase}
                            className="w-full px-4 py-2 rounded-lg border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-lg">database</span>
                            Seed Test Data
                        </button>
                    </div>
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
            
            {activeTab === 'links' && (
                 <div className="bg-slate-800 rounded-2xl p-6 border border-white/5 shadow-xl sticky top-6">
                    <h2 className="text-lg font-bold text-white mb-4">Direct Kiosk Access</h2>
                    <p className="text-xs text-slate-400 mb-6">
                        Share these links with parents or students. They bypass the main menu and connect securely.
                    </p>
                    
                    <div className="space-y-6">
                        {/* Parent Link */}
                        <div className="p-4 bg-slate-900 rounded-xl border border-blue-500/30 relative group hover:border-blue-500 transition-colors">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-blue-400 text-sm">family_restroom</span>
                                    </div>
                                    <div>
                                        <span className="text-sm font-bold text-blue-400 uppercase block">Parent Direct Link</span>
                                    </div>
                                </div>
                                <button onClick={() => handleShareConfig('/parent')} className="text-slate-400 hover:text-white bg-white/5 p-2 rounded-lg transition-colors hover:bg-blue-600"><span className="material-symbols-outlined text-sm">content_copy</span></button>
                            </div>
                            <p className="text-xs text-slate-500">Auto-configures & opens Parent Login immediately.</p>
                        </div>

                        {/* Student Link */}
                        <div className="p-4 bg-slate-900 rounded-xl border border-emerald-500/30 relative group hover:border-emerald-500 transition-colors">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                     <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-emerald-400 text-sm">face</span>
                                    </div>
                                    <span className="text-sm font-bold text-emerald-400 uppercase">Student Kiosk Link</span>
                                </div>
                                <button onClick={() => handleShareConfig('/student')} className="text-slate-400 hover:text-white bg-white/5 p-2 rounded-lg transition-colors hover:bg-emerald-600"><span className="material-symbols-outlined text-sm">content_copy</span></button>
                            </div>
                            <p className="text-xs text-slate-500">Auto-configures & opens Student Keypad immediately.</p>
                        </div>

                        {/* Instructor Link */}
                        <div className="p-4 bg-slate-900 rounded-xl border border-purple-500/30 relative group hover:border-purple-500 transition-colors">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                     <div className="h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-purple-400 text-sm">desktop_windows</span>
                                    </div>
                                    <span className="text-sm font-bold text-purple-400 uppercase">Instructor Link</span>
                                </div>
                                <button onClick={() => handleShareConfig('/instructor')} className="text-slate-400 hover:text-white bg-white/5 p-2 rounded-lg transition-colors hover:bg-purple-600"><span className="material-symbols-outlined text-sm">content_copy</span></button>
                            </div>
                            <p className="text-xs text-slate-500">Auto-configures & opens Instructor Dashboard.</p>
                        </div>
                    </div>
                 </div>
            )}

            {activeTab === 'settings' && (
                 <div className="bg-slate-800 rounded-2xl p-6 border border-white/5 shadow-xl sticky top-6">
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-slate-400">settings</span>
                        System Configuration
                    </h2>
                    
                    <div className="flex flex-col gap-4">
                        <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                             <h3 className="text-sm font-bold text-indigo-300 mb-2 flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">database</span> 1. Database Connection
                             </h3>
                             <p className="text-xs text-indigo-200/70 mb-3">
                                Connect to Supabase to enable real-time sync between parents and instructors.
                             </p>
                             {isConfigured ? (
                                 <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold bg-emerald-500/10 p-2 rounded">
                                     <span className="material-symbols-outlined text-sm">check_circle</span> Connected
                                     <button onClick={() => navigate('/setup')} className="ml-auto underline opacity-70 hover:opacity-100">Reconfigure</button>
                                 </div>
                             ) : (
                                <button 
                                    onClick={() => navigate('/setup')}
                                    className="w-full py-2 rounded-lg font-bold text-xs bg-indigo-600 text-white hover:bg-indigo-500 transition-colors animate-pulse"
                                >
                                    Connect Supabase
                                </button>
                             )}
                        </div>
                        
                        {/* Share Config Button */}
                        {isConfigured && (
                            <div className="p-4 bg-slate-900/50 border border-white/10 rounded-xl">
                                <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm">phonelink_setup</span> 2. Connect Devices
                                </h3>
                                <p className="text-xs text-slate-400 mb-3">
                                    Go to "Kiosk & Links" tab to get role-specific setup links.
                                </p>
                                <button 
                                    onClick={() => setActiveTab('links')}
                                    className="w-full py-2 rounded-lg font-bold text-xs border border-white/20 hover:bg-white/5 transition-colors text-white flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                    Get Kiosk Links
                                </button>
                            </div>
                        )}

                        <div className="h-px bg-white/10 my-2" />
                        
                        <button 
                            onClick={() => {
                                if(window.confirm("This will delete EVERYTHING (Local & DB) and refresh. Continue?")) {
                                    resetSystem();
                                }
                            }}
                            className="py-3 rounded-xl font-bold border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2 text-xs"
                        >
                            <span className="material-symbols-outlined">delete_forever</span>
                            Clear Data & Reset
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
                         {students.length === 0 && (
                             <div className="col-span-full p-12 text-center text-slate-500 border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center">
                                 <span className="material-symbols-outlined text-4xl mb-2 opacity-50">group_off</span>
                                 <p>No students found in database.</p>
                                 <p className="text-sm mt-1">Use the form on the left to add families.</p>
                             </div>
                        )}
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

            {(activeTab === 'settings' || activeTab === 'links') && (
                <div className="flex flex-col items-center justify-center h-64 text-text-muted opacity-30 bg-slate-800/50 rounded-2xl border border-white/5">
                    <span className="material-symbols-outlined text-6xl mb-4">arrow_back</span>
                    <p className="font-bold">Configure options in the left panel</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
