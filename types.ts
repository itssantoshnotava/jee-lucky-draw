
export type Subject = 'Physics' | 'Mathematics' | 'Chemistry';
export type Priority = 'High' | 'Medium' | 'Low';

export interface Chapter {
  name: string;
  priority: Priority;
}

export interface AppState {
  completedChapters: Record<Subject, string[]>;
  allChapters: Record<Subject, Chapter[]>;
}
