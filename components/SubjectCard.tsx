import React, { useState, useRef, useEffect } from 'react';
import { Subject, Chapter, Priority } from '../types';
import { SUBJECT_COLORS, PRIORITY_COLORS } from '../constants';

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
  const remainingCount = totalCount - completedCount;
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

  const filterLabels = { 'All': 'ALL CHAPTERS', 'High': 'HIGH ONLY', 'Medium': 'MEDIUM ONLY', 'Low': 'LOW ONLY' };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-visible flex flex-col transition-all hover:shadow-2xl dark:hover:ring-1 dark:hover:ring-slate-700 h-[720px] group/card">
      {/* Subject Header */}
      <div className={`${SUBJECT_COLORS[subject]} p-8 text-white shrink-0 relative overflow-hidden rounded-t-[2.5rem]`}>
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <svg className="w-32 h-32 -mr-8 -mt-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L1 21h22L12 2zm0 3.45l8.1 14.1H3.9L12 5.45z"/>
          </svg>
        </div>
        
        <div className="flex justify-between items-center mb-8 relative z-10">
          <h2 className="text-3xl font-black tracking-tighter">{subject}</h2>
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-md px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-white/10"
          >
            {isEditing ? 'CLOSE EDITOR' : 'MANAGE LIST'}
          </button>
        </div>
        
        <div className="space-y-4 relative z-10">
          <div className="flex justify-between text-[11px] font-black uppercase tracking-[0.25em] opacity-70">
            <span>Progress Status</span>
            <span>{completedCount}/{totalCount} Done</span>
          </div>
          <div className="h-4 w-full bg-black/20 rounded-full overflow-hidden border border-white/10 shadow-inner">
            <div 
              className="h-full bg-white transition-all duration-1000 cubic-bezier(0.4, 0, 0.2, 1) shadow-[0_0_20px_rgba(255,255,255,0.9)]" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between items-end pt-1">
            <span className="text-white/80 text-xs font-black uppercase tracking-widest">
              {remainingCount} Left
            </span>
            <span className="text-5xl font-black leading-none tracking-tighter">{Math.round(progress)}%</span>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-8 flex-1 flex flex-col overflow-hidden relative">
        {isEditing ? (
          <div className="flex flex-col h-full space-y-6">
            <div className="flex justify-between items-center shrink-0">
              <h3 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Editing Mode</h3>
              <button 
                onClick={() => onRestoreDefaults(subject)}
                className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors uppercase bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-800"
              >
                Reset Default
              </button>
            </div>
            
            <form onSubmit={handleAdd} className="space-y-3 shrink-0 p-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-200/50 dark:border-slate-700 shadow-inner">
              <input
                type="text"
                value={newChapterName}
                onChange={(e) => setNewChapterName(e.target.value)}
                placeholder="Chapter Name..."
                className="w-full px-5 py-4 text-sm font-bold border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-slate-900/5 dark:focus:ring-white/5 bg-white dark:bg-slate-800 dark:text-white shadow-sm"
              />
              <div className="flex gap-2">
                <select 
                  value={newChapterPriority}
                  onChange={(e) => setNewChapterPriority(e.target.value as Priority)}
                  className="flex-1 px-5 py-4 text-sm font-bold border border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800 dark:text-white outline-none cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 appearance-none"
                >
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Low">Low Priority</option>
                </select>
                <button 
                  type="submit"
                  className="px-8 py-4 bg-slate-900 dark:bg-slate-700 text-white rounded-2xl text-sm font-black hover:bg-black dark:hover:bg-slate-600 transition-all active:scale-95 shadow-lg shadow-black/10"
                >
                  ADD
                </button>
              </div>
            </form>

            <div className="flex-1 overflow-y-auto pr-3 custom-scrollbar space-y-2">
              {allChapters.map((chapter) => (
                <div key={chapter.name} className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 group shadow-sm hover:border-slate-300 dark:hover:border-slate-500 transition-all">
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{chapter.name}</span>
                    <span className={`text-[9px] uppercase font-black w-fit mt-1 tracking-tighter ${chapter.priority === 'High' ? 'text-rose-500' : chapter.priority === 'Medium' ? 'text-amber-500' : 'text-indigo-500'}`}>
                      {chapter.priority}
                    </span>
                  </div>
                  <button 
                    onClick={() => onDeleteChapter(subject, chapter.name)}
                    className="text-slate-300 hover:text-rose-600 p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-4 mb-8 shrink-0 relative z-30">
              <div className="flex items-center justify-between px-1">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Draw Focus</label>
                <div className="relative" ref={filterRef}>
                    <button 
                        onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                        className="flex items-center gap-3 px-4 py-2 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-slate-200/50 dark:border-slate-700/50 dark:text-slate-200"
                    >
                        {filterLabels[drawFilter]}
                        <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${isFilterDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    {isFilterDropdownOpen && (
                        <div className="absolute top-full right-0 mt-2 bg-white dark:bg-slate-800 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.1)] dark:shadow-none border border-slate-100 dark:border-slate-700 p-1 min-w-[160px] dropdown-animate z-50">
                            {(Object.keys(filterLabels) as (keyof typeof filterLabels)[]).map((key) => (
                                <button
                                    key={key}
                                    onClick={() => { setDrawFilter(key); setIsFilterDropdownOpen(false); }}
                                    className={`w-full text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                                        drawFilter === key ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    {filterLabels[key]}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
              </div>
              
              <button
                onClick={() => onDraw(subject, drawFilter)}
                disabled={remainingCount === 0 || allChapters.length === 0}
                className={`w-full py-6 px-6 rounded-3xl font-black text-xl transition-all shadow-xl active:scale-95 ${
                  remainingCount === 0 || allChapters.length === 0
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed shadow-none' 
                    : `${SUBJECT_COLORS[subject]} text-white hover:brightness-110 shadow-black/10`
                }`}
              >
                {allChapters.length === 0 ? 'EMPTY' : remainingCount === 0 ? 'ALL DONE! 🎉' : `DRAW ${subject.toUpperCase()} 🍀`}
              </button>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden relative z-10">
                <div className="flex justify-between items-center mb-5 px-1 shrink-0">
                    <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em]">Chapter List</h3>
                    <button 
                        onClick={() => onReset(subject)}
                        className="text-[10px] font-black text-slate-300 dark:text-slate-600 hover:text-rose-500 transition-colors uppercase tracking-[0.1em]"
                    >
                        RESET PROGRESS
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar space-y-3 -mr-2">
                    {allChapters.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 opacity-20">
                            <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <p className="text-sm font-black uppercase tracking-widest">No Chapters</p>
                        </div>
                    ) : (
                        allChapters.map((chapter) => {
                            const isCompleted = completed.includes(chapter.name);
                            return (
                                <label 
                                    key={chapter.name}
                                    className={`flex items-center gap-5 p-5 rounded-[1.75rem] border transition-all cursor-pointer select-none group/item ${
                                    isCompleted 
                                        ? 'bg-slate-50 dark:bg-slate-800/30 border-transparent opacity-50' 
                                        : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-slate-800 dark:hover:border-slate-400 hover:shadow-lg dark:hover:shadow-none shadow-sm'
                                    }`}
                                >
                                    <div className={`relative flex items-center justify-center w-7 h-7 rounded-xl border-2 transition-all shrink-0 ${
                                    isCompleted 
                                        ? `border-slate-200 dark:border-slate-700 bg-slate-200 dark:bg-slate-700` 
                                        : `border-slate-200 dark:border-slate-700 group-hover/item:border-slate-800 dark:group-hover/item:border-slate-400`
                                    }`}>
                                    <input
                                        type="checkbox"
                                        className="absolute opacity-0 w-full h-full cursor-pointer"
                                        checked={isCompleted}
                                        onChange={() => onToggleChapter(subject, chapter.name)}
                                    />
                                    {isCompleted && (
                                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                    <div className={`text-[15px] font-extrabold transition-all truncate leading-tight ${isCompleted ? 'line-through text-slate-400 dark:text-slate-600' : 'text-slate-900 dark:text-slate-100'}`}>
                                        {chapter.name}
                                    </div>
                                    {!isCompleted && (
                                        <span className={`text-[9px] font-black uppercase tracking-widest mt-1.5 inline-block px-2 py-0.5 rounded-md ${chapter.priority === 'High' ? 'text-rose-600 bg-rose-50 dark:bg-rose-900/20' : chapter.priority === 'Medium' ? 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' : 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'}`}>
                                        {chapter.priority}
                                        </span>
                                    )}
                                    </div>
                                </label>
                            );
                        })
                    )}
                </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SubjectCard;