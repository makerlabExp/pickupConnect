import React from 'react';
import { HashRouter, Routes, Route, Link } from 'react-router-dom';
import { AppProvider, useAppStore } from './store/mockStore';
import { ParentView } from './components/ParentView';
import { StudentLogin } from './components/StudentLogin';
import { StudentView } from './components/StudentView';
import { InstructorView } from './components/InstructorView';
import { AdminView } from './components/AdminView';
import { SetupView } from './components/SetupView';
import { AdminLogin } from './components/AdminLogin';
import { InstructorLogin } from './components/InstructorLogin';

const SimulationLayout: React.FC = () => {
    const { activeStudentId, students } = useAppStore();

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
                     <Link to="/" className="text-xs font-bold text-slate-400 hover:text-white transition-colors">Exit Simulation</Link>
                     <div className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        System Online
                     </div>
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
                   </div>
                </div>
            </div>
        </div>
    );
}

const StudentRoute = () => {
    const { activeStudentId } = useAppStore();
    return activeStudentId ? <StudentView /> : <StudentLogin />;
}

const AdminRoute = () => {
    const { isAdminLoggedIn } = useAppStore();
    return isAdminLoggedIn ? <AdminView /> : <AdminLogin />;
}

const InstructorRoute = () => {
    const { isInstructorLoggedIn } = useAppStore();
    return isInstructorLoggedIn ? <InstructorView /> : <InstructorLogin />;
}

const App: React.FC = () => {
    return (
        <AppProvider>
            <HashRouter>
                <Routes>
                    {/* Default route is now Admin (which shows Login or Dashboard) */}
                    <Route path="/" element={<AdminRoute />} />
                    <Route path="/admin" element={<AdminRoute />} />
                    
                    {/* Role specific routes */}
                    <Route path="/parent" element={<ParentView />} />
                    <Route path="/student" element={<StudentRoute />} />
                    <Route path="/instructor" element={<InstructorRoute />} />
                    
                    {/* Tools */}
                    <Route path="/simulation" element={<SimulationLayout />} />
                    <Route path="/setup" element={<SetupView />} />
                </Routes>
            </HashRouter>
        </AppProvider>
    )
}

export default App;