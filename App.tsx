import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Subject, AppState, Chapter, Priority } from './types';
import { PREDEFINED_CHAPTERS } from './constants';
import SubjectCard from './components/SubjectCard';
import LuckyDrawModal from './components/LuckyDrawModal';

const STORAGE_KEY = 'jee_lucky_draw_state_v4_final';
const THEME_KEY = 'jee_lucky_draw_theme';

type DrawSource = { type: 'subject'; subject: Subject; filter: Priority | 'All' } | { type: 'pcm'; filter: Priority | 'All' };

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const subjects: Subject[] = ['Physics', 'Mathematics', 'Chemistry'];
        const allChapters: Record<Subject, Chapter[]> = { 
          Physics: [...PREDEFINED_CHAPTERS.Physics], 
          Mathematics: [...PREDEFINED_CHAPTERS.Mathematics], 
          Chemistry: [...PREDEFINED_CHAPTERS.Chemistry] 
        };
        const completedChapters: Record<Subject, string[]> = { Physics: [], Mathematics: [], Chemistry: [] };

        subjects.forEach(s => {
          if (parsed.allChapters && Array.isArray(parsed.allChapters[s])) {
            allChapters[s] = parsed.allChapters[s].map((item: any) => 
              typeof item === 'string' ? { name: item, priority: 'Medium' } : item
            );
          }
          if (parsed.completedChapters && Array.isArray(parsed.completedChapters[s])) {
            completedChapters[s] = parsed.completedChapters[s];
          }
        });

        return { allChapters, completedChapters };
      } catch (e) {
        console.error("Error parsing saved state", e);
      }
    }
    return {
      completedChapters: { Physics: [], Mathematics: [], Chemistry: [] },
      allChapters: {
        Physics: [...PREDEFINED_CHAPTERS.Physics],
        Mathematics: [...PREDEFINED_CHAPTERS.Mathematics],
        Chemistry: [...PREDEFINED_CHAPTERS.Chemistry]
      }
    };
  });

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) return saved as 'light' | 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [activeDraw, setActiveDraw] = useState<{ subject: Subject; chapter: Chapter; source: DrawSource } | null>(null);
  const [pcmDrawFilter, setPcmDrawFilter] = useState<Priority | 'All'>('All');
  const [isPcmDropdownOpen, setIsPcmDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsPcmDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const toggleChapter = useCallback((subject: Subject, chapterName: string) => {
    setState(prev => {
      const isCompleted = prev.completedChapters[subject].includes(chapterName);
      const updated = isCompleted
        ? prev.completedChapters[subject].filter(c => c !== chapterName)
        : [...prev.completedChapters[subject], chapterName];
      return { ...prev, completedChapters: { ...prev.completedChapters, [subject]: updated } };
    });
  }, []);

  const resetSubjectProgress = useCallback((subject: Subject) => {
    if (window.confirm(`Reset progress for ${subject}?`)) {
      setState(prev => ({ ...prev, completedChapters: { ...prev.completedChapters, [subject]: [] } }));
    }
  }, []);

  const addChapter = useCallback((subject: Subject, chapter: Chapter) => {
    setState(prev => {
      if (prev.allChapters[subject].some(c => c.name === chapter.name)) {
        alert("Already exists!");
        return prev;
      }
      return { ...prev, allChapters: { ...prev.allChapters, [subject]: [...prev.allChapters[subject], chapter] } };
    });
  }, []);

  const deleteChapter = useCallback((subject: Subject, chapterName: string) => {
    setState(prev => ({
      ...prev,
      allChapters: { ...prev.allChapters, [subject]: prev.allChapters[subject].filter(c => c.name !== chapterName) },
      completedChapters: { ...prev.completedChapters, [subject]: prev.completedChapters[subject].filter(c => c !== chapterName) }
    }));
  }, []);

  const restoreDefaults = useCallback((subject: Subject) => {
    if (window.confirm(`Restore ${subject} list?`)) {
      setState(prev => ({ ...prev, allChapters: { ...prev.allChapters, [subject]: [...PREDEFINED_CHAPTERS[subject]] } }));
    }
  }, []);

  const handleDrawSubject = useCallback((subject: Subject, filterPriority: Priority | 'All' = 'All') => {
    const all = state.allChapters[subject] || [];
    const completed = state.completedChapters[subject] || [];
    let remaining = all.filter(c => !completed.includes(c.name));
    if (filterPriority !== 'All') remaining = remaining.filter(c => c.priority === filterPriority);
    if (remaining.length === 0) {
      alert(`No remaining ${filterPriority !== 'All' ? filterPriority : ''} chapters.`);
      return;
    }
    const randomIndex = Math.floor(Math.random() * remaining.length);
    setActiveDraw({ subject, chapter: remaining[randomIndex], source: { type: 'subject', subject, filter: filterPriority } });
  }, [state]);

  const handleDrawPCM = useCallback((filter: Priority | 'All' = 'All') => {
    const subjects: Subject[] = ['Physics', 'Mathematics', 'Chemistry'];
    let pool: { subject: Subject, chapter: Chapter }[] = [];
    subjects.forEach(s => {
      const remaining = state.allChapters[s].filter(c => !state.completedChapters[s].includes(c.name));
      remaining.forEach(c => {
        if (filter === 'All' || c.priority === filter) pool.push({ subject: s, chapter: c });
      });
    });
    if (pool.length === 0) {
      alert(`No matching chapters found.`);
      return;
    }
    const randomIndex = Math.floor(Math.random() * pool.length);
    setActiveDraw({ ...pool[randomIndex], source: { type: 'pcm', filter } });
    setIsPcmDropdownOpen(false);
  }, [state]);

  const handleRedraw = useCallback(() => {
    if (!activeDraw) return;
    activeDraw.source.type === 'subject' ? handleDrawSubject(activeDraw.source.subject, activeDraw.source.filter) : handleDrawPCM(activeDraw.source.filter);
  }, [activeDraw, handleDrawSubject, handleDrawPCM]);

  const handleCompleteFromDraw = useCallback(() => {
    if (!activeDraw) return;
    toggleChapter(activeDraw.subject, activeDraw.chapter.name);
    setActiveDraw(null);
  }, [activeDraw, toggleChapter]);

  const totals = useMemo(() => {
    let total = 0, done = 0;
    (['Physics', 'Mathematics', 'Chemistry'] as Subject[]).forEach(s => {
      total += (state.allChapters[s] || []).length;
      done += (state.completedChapters[s] || []).length;
    });
    return { total, done, percent: total > 0 ? Math.round((done / total) * 100) : 0 };
  }, [state]);

  const filterLabels = { 'All': 'EVERYTHING', 'High': 'HIGH ONLY', 'Medium': 'MEDIUM ONLY', 'Low': 'LOW ONLY' };

  return (
    <div className="min-h-screen pb-20 selection:bg-indigo-100 dark:selection:bg-indigo-900 transition-colors duration-300">
      <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 sticky top-0 z-[100] transition-all">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <span className="text-white font-black text-xl italic">J</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">JEE Lucky Draw</h1>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Study Focus Tool</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* REDESIGNED: Premium Animated Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="relative w-11 h-11 flex items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-white dark:hover:bg-slate-700 transition-all duration-300 active:scale-90 group overflow-hidden"
              aria-label="Toggle Theme"
            >
              <div className="relative w-6 h-6">
                {/* Sun Icon (Slides in/out) */}
                <svg 
                  className={`absolute inset-0 w-6 h-6 transform transition-all duration-500 ease-out ${theme === 'dark' ? 'translate-y-8 opacity-0 scale-50' : 'translate-y-0 opacity-100 scale-100'}`} 
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 9h-1m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
                {/* Moon Icon (Slides in/out) */}
                <svg 
                  className={`absolute inset-0 w-6 h-6 transform transition-all duration-500 ease-out ${theme === 'light' ? '-translate-y-8 opacity-0 scale-50' : 'translate-y-0 opacity-100 scale-100'}`} 
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              </div>
            </button>

            <div className="flex items-center gap-3 bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-[10px] md:text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-200">
                {totals.done}/{totals.total} <span className="hidden md:inline">SYLLABUS</span> ({totals.percent}%)
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-8 md:mt-12">
        {/* Total Syllabus Draw Section */}
        <section className="mb-14 relative">
          <div className="bg-slate-900 dark:bg-slate-900/40 rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-14 text-white relative z-10 border border-white/5 shadow-2xl overflow-visible">
            
            <div className="absolute inset-0 rounded-[2.5rem] md:rounded-[4rem] overflow-hidden pointer-events-none z-0">
               <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/20 rounded-full blur-[120px]" />
               <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-transparent opacity-95" />
            </div>

            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
              <div className="text-center lg:text-left">
                <h2 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter leading-tight">Total Syllabus <span className="text-indigo-400 italic">Draw</span></h2>
                <p className="text-slate-400 max-w-md mx-auto lg:mx-0 text-base md:text-lg font-medium">
                  Pick a random chapter from all three subjects combined using your chosen priority filter.
                </p>
              </div>

              <div className="w-full lg:w-auto flex flex-col sm:flex-row items-stretch gap-4 bg-black/40 p-4 rounded-[2.5rem] backdrop-blur-2xl border border-white/10 shadow-inner" ref={dropdownRef}>
                <div className="relative flex-1 sm:min-w-[260px]">
                  <button 
                    onClick={() => setIsPcmDropdownOpen(!isPcmDropdownOpen)}
                    className={`flex items-center justify-between w-full h-16 px-6 bg-white/5 hover:bg-white/10 transition-all rounded-2xl border active:scale-95 ${isPcmDropdownOpen ? 'border-indigo-400 ring-4 ring-indigo-500/20' : 'border-white/10'}`}
                  >
                    <div className="flex flex-col items-start">
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 leading-none mb-1.5">Priority Filter:</span>
                      <span className="text-sm font-black uppercase tracking-wider">{filterLabels[pcmDrawFilter]}</span>
                    </div>
                    <svg className={`w-5 h-5 text-white/60 transition-transform duration-300 ${isPcmDropdownOpen ? 'rotate-180 text-white' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* High visibility opaque dropdown */}
                  {isPcmDropdownOpen && (
                    <div className="absolute top-[calc(100%+12px)] left-0 right-0 bg-white dark:bg-slate-800 rounded-2xl shadow-[0_30px_90px_rgba(0,0,0,0.5)] z-[200] dropdown-animate border border-slate-200 dark:border-slate-700 p-2 ring-1 ring-black/5">
                      {(Object.keys(filterLabels) as (keyof typeof filterLabels)[]).map((key) => (
                        <button
                          key={key}
                          onClick={() => { setPcmDrawFilter(key); setIsPcmDropdownOpen(false); }}
                          className={`w-full text-left px-4 py-4 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all mb-1 last:mb-0 flex items-center justify-between ${
                              pcmDrawFilter === key 
                              ? 'text-white bg-indigo-600 shadow-lg' 
                              : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          {filterLabels[key]}
                          {pcmDrawFilter === key && <div className="w-2.5 h-2.5 rounded-full bg-white shadow-sm" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => handleDrawPCM(pcmDrawFilter)}
                  className="bg-white hover:bg-slate-100 text-indigo-700 px-10 h-16 rounded-2xl font-black text-lg shadow-xl shadow-black/20 hover:-translate-y-0.5 transition-all active:scale-95 flex items-center justify-center gap-3 whitespace-nowrap"
                >
                  Draw Now 🍀
                </button>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
          {(['Physics', 'Mathematics', 'Chemistry'] as Subject[]).map(subject => (
            <SubjectCard
              key={subject}
              subject={subject}
              allChapters={state.allChapters[subject] || []}
              completed={state.completedChapters[subject] || []}
              onDraw={handleDrawSubject}
              onToggleChapter={toggleChapter}
              onReset={resetSubjectProgress}
              onAddChapter={addChapter}
              onDeleteChapter={deleteChapter}
              onRestoreDefaults={restoreDefaults}
            />
          ))}
        </div>
      </main>

      <footer className="mt-24 px-4 text-center">
        <h3 className="font-black text-slate-800 dark:text-white text-4xl md:text-5xl tracking-tighter italic mb-2">PADHAI KARLE BKL!</h3>
        <p className="text-slate-400 dark:text-slate-600 font-bold text-[10px] uppercase tracking-[0.3em]">Consistency is the secret weapon</p>
      </footer>

      {activeDraw && (
        <LuckyDrawModal
          subject={activeDraw.subject}
          chapter={activeDraw.chapter}
          onClose={() => setActiveDraw(null)}
          onComplete={handleCompleteFromDraw}
          onRedraw={handleRedraw}
        />
      )}
    </div>
  );
};

export default App;