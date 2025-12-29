import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Subject, AppState, Chapter, Priority } from './types';
import { PREDEFINED_CHAPTERS } from './constants';
import SubjectCard from './components/SubjectCard';
import LuckyDrawModal from './components/LuckyDrawModal';

const STORAGE_KEY = 'jee_lucky_draw_state_v3';
const THEME_KEY = 'jee_lucky_draw_theme_v3';

type DrawSource = { type: 'subject'; subject: Subject; filter: Priority | 'All' } | { type: 'pcm'; filter: Priority | 'All' };

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing state", e);
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
    const savedTheme = localStorage.getItem(THEME_KEY);
    return (savedTheme as 'light' | 'dark') || 'light';
  });

  const [activeDraw, setActiveDraw] = useState<{ subject: Subject; chapter: Chapter; source: DrawSource } | null>(null);
  const [pcmDrawFilter, setPcmDrawFilter] = useState<Priority | 'All'>('All');
  const [isPcmDropdownOpen, setIsPcmDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Handle Theme Switching Robustly
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

  const handleDrawSubject = useCallback((subject: Subject, filterPriority: Priority | 'All' = 'All') => {
    const all = state.allChapters[subject] || [];
    const completed = state.completedChapters[subject] || [];
    let remaining = all.filter(c => !completed.includes(c.name));
    if (filterPriority !== 'All') remaining = remaining.filter(c => c.priority === filterPriority);
    
    if (remaining.length === 0) {
      alert(`No remaining ${filterPriority !== 'All' ? filterPriority : ''} chapters in ${subject}.`);
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

  const totals = useMemo(() => {
    let total = 0, done = 0;
    (['Physics', 'Mathematics', 'Chemistry'] as Subject[]).forEach(s => {
      total += (state.allChapters[s] || []).length;
      done += (state.completedChapters[s] || []).length;
    });
    return { total, done, percent: total > 0 ? Math.round((done / total) * 100) : 0 };
  }, [state]);

  const filterLabels = { 'All': 'EVERYTHING', 'High': 'HIGH PRIORITY', 'Medium': 'MEDIUM PRIORITY', 'Low': 'LOW PRIORITY' };

  return (
    <div className="min-h-screen bg-[#FDFDFF] dark:bg-[#020617] text-slate-900 dark:text-slate-100 pb-20 transition-all duration-500">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 sticky top-0 z-[100] px-4 md:px-8 h-16 md:h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
             <span className="text-white font-black text-xl italic">J</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-base md:text-lg font-black tracking-tighter uppercase leading-none mb-0.5">JEE Lucky Draw</h1>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em]">Aspirant Tool</p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <button 
            onClick={toggleTheme}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-white dark:hover:bg-slate-800 transition-all active-scale"
            aria-label="Toggle Theme"
          >
            {theme === 'light' ? (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
            )}
          </button>
          
          <div className="bg-slate-100 dark:bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2 shadow-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-[10px] md:text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
              {totals.done}/{totals.total} <span className="hidden sm:inline">COMPLETE</span> ({totals.percent}%)
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 pt-6 md:pt-10">
        
        {/* PCM Hero */}
        <section className="mb-12 relative">
          <div className="bg-slate-900 dark:bg-slate-900/40 rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-14 text-white relative z-[50] border border-white/5 dark:border-white/10 shadow-2xl overflow-visible">
            
            <div className="absolute inset-0 rounded-[2.5rem] md:rounded-[4rem] overflow-hidden pointer-events-none z-0">
              <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/20 rounded-full blur-[120px]" />
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-transparent opacity-90" />
            </div>

            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
              <div className="text-center lg:text-left">
                <h2 className="text-4xl md:text-7xl font-black mb-4 tracking-tighter leading-none">
                  Total Syllabus <span className="text-indigo-400">Draw</span>
                </h2>
                <p className="text-slate-400 max-w-md mx-auto lg:mx-0 text-base md:text-lg">
                  Pick a random chapter from all PCM subjects based on your priority.
                </p>
              </div>

              <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-4 bg-black/20 p-4 rounded-[2.5rem] border border-white/10 backdrop-blur-xl relative" ref={dropdownRef}>
                <div className="relative flex-1 sm:min-w-[280px]">
                  <button 
                    onClick={() => setIsPcmDropdownOpen(!isPcmDropdownOpen)}
                    className={`w-full h-16 px-6 bg-white/5 hover:bg-white/10 border transition-all rounded-2xl flex items-center justify-between active-scale ${isPcmDropdownOpen ? 'border-indigo-400 bg-white/10' : 'border-white/10'}`}
                  >
                    <div className="text-left">
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1.5">Focus priority</p>
                      <p className="text-sm font-bold uppercase tracking-wider">{filterLabels[pcmDrawFilter]}</p>
                    </div>
                    <svg className={`w-5 h-5 text-white/40 transition-transform ${isPcmDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isPcmDropdownOpen && (
                    <div className="absolute top-[calc(100%+12px)] left-0 right-0 bg-white dark:bg-slate-800 rounded-2xl shadow-[0_25px_80px_rgba(0,0,0,0.6)] border border-slate-200 dark:border-slate-700 p-2 z-[999] animate-dropdown">
                      {(Object.keys(filterLabels) as (keyof typeof filterLabels)[]).map((key) => (
                        <button
                          key={key}
                          onClick={() => { setPcmDrawFilter(key); setIsPcmDropdownOpen(false); }}
                          className={`w-full text-left px-4 py-4 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all mb-1 last:mb-0 flex items-center justify-between ${
                            pcmDrawFilter === key 
                            ? 'bg-indigo-600 text-white shadow-lg' 
                            : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {filterLabels[key]}
                          {pcmDrawFilter === key && <div className="w-2 h-2 rounded-full bg-white shadow-sm" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => handleDrawPCM(pcmDrawFilter)}
                  className="h-16 px-10 bg-indigo-500 hover:bg-indigo-400 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-500/20 active-scale transition-all whitespace-nowrap"
                >
                  Draw from PCM 🍀
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
          {(['Physics', 'Mathematics', 'Chemistry'] as Subject[]).map(subject => (
            <SubjectCard
              key={subject}
              subject={subject}
              allChapters={state.allChapters[subject] || []}
              completed={state.completedChapters[subject] || []}
              onDraw={handleDrawSubject}
              onToggleChapter={toggleChapter}
              onReset={(s) => { if(confirm(`Reset ${s}?`)) setState(p => ({ ...p, completedChapters: { ...p.completedChapters, [s]: [] } })) }}
              onAddChapter={(s, ch) => setState(p => ({ ...p, allChapters: { ...p.allChapters, [s]: [...p.allChapters[s], ch] } }))}
              onDeleteChapter={(s, n) => setState(p => ({
                ...p,
                allChapters: { ...p.allChapters, [s]: p.allChapters[s].filter(c => c.name !== n) },
                completedChapters: { ...p.completedChapters, [s]: p.completedChapters[s].filter(c => c !== n) }
              }))}
              onRestoreDefaults={(s) => { if(confirm(`Restore ${s}?`)) setState(p => ({ ...p, allChapters: { ...p.allChapters, [s]: [...PREDEFINED_CHAPTERS[s]] } })) }}
            />
          ))}
        </div>
      </main>

      <footer className="mt-24 px-4 text-center">
        <h3 className="font-black text-slate-800 dark:text-white text-5xl tracking-tighter italic mb-2">PADHAI KARLE BKL!</h3>
        <p className="text-slate-400 dark:text-slate-600 font-bold text-[10px] uppercase tracking-[0.3em]">Consistency is the secret weapon</p>
      </footer>

      {activeDraw && (
        <LuckyDrawModal
          subject={activeDraw.subject}
          chapter={activeDraw.chapter}
          onClose={() => setActiveDraw(null)}
          onComplete={() => { toggleChapter(activeDraw.subject, activeDraw.chapter.name); setActiveDraw(null); }}
          onRedraw={() => { activeDraw.source.type === 'subject' ? handleDrawSubject(activeDraw.source.subject, activeDraw.source.filter) : handleDrawPCM(activeDraw.source.filter); }}
        />
      )}
    </div>
  );
};

export default App;