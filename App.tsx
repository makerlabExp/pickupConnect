
import React from 'react';
import { AppProvider, useAppStore } from './store/mockStore';
import { ParentView } from './components/ParentView';
import { StudentLogin } from './components/StudentLogin';
import { StudentView } from './components/StudentView';
import { InstructorView } from './components/InstructorView';
import { AdminView } from './components/AdminView';
import { SetupView } from './components/SetupView';

const SimulationLayout: React.FC = () => {
    const { activeStudentId, activeParentId, students, parents } = useAppStore();
    
    const activeParent = parents.find(p => p.id === activeParentId);

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 overflow-hidden font-display">
            <div className="flex shrink-0 items-center justify-between px-6 py-3 bg-slate-900 border-b border-white/10 shadow-md">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                        <span className="material-symbols-outlined text-xl">labs</span>
                    </div>
                    <div>
                        <h2 className="text-white font-bold text-sm">MakerLab Flow Simulator</h2>
                        <p className="text-slate-400 text-xs">Real-time state synchronization</p>
                    </div>
                </div>
                
                {/* Debug Helper for Codes */}
                <div className="hidden lg:flex items-center gap-4 px-4 py-2 bg-slate-800 rounded-lg border border-white/5">
                    <span className="text-xs font-bold text-slate-400 uppercase">Available Codes:</span>
                    <div className="flex gap-3">
                        {students.map(s => (
                            <div key={s.id} className="text-xs text-white bg-slate-700 px-2 py-0.5 rounded">
                                <span className="text-slate-400">{s.name}:</span> <span className="font-mono font-bold text-accent">{s.accessCode}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex gap-4 items-center">
                     <div className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        System Online
                     </div>
                     <button 
                        onClick={() => window.location.reload()} 
                        className="text-xs font-bold text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors"
                     >
                        Reset Session
                     </button>
                </div>
            </div>
            
            <div className="flex-1 overflow-x-auto overflow-y-hidden p-8">
                <div className="flex h-full gap-12 justify-center min-w-[1400px] items-center">
                   {/* Parent Device */}
                   <div className="flex flex-col gap-4 items-center shrink-0">
                      <div className="flex items-center gap-2 text-white/50 text-sm font-bold tracking-wider uppercase">
                        <span className="material-symbols-outlined text-sm">smartphone</span>
                        Parent App
                      </div>
                      <div className="w-[360px] h-[780px] rounded-[3rem] border-[8px] border-slate-800 overflow-hidden bg-primary shadow-2xl relative ring-1 ring-white/10">
                         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-xl z-20"></div>
                         <div className="h-full w-full overflow-y-auto">
                            <ParentView />
                         </div>
                      </div>
                      <p className="text-xs text-slate-500 font-mono">
                          Role: {activeParent ? `${activeParent.name} (Logged In)` : 'Not Logged In'}
                      </p>
                   </div>
        
                   {/* Student Device */}
                   <div className="flex flex-col gap-4 items-center shrink-0">
                      <div className="flex items-center gap-2 text-white/50 text-sm font-bold tracking-wider uppercase">
                        <span className="material-symbols-outlined text-sm">tablet_mac</span>
                        Student Kiosk
                      </div>
                       <div className="w-[360px] h-[780px] rounded-[2rem] border-[8px] border-slate-800 overflow-hidden bg-primary shadow-2xl relative ring-1 ring-white/10">
                          <div className="h-full w-full overflow-y-auto">
                             {activeStudentId ? <StudentView /> : <StudentLogin />}
                          </div>
                       </div>
                       <p className="text-xs text-slate-500 font-mono">
                          Status: {activeStudentId ? 'Logged In' : 'Waiting for Code'}
                       </p>
                   </div>
        
                   {/* Instructor Device */}
                   <div className="flex flex-col gap-4 items-center shrink-0">
                      <div className="flex items-center gap-2 text-white/50 text-sm font-bold tracking-wider uppercase">
                        <span className="material-symbols-outlined text-sm">desktop_windows</span>
                        Instructor Dashboard
                      </div>
                      <div className="w-[800px] h-[600px] rounded-[1.5rem] border-[8px] border-slate-800 overflow-hidden bg-primary shadow-2xl relative ring-1 ring-white/10">
                         <div className="h-full w-full overflow-y-auto">
                            <InstructorView />
                         </div>
                      </div>
                      <p className="text-xs text-slate-500 font-mono">Role: Instructor</p>
                   </div>
                </div>
            </div>
        </div>
    );
}

const AppContent: React.FC = () => {
  const { currentUserRole, setRole, activeStudentId, isConfigured, students, seedDatabase, resetConfiguration } = useAppStore();

  // If not configured with Supabase keys, show setup screen
  if (!isConfigured) {
      return <SetupView />;
  }

  if (currentUserRole === 'simulation' as any) {
      return <SimulationLayout />;
  }

  if (currentUserRole === 'parent') return <ParentView />;
  if (currentUserRole === 'instructor') return <InstructorView />;
  if (currentUserRole === 'admin') return <AdminView />;
  if (currentUserRole === 'student') {
      if (activeStudentId) return <StudentView />;
      return <StudentLogin />;
  }

  // Landing / Role Selector
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-primary p-6 text-center font-display relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 -left-24 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-accent to-emerald-600 shadow-2xl shadow-accent/20 relative z-10">
             <span className="material-symbols-outlined text-5xl text-white">hub</span>
        </div>
      <h1 className="mb-2 text-4xl font-bold text-white relative z-10">MakerLab Connect</h1>
      <p className="mb-12 max-w-md text-text-muted relative z-10">
        The smart coordination platform for workshops. <br/> Select a role to preview the experience.
      </p>

      <div className="grid w-full max-w-sm gap-4 relative z-10">
        {/* Simulation Button */}
        <button
          onClick={() => setRole('simulation' as any)}
          className="group relative flex w-full items-center gap-4 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 p-1 p-[2px] transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
            <div className="flex w-full items-center gap-4 rounded-xl bg-surface-dark p-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors z-10">
                    <span className="material-symbols-outlined">labs</span>
                </div>
                <div className="z-10 text-left">
                    <div className="font-bold text-white">Simulate Flow</div>
                    <div className="text-sm text-text-muted">Test all roles at once</div>
                </div>
            </div>
        </button>

        <div className="h-px w-full bg-white/10 my-2"></div>

        <button
          onClick={() => setRole('parent')}
          className="group relative flex w-full items-center gap-4 rounded-2xl bg-surface-dark p-4 text-left transition-all hover:bg-white/5 hover:ring-1 hover:ring-white/20"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
            <span className="material-symbols-outlined">family_restroom</span>
          </div>
          <div>
            <div className="font-bold text-white">Parent</div>
            <div className="text-sm text-text-muted">Schedule pickup, send notes</div>
          </div>
        </button>

        <button
          onClick={() => setRole('student')}
          className="group relative flex w-full items-center gap-4 rounded-2xl bg-surface-dark p-4 text-left transition-all hover:bg-white/5 hover:ring-1 hover:ring-white/20"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent group-hover:bg-accent group-hover:text-primary transition-colors">
            <span className="material-symbols-outlined">backpack</span>
          </div>
          <div>
            <div className="font-bold text-white">Student</div>
            <div className="text-sm text-text-muted">Enter access code</div>
          </div>
        </button>

        <button
          onClick={() => setRole('instructor')}
          className="group relative flex w-full items-center gap-4 rounded-2xl bg-surface-dark p-4 text-left transition-all hover:bg-white/5 hover:ring-1 hover:ring-white/20"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors">
            <span className="material-symbols-outlined">school</span>
          </div>
          <div>
            <div className="font-bold text-white">Instructor</div>
            <div className="text-sm text-text-muted">View live feed, AI announcements</div>
          </div>
        </button>

        <div className="h-px w-full bg-white/10 my-2"></div>

        <button
          onClick={() => setRole('admin')}
          className="group relative flex w-full items-center gap-4 rounded-2xl bg-surface-dark p-4 text-left transition-all hover:bg-white/5 hover:ring-1 hover:ring-white/20"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-700/50 text-slate-300 group-hover:bg-slate-600 group-hover:text-white transition-colors">
            <span className="material-symbols-outlined">admin_panel_settings</span>
          </div>
          <div>
            <div className="font-bold text-white">Admin</div>
            <div className="text-sm text-text-muted">Manage students & codes</div>
          </div>
        </button>
      </div>

      <div className="mt-12 p-4 rounded-xl bg-surface-dark/50 border border-white/5 w-full max-w-sm backdrop-blur-sm z-10">
        <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">System Status</span>
            <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs text-emerald-400 font-bold">Online</span>
            </div>
        </div>
        
        <div className="flex items-center justify-between">
            <div className="text-sm text-text-muted">
                <span className="text-white font-bold">{students.length}</span> Students Registered
            </div>
            
            {students.length === 0 && (
                <button 
                    onClick={() => { 
                        if(confirm("Populate database with test users?")) seedDatabase(); 
                    }}
                    className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg font-bold transition-colors animate-pulse shadow-lg shadow-blue-500/20"
                >
                    + Seed Test Data
                </button>
            )}
        </div>
        
        <div className="mt-4 pt-4 border-t border-white/5 flex justify-center">
             <button onClick={resetConfiguration} className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors">
                Reset Connection Settings
             </button>
        </div>
      </div>
      
      <p className="fixed bottom-4 text-xs text-slate-800 mix-blend-screen pointer-events-none">Demo Version 1.1.0</p>
    </div>
  );
};

const App: React.FC = () => {
    return (
        <AppProvider>
            <AppContent />
        </AppProvider>
    )
}

export default App;
