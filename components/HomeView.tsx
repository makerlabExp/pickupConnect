
import React from 'react';
import { Link } from 'react-router-dom';

export const HomeView: React.FC = () => {
  const roles = [
    { 
      id: 'parent', 
      label: 'Parent App', 
      icon: 'family_restroom', 
      path: '/parent',
      color: 'bg-blue-600',
      desc: 'Notify pickup & chat'
    },
    { 
      id: 'student', 
      label: 'Student Kiosk', 
      icon: 'school', 
      path: '/student',
      color: 'bg-emerald-600',
      desc: 'Check status & wait'
    },
    { 
      id: 'instructor', 
      label: 'Instructor', 
      icon: 'desktop_windows', 
      path: '/instructor',
      color: 'bg-purple-600',
      desc: 'Dashboard & Audio'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 font-display flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
         <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-3xl" />
         <div className="absolute top-[40%] -right-[10%] w-[60%] h-[60%] rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <div className="max-w-md w-full z-10 flex flex-col gap-8">
        
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-3 bg-white/5 rounded-2xl mb-4 ring-1 ring-white/10 shadow-lg backdrop-blur-sm">
             <span className="material-symbols-outlined text-4xl text-white">hub</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">MakerLab Connect</h1>
          <p className="text-slate-400 mt-2 text-sm">Choose your access portal</p>
        </div>

        <div className="grid gap-4">
            {roles.map(role => (
                <Link 
                   key={role.id} 
                   to={role.path}
                   className="group relative overflow-hidden bg-slate-900 border border-white/10 p-4 rounded-2xl flex items-center gap-4 hover:border-white/20 hover:bg-slate-800 transition-all shadow-lg active:scale-[0.98]"
                >
                    <div className={`w-14 h-14 rounded-xl ${role.color} flex items-center justify-center shadow-lg shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                        <span className="material-symbols-outlined text-2xl text-white">{role.icon}</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-lg">{role.label}</h3>
                        <p className="text-slate-500 text-xs font-medium">{role.desc}</p>
                    </div>
                    <div className="absolute right-4 opacity-0 group-hover:opacity-100 transition-opacity text-white/20">
                        <span className="material-symbols-outlined">arrow_forward_ios</span>
                    </div>
                </Link>
            ))}
        </div>

        <div className="mt-8 flex justify-center">
            <Link to="/admin" className="text-xs font-bold text-slate-500 hover:text-white transition-colors flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/5">
                <span className="material-symbols-outlined text-sm">settings</span>
                Admin & System Settings
            </Link>
        </div>

      </div>
    </div>
  );
};
