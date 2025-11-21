
export type UserRole = 'parent' | 'student' | 'instructor' | 'admin';

export type PickupStatus = 'scheduled' | 'on_way' | 'arrived' | 'dismissed';

export type Classroom = 'Salle 1' | 'Salle 2' | 'Salle DIY';

export interface Student {
  id: string;
  name: string;
  accessCode: string;
  parentId: string;
  avatarUrl: string;
  classroom: string; // Defaults to 'Salle 1'
}

export interface Parent {
  id: string;
  name: string;
  studentId: string;
  avatarUrl: string;
}

export interface ChatMessage {
  id: string;
  sender: 'student' | 'parent';
  text: string;
  timestamp: number;
}

export interface PickupRequest {
  id: string;
  studentId: string;
  parentId: string;
  status: PickupStatus;
  chatHistory: ChatMessage[];
  timestamp: number;
  aiAnnouncement?: string; // Generated text
  audioBase64?: string; // Cached audio data
  hasAnnounced?: boolean; // Track if audio has played automatically
}

export interface Session {
  id: string;
  title: string;
  description: string;
  endTime: number;
  imageUrl: string;
  isActive: boolean;
}