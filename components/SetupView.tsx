
import React, { useState, useEffect } from 'react';
import { saveCredentials, initSupabase } from '../services/firebase';
import { useAppStore } from '../store/mockStore';
import { useNavigate, useSearchParams } from 'react-router-dom';

export const SetupView: React.FC = () => {
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const { checkConfiguration } = useAppStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Auto-fill from URL if provided
  useEffect(() => {
      const config = searchParams.get('config');
      if (config) {
          try {
              const decoded = atob(config);
              const { url: loadedUrl, key: loadedKey } = JSON.parse(decoded);
              if (loadedUrl && loadedKey) {
                  setUrl(loadedUrl);
                  setKey(loadedKey);
                  // If we got it from a link, assume it's correct and auto-save if test passes? 
                  // Better to let user click verify to be safe.
              }
          } catch (e) {
              console.error("Invalid config link");
          }
      }
  }, [searchParams]);

  const handleTestConnection = async () => {
    setStatus('testing');
    setErrorMsg('');
    try {
        // Temporary client just for testing
        const tempClient = initSupabase(url, key);
        if (!tempClient) throw new Error("Invalid URL/Key format");

        // Try to fetch count (even if 0, if it doesn't throw, we are connected)
        const { error } = await tempClient.from('students').select('*', { count: 'exact', head: true });
        
        if (error) throw error;
        
        setStatus('success');
    } catch (e: any) {
        console.error(e);
        setStatus('error');
        setErrorMsg(e.message || "Connection failed. Check console.");
    }
  };

  const handleSave = () => {
    if (url && key && status === 'success') {
      saveCredentials(url, key);
      checkConfiguration();
      navigate('/admin');
    }
  };

  const sqlScript = `-- 1. Update Students
alter table students add column if not exists classroom text default 'Salle 1';

-- 2. Update Pickups (Add audio storage)
alter table pickups add column if not exists "audioBase64" text;

-- 3. Create Sessions Table
create table if not exists sessions (
  id text primary key,
  title text not null,
  description text,
  "imageUrl" text,
  "isActive" boolean default false,
  "endTime" bigint
);

-- 4. Enable Realtime (Safely Check First)
do $$
begin
  if not exists (
    select 1 from pg_publication_rel pr
    join pg_class pc on pr.prrelid = pc.oid
    join pg_publication pp on pr.prpubid = pp.oid
    where pp.pubname = 'supabase_realtime' and pc.relname = 'sessions'
  ) then
    alter publication supabase_realtime add table sessions;
  end if;
end
$$;

-- 5. Disable RLS for Demo (Allow public read/write)
alter table students disable row level security;
alter table parents disable row level security;
alter table pickups disable row level security;
alter table sessions disable row level security;`;

  return (
    <div className="min-h-screen bg-primary flex flex-col items-center justify-center p-6 font-display text-text-light">
      <div className="w-full max-w-4xl grid lg:grid-cols-2 gap-8">
          
          {/* Left: Form */}
          <div className="bg-surface-dark border border-white/10 rounded-2xl p-8 shadow-2xl flex flex-col">
            <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-2xl">database</span>
                </div>
                <div>
                    <h1 className="text-xl font-bold">Connect Supabase</h1>
                    <p className="text-text-muted text-xs">Enter your project credentials</p>
                </div>
            </div>

            <div className="space-y-4 flex-1">
                <div>
                    <label className="block text-xs font-bold uppercase text-text-muted mb-1.5">Project URL</label>
                    <input 
                    type="text"
                    value={url}
                    onChange={(e) => { setUrl(e.target.value); setStatus('idle'); }}
                    placeholder="https://xyz.supabase.co"
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono text-sm"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase text-text-muted mb-1.5">Anon Key (Public)</label>
                    <input 
                    type="password"
                    value={key}
                    onChange={(e) => { setKey(e.target.value); setStatus('idle'); }}
                    placeholder="eyJh..."
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono text-sm"
                    />
                </div>
                
                {status === 'error' && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
                        <strong>Error:</strong> {errorMsg}
                        <br/>Did you run the SQL script on the right?
                    </div>
                )}

                {status === 'success' && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs flex items-center gap-2">
                        <span className="material-symbols-outlined text-base">check_circle</span>
                        Connection successful!
                    </div>
                )}
            </div>

            <div className="flex gap-3 mt-8">
                 <button 
                    onClick={handleTestConnection}
                    disabled={!url || !key || status === 'testing'}
                    className="flex-1 py-3 rounded-xl font-bold text-sm border border-white/10 hover:bg-white/5 transition-colors"
                >
                    {status === 'testing' ? 'Testing...' : 'Test Connection'}
                </button>
                
                <button 
                    onClick={handleSave}
                    disabled={status !== 'success'}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2
                        ${status === 'success'
                        ? 'bg-emerald-500 text-primary hover:bg-emerald-400' 
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'}
                    `}
                >
                    Save & Continue
                </button>
            </div>
          </div>

          {/* Right: Instructions */}
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col text-sm">
             <h2 className="font-bold text-white mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-warning">warning</span>
                DB Migration Script
             </h2>
             <p className="text-text-muted mb-4">
                Run this in Supabase SQL Editor to update your existing tables and fix permissions.
             </p>
             
             <div className="relative flex-1 bg-black rounded-lg border border-white/10 overflow-hidden group">
                 <button 
                    onClick={() => navigator.clipboard.writeText(sqlScript)}
                    className="absolute top-2 right-2 p-2 bg-white/10 hover:bg-white/20 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Copy SQL"
                 >
                    <span className="material-symbols-outlined text-sm">content_copy</span>
                 </button>
                 <pre className="p-4 text-xs font-mono text-emerald-400 overflow-auto h-full max-h-[400px] whitespace-pre-wrap">
{sqlScript}
                 </pre>
             </div>
          </div>
      </div>
    </div>
  );
};
