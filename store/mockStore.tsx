
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getSupabase, getStoredCredentials } from '../services/firebase'; 
import { PickupRequest, PickupStatus, Student, Parent, Session, ChatMessage } from '../types';
import { setSystemMute } from '../services/soundService';

// --- MOCK DATA (Offline Fallback / Seeding) ---
const MOCK_STUDENTS: Student[] = [
  { id: 's1', name: 'Leo', accessCode: '1234', parentId: 'p1', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo', classroom: 'Salle 1' },
  { id: 's2', name: 'Mia', accessCode: '5678', parentId: 'p2', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mia', classroom: 'Salle DIY' },
];
const MOCK_PARENTS: Parent[] = [
  { id: 'p1', name: 'Sarah', studentId: 's1', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' },
  { id: 'p2', name: 'Mike', studentId: 's2', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike' },
];

const DEFAULT_SESSION: Session = {
    id: 'sess_default',
    title: 'General Workshop',
    description: 'Daily Activities',
    endTime: Date.now() + 1000 * 60 * 60, 
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD2x5mdNdc8OqJ4jljwmWPVlljklCxxmQ0HASTp4Qp1dc1k4CWXD5nEuUUyWrkA30BihR-Xd2ENLlHElkNLOJTOd4_o3tjxojevwq4u4kzNDCTv61_7mEBiKnn5vcfHJhLgEufZar06IQy2WFEq-wTbtMqlSmOuaWwnU26DYXa6YD-TLr_vlzX2DMvQOOPG9S_YWryPA--CwWEdfQVHuh_sPEOvVftpzjILH41CDIcuftt8SHCSvBgw_GQHOxq7EAdrSe6n8LwYCnDM',
    isActive: true
};

interface AppState {
  isConfigured: boolean;
  isMuted: boolean;
  geminiApiKey: string; // New API Key state
  currentUserRole: 'parent' | 'student' | 'instructor' | 'simulation' | 'admin' | null;
  activeStudentId: string | null;
  activeParentId: string | null;
  
  students: Student[];
  parents: Parent[];
  pickupQueue: PickupRequest[];
  sessions: Session[];
  currentSession: Session;

  setRole: (role: 'parent' | 'student' | 'instructor' | 'simulation' | 'admin' | null) => void;
  toggleMute: () => void;
  updateGeminiApiKey: (key: string) => void;
  loginStudent: (code: string) => boolean;
  loginParent: (code: string) => boolean;
  logoutParent: () => void;
  updatePickupStatus: (studentId: string, status: PickupStatus) => void;
  sendMessage: (studentId: string, text: string, sender: 'student' | 'parent') => void;
  setAnnouncement: (reqId: string, text: string) => void;
  setAudioAnnouncement: (reqId: string, audioBase64: string) => void;
  markAsAnnounced: (reqId: string) => void;
  addStudent: (studentName: string, parentName: string, classroom: string) => void;
  addSession: (title: string, description: string, imageUrl: string) => void;
  activateSession: (sessionId: string) => void;
  resetSystem: () => void;
  seedDatabase: () => void;
  checkConfiguration: () => void;
  refreshData: () => Promise<void>;
  resetConfiguration: () => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUserRole, setRole] = useState<AppState['currentUserRole']>(null);
  const [activeStudentId, setActiveStudentId] = useState<string | null>(() => localStorage.getItem('activeStudentId'));
  const [activeParentId, setActiveParentId] = useState<string | null>(() => localStorage.getItem('activeParentId'));
  const [isConfigured, setIsConfigured] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => localStorage.getItem('gemini_api_key') || '');

  const [students, setStudents] = useState<Student[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [pickupQueue, setPickupQueue] = useState<PickupRequest[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);

  // Derived state: Active Session
  const currentSession = sessions.find(s => s.isActive) || DEFAULT_SESSION;

  // --- CHECK CONFIG ---
  const checkConfiguration = useCallback(() => {
    const { url, key } = getStoredCredentials();
    const hasConfig = !!(url && key);
    setIsConfigured(hasConfig);
    return hasConfig;
  }, []);

  useEffect(() => {
    checkConfiguration();
  }, [checkConfiguration]);

  // --- MUTE TOGGLE ---
  const toggleMute = useCallback(() => {
      setIsMuted(prev => {
          const newState = !prev;
          setSystemMute(newState);
          return newState;
      });
  }, []);

  // --- API KEY UPDATE ---
  const updateGeminiApiKey = useCallback((key: string) => {
      setGeminiApiKey(key);
      if (key) {
          localStorage.setItem('gemini_api_key', key);
      } else {
          localStorage.removeItem('gemini_api_key');
      }
  }, []);

  // --- DATA FETCHING ---
  const refreshData = useCallback(async () => {
    if (!isConfigured) return;
    const supabase = getSupabase();
    if (!supabase) return;

    const s = await supabase.from('students').select('*');
    if (s.data) setStudents(s.data);

    const p = await supabase.from('parents').select('*');
    if (p.data) setParents(p.data);

    const pk = await supabase.from('pickups').select('*');
    if (pk.data) setPickupQueue(pk.data);

    const sess = await supabase.from('sessions').select('*');
    if (sess.data && sess.data.length > 0) setSessions(sess.data);
    else setSessions([]);

  }, [isConfigured]);


  // --- SUPABASE REALTIME SUBSCRIPTIONS ---
  useEffect(() => {
    if (!isConfigured) return;
    
    refreshData();
    const supabase = getSupabase();
    if (!supabase) return;

    const channel = supabase.channel('db_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, (payload) => {
             if(payload.eventType === 'INSERT') setStudents(prev => [...prev, payload.new as Student]);
             if(payload.eventType === 'DELETE') setStudents(prev => prev.filter(s => s.id !== payload.old.id));
             if(payload.eventType === 'UPDATE') setStudents(prev => prev.map(s => s.id === payload.new.id ? (payload.new as Student) : s));
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'parents' }, (payload) => {
             if(payload.eventType === 'INSERT') setParents(prev => [...prev, payload.new as Parent]);
             if(payload.eventType === 'DELETE') setParents(prev => prev.filter(p => p.id !== payload.old.id));
             if(payload.eventType === 'UPDATE') setParents(prev => prev.map(p => p.id === payload.new.id ? (payload.new as Parent) : p));
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'pickups' }, (payload) => {
            if (payload.eventType === 'INSERT') setPickupQueue(prev => [...prev, payload.new as PickupRequest]);
            else if (payload.eventType === 'UPDATE') setPickupQueue(prev => prev.map(item => item.id === payload.new.id ? (payload.new as PickupRequest) : item));
            else if (payload.eventType === 'DELETE') setPickupQueue(prev => prev.filter(item => item.id !== payload.old.id));
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, (payload) => {
            if (payload.eventType === 'INSERT') setSessions(prev => [...prev, payload.new as Session]);
            else if (payload.eventType === 'UPDATE') setSessions(prev => prev.map(item => item.id === payload.new.id ? (payload.new as Session) : item));
            else if (payload.eventType === 'DELETE') setSessions(prev => prev.filter(item => item.id !== payload.old.id));
        })
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
  }, [isConfigured, currentUserRole, refreshData]);

  // --- PERSISTENCE ---
  useEffect(() => {
      if (activeStudentId) localStorage.setItem('activeStudentId', activeStudentId);
      else localStorage.removeItem('activeStudentId');
  }, [activeStudentId]);

  useEffect(() => {
      if (activeParentId) localStorage.setItem('activeParentId', activeParentId);
      else localStorage.removeItem('activeParentId');
  }, [activeParentId]);


  // --- ACTIONS ---

  const loginStudent = useCallback((code: string) => {
    const student = students.find(s => s.accessCode === code);
    if (student) {
      setActiveStudentId(student.id);
      return true;
    }
    return false;
  }, [students]);

  const loginParent = useCallback((code: string) => {
    const student = students.find(s => s.accessCode === code);
    if (student) {
        const parent = parents.find(p => p.studentId === student.id);
        if (parent) {
            setActiveParentId(parent.id);
            return true;
        }
    }
    return false;
  }, [students, parents]);

  const logoutParent = useCallback(() => {
      setActiveParentId(null);
  }, []);

  const updatePickupStatus = useCallback(async (studentId: string, status: PickupStatus) => {
      const existing = pickupQueue.find(p => p.studentId === studentId);
      const supabase = getSupabase();
      if (!supabase) return;
      
      const timestamp = Date.now();
      if (existing) {
          const updates: any = { status, timestamp };
          if (status === 'arrived' && existing.status !== 'arrived') {
              updates.hasAnnounced = false;
          }
          await supabase.from('pickups').update(updates).eq('id', existing.id);
      } else {
          const student = students.find(s => s.id === studentId);
          if (!student) return;
          const newReq = {
              id: `req_${Date.now()}`,
              studentId,
              parentId: student.parentId,
              status,
              timestamp,
              chatHistory: []
          };
          await supabase.from('pickups').insert(newReq);
      }
  }, [pickupQueue, students]);

  const sendMessage = useCallback(async (studentId: string, text: string, sender: 'student' | 'parent') => {
      const existing = pickupQueue.find(p => p.studentId === studentId);
      const supabase = getSupabase();
      if (!supabase) return;

      const newMessage: ChatMessage = {
          id: `m_${Date.now()}`,
          sender,
          text,
          timestamp: Date.now()
      };

      if (existing) {
          const newHistory = [...(existing.chatHistory || []), newMessage];
          await supabase.from('pickups').update({ chatHistory: newHistory }).eq('id', existing.id);
      } else {
          const student = students.find(s => s.id === studentId);
          if (!student) return;
          const newReq = {
              id: `req_${Date.now()}`,
              studentId,
              parentId: student.parentId,
              status: 'scheduled',
              timestamp: Date.now(),
              chatHistory: [newMessage]
          };
          await supabase.from('pickups').insert(newReq);
      }
  }, [pickupQueue, students]);

  const setAnnouncement = useCallback(async (reqId: string, text: string) => {
      const supabase = getSupabase();
      if (supabase) await supabase.from('pickups').update({ aiAnnouncement: text }).eq('id', reqId);
  }, []);

  const setAudioAnnouncement = useCallback(async (reqId: string, audioBase64: string) => {
      const supabase = getSupabase();
      if (supabase) await supabase.from('pickups').update({ audioBase64 }).eq('id', reqId);
  }, []);

  const markAsAnnounced = useCallback(async (reqId: string) => {
      const supabase = getSupabase();
      if (supabase) await supabase.from('pickups').update({ hasAnnounced: true }).eq('id', reqId);
  }, []);

  const addStudent = useCallback(async (studentName: string, parentName: string, classroom: string) => {
        const supabase = getSupabase();
        if (!supabase) return;

        let code = Math.floor(1000 + Math.random() * 9000).toString();
        const sId = `s_${Date.now()}`;
        const pId = `p_${Date.now()}`;

        const newStudent: Student = {
            id: sId,
            name: studentName,
            accessCode: code,
            parentId: pId,
            avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${studentName + code}`,
            classroom
        };

        const newParent: Parent = {
            id: pId,
            name: parentName,
            studentId: sId,
            avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${parentName + code}`
        };

        const { error: e1 } = await supabase.from('students').insert(newStudent);
        const { error: e2 } = await supabase.from('parents').insert(newParent);
        
        if (e1 || e2) {
            console.error("Failed to add family", e1, e2);
            alert("Error adding data. Check console.");
        } else {
            alert(`Added ${studentName} to ${classroom}! Access Code: ${code}`);
        }
  }, []);

  const addSession = useCallback(async (title: string, description: string, imageUrl: string) => {
      const supabase = getSupabase();
      if (!supabase) return;
      
      const newSession = {
          id: `sess_${Date.now()}`,
          title,
          description,
          imageUrl,
          isActive: false,
          endTime: Date.now() + (1000 * 60 * 60 * 2) // 2 hours default
      };
      
      const { error } = await supabase.from('sessions').insert(newSession);
      if(error) console.error("Add session failed", error);
  }, []);

  const activateSession = useCallback(async (sessionId: string) => {
      const supabase = getSupabase();
      if (!supabase) return;

      // Set all to inactive
      await supabase.from('sessions').update({ isActive: false }).neq('id', '0');
      // Set active
      await supabase.from('sessions').update({ isActive: true }).eq('id', sessionId);
  }, []);

  const seedDatabase = useCallback(async () => {
      const supabase = getSupabase();
      if (!supabase) return;
      
      try {
        // Add mocks
        for (const s of MOCK_STUDENTS) {
            await supabase.from('students').upsert(s);
        }
        for (const p of MOCK_PARENTS) {
            await supabase.from('parents').upsert(p);
        }
        // Add default session if none exists
        const { data } = await supabase.from('sessions').select('*').eq('id', DEFAULT_SESSION.id);
        if (!data || data.length === 0) {
            await supabase.from('sessions').insert(DEFAULT_SESSION);
        }

        await refreshData();
        alert("Database seeded successfully!");
      } catch (e) {
          console.error("Seeding failed", e);
          alert("Seeding failed. Check console.");
      }
  }, [refreshData]);

  const resetSystem = useCallback(async () => {
      const supabase = getSupabase();
      if (!supabase) return;
      
      await supabase.from('pickups').delete().neq('id', '0');
      await supabase.from('parents').delete().neq('id', '0');
      await supabase.from('students').delete().neq('id', '0');
      await supabase.from('sessions').delete().neq('id', '0');
      window.location.reload();
  }, []);

  const resetConfiguration = useCallback(() => {
      localStorage.removeItem('supabase_url');
      localStorage.removeItem('supabase_anon_key');
      localStorage.removeItem('gemini_api_key'); // Also clear Gemini key
      setIsConfigured(false);
  }, []);

  return (
    <AppContext.Provider value={{
      isConfigured,
      isMuted,
      geminiApiKey,
      toggleMute,
      updateGeminiApiKey,
      currentUserRole,
      activeStudentId,
      activeParentId,
      students,
      parents,
      pickupQueue,
      sessions,
      currentSession,
      setRole,
      loginStudent,
      loginParent,
      logoutParent,
      updatePickupStatus,
      sendMessage,
      setAnnouncement,
      setAudioAnnouncement,
      markAsAnnounced,
      addStudent,
      addSession,
      activateSession,
      resetSystem,
      seedDatabase,
      checkConfiguration,
      refreshData,
      resetConfiguration
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppStore = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppStore must be used within AppProvider");
  return context;
};
