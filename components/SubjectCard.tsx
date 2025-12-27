import React, { useState, useRef, useEffect } from 'react';
import { Subject, Chapter, Priority } from '../types';
import { SUBJECT_COLORS } from '../constants';

interface SubjectCardProps {
  subject: Subject;
  allChapters: Chapter[];
  completed: string[];
  onDraw: (subject: Subject, filter?: Priority | 'All') => void;
  onToggleChapter: (subject: Subject, chapterName: string) => void;
  onReset: (subject: Subject) => void;
  onAddChapter: (subject: Subject, chapter: Chapter) => void;
  onDeleteChapter: (subject: Subject, chapterName: string) => void;
  onRestoreDefaults: (subject: Subject) => void;
}

const SubjectCard: React.FC<SubjectCardProps> = ({
  subject,
  allChapters,
  completed,
  onDraw,
  onToggleChapter,
  onReset,
  onAddChapter,
  onDeleteChapter,
  onRestoreDefaults
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newChapterName, setNewChapterName] = useState('');
  const [newChapterPriority, setNewChapterPriority] = useState<Priority>('Medium');
  const [drawFilter, setDrawFilter] = useState<Priority | 'All'>('All');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  
  const totalCount = allChapters.length;
  const completedCount = completed.filter(name => allChapters.some(c => c.name === name)).length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newChapterName.trim()) {
      onAddChapter(subject, { name: newChapterName.trim(), priority: newChapterPriority });
      setNewChapterName('');
    }
  };

  const filterLabels = { 'All': 'ALL', 'High': 'HIGH', 'Medium': 'MEDIUM', 'Low': 'LOW' };

  return (
    <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-100 border border-slate-100 overflow-visible flex flex-col transition-all h-[680px] md:h-[740px]">
      {/* Header */}
      <div className={`${SUBJECT_COLORS[subject]} p-6 md:p-8 text-white rounded-t-[2rem] shrink-0 relative overflow-hidden`}>
        <div className="flex justify-between items-start mb-6 relative z-10">
          <div>
            <h2 className="text-3xl font-black tracking-tighter uppercase leading-none mb-1">{subject}</h2>
            <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">{totalCount} Total Chapters</p>
          </div>
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className="bg-white/10 hover:bg-white/20 active-scale backdrop-blur-md px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/10"
          >
            {isEditing ? 'Close' : 'Edit'}
          </button>
        </div>
        
        <div className="space-y-3 relative z-10">
          <div className="h-3 w-full bg-black/10 rounded-full overflow-hidden border border-white/10">
            <div 
              className="h-full bg-white transition-all duration-700 ease-out" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between items-center">
             <span className="text-[10px] font-black uppercase tracking-widest text-white/70">{completedCount} Done</span>
             <span className="text-3xl font-black">{Math.round(progress)}%</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 md:p-8 flex-1 flex flex-col overflow-hidden relative">
        {isEditing ? (
          <div className="flex flex-col h-full gap-6">
            <form onSubmit={handleAdd} className="space-y-2">
              <input
                type="text"
                value={newChapterName}
                onChange={(e) => setNewChapterName(e.target.value)}
                placeholder="New Chapter..."
                className="w-full h-12 px-4 text-sm font-bold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/5"
              />
              <div className="flex gap-2">
                <select 
                  value={newChapterPriority}
                  onChange={(e) => setNewChapterPriority(e.target.value as Priority)}
                  className="flex-1 h-12 px-4 text-xs font-black border border-slate-200 rounded-xl bg-slate-50 uppercase tracking-widest outline-none"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
                <button type="submit" className="px-6 h-12 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest active-scale">Add</button>
              </div>
              <button 
                type="button"
                onClick={() => onRestoreDefaults(subject)}
                className="w-full text-center text-[10px] font-black text-indigo-600 uppercase pt-2"
              >
                Restore Defaults
              </button>
            </form>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2">
              {allChapters.map((chapter) => (
                <div key={chapter.name} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs font-bold text-slate-800 truncate">{chapter.name}</span>
                  <button onClick={() => onDeleteChapter(subject, chapter.name)} className="p-2 text-slate-300 hover:text-rose-500">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3 mb-8" ref={filterRef}>
              <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                <span>Quick Draw Focus</span>
                <div className="relative">
                    <button 
                        onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                        className="flex items-center gap-2 hover:text-indigo-600 transition-colors"
                    >
                        {filterLabels[drawFilter]}
                        <svg className={`w-3 h-3 transition-transform ${isFilterDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    {isFilterDropdownOpen && (
                        <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-100 p-1 min-w-[120px] z-[60] animate-slide-up">
                            {Object.keys(filterLabels).map((key) => (
                                <button
                                    key={key}
                                    onClick={() => { setDrawFilter(key as Priority | 'All'); setIsFilterDropdownOpen(false); }}
                                    className={`w-full text-left px-3 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                                        drawFilter === key ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50 text-slate-500'
                                    }`}
                                >
                                    {filterLabels[key as Priority | 'All']}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
              </div>
              
              <button
                onClick={() => onDraw(subject, drawFilter)}
                disabled={totalCount - completedCount === 0}
                className={`w-full h-16 rounded-2xl font-black text-base uppercase tracking-widest transition-all active-scale shadow-lg ${
                  totalCount - completedCount === 0
                    ? 'bg-slate-100 text-slate-300 shadow-none' 
                    : `${SUBJECT_COLORS[subject]} text-white shadow-indigo-100`
                }`}
              >
                Draw One 🍀
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-3 custom-scrollbar space-y-3">
              {allChapters.map((chapter) => {
                const isCompleted = completed.includes(chapter.name);
                return (
                  <label key={chapter.name} className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                    isCompleted ? 'bg-slate-50 border-transparent opacity-40' : 'bg-white border-slate-50 hover:border-slate-900 active-scale'
                  }`}>
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
                      isCompleted ? 'bg-slate-300 border-slate-300' : 'border-slate-200'
                    }`}>
                      <input type="checkbox" className="hidden" checked={isCompleted} onChange={() => onToggleChapter(subject, chapter.name)} />
                      {isCompleted && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] font-black tracking-tight leading-tight truncate ${isCompleted ? 'line-through text-slate-400' : 'text-slate-900'}`}>{chapter.name}</p>
                      {!isCompleted && <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${chapter.priority === 'High' ? 'text-rose-500' : chapter.priority === 'Medium' ? 'text-amber-500' : 'text-blue-500'}`}>{chapter.priority}</span>}
                    </div>
                  </label>
                );
              })}
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-50 flex justify-center">
               <button onClick={() => onReset(subject)} className="text-[9px] font-black text-slate-300 hover:text-rose-500 uppercase tracking-widest">Reset All</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SubjectCard;