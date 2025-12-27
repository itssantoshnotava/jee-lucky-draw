import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Subject, AppState, Chapter, Priority } from './types';
import { PREDEFINED_CHAPTERS } from './constants';
import SubjectCard from './components/SubjectCard';
import LuckyDrawModal from './components/LuckyDrawModal';

const STORAGE_KEY = 'jee_lucky_draw_state_mobile_v1';

type DrawSource = { type: 'subject'; subject: Subject; filter: Priority | 'All' } | { type: 'pcm'; filter: Priority | 'All' };

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
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

  const [activeDraw, setActiveDraw] = useState<{ subject: Subject; chapter: Chapter; source: DrawSource } | null>(null);
  const [pcmDrawFilter, setPcmDrawFilter] = useState<Priority | 'All'>('All');
  const [isPcmDropdownOpen, setIsPcmDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsPcmDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      alert(`No matching chapters found across PCM.`);
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
    <div className="min-h-screen bg-[#FDFDFF] text-slate-900 pb-12 overflow-x-hidden">
      {/* Dynamic Header */}
      <header className="bg-white/70 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-50 px-4 md:px-8 h-16 md:h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
             <span className="text-white font-black text-xl italic">J</span>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-black tracking-tighter uppercase">JEE Lucky Draw</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Aspirant Tool</p>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-[11px] md:text-xs font-black text-slate-600 uppercase tracking-wider">
              {totals.done}/{totals.total} <span className="hidden sm:inline">COMPLETED</span> ({totals.percent}%)
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 pt-6 md:pt-10">
        
        {/* PCM Draw Hero - Optimized for Mobile */}
        <section className="mb-10 md:mb-16">
          <div className="bg-slate-900 rounded-[2rem] md:rounded-[3rem] p-6 md:p-12 text-white relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8 shadow-2xl shadow-slate-200">
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500 rounded-full blur-[120px]" />
              <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-violet-600 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 text-center lg:text-left">
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-black mb-4 tracking-tighter leading-none">
                Total Syllabus <span className="text-indigo-400">Draw</span>
              </h2>
              <p className="text-slate-400 max-w-md mx-auto lg:mx-0 text-sm md:text-base font-medium leading-relaxed">
                Need to start somewhere? Let the system pick a random chapter from all three subjects based on your current focus.
              </p>
            </div>

            <div className="relative z-20 w-full lg:w-auto flex flex-col sm:flex-row gap-3 md:gap-4" ref={dropdownRef}>
              {/* Refined Dropdown Trigger */}
              <div className="relative flex-1 sm:min-w-[240px]">
                <button 
                  onClick={() => setIsPcmDropdownOpen(!isPcmDropdownOpen)}
                  className="w-full h-14 md:h-16 px-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-between transition-all group active-scale"
                >
                  <div className="flex flex-col items-start">
                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">Focus</span>
                    <span className="text-sm font-bold uppercase tracking-wide">{filterLabels[pcmDrawFilter]}</span>
                  </div>
                  <svg className={`w-5 h-5 text-white/50 transition-transform ${isPcmDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* The "Safe" Dropdown - Higher Z-index, explicit positioning */}
                {isPcmDropdownOpen && (
                  <div className="absolute top-[110%] left-0 right-0 bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-100 p-1.5 z-[100] animate-slide-up origin-top">
                    {(Object.keys(filterLabels) as (keyof typeof filterLabels)[]).map((key) => (
                      <button
                        key={key}
                        onClick={() => { setPcmDrawFilter(key); handleDrawPCM(key); }}
                        className={`w-full text-left px-4 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all mb-1 last:mb-0 ${
                          pcmDrawFilter === key 
                          ? 'bg-indigo-600 text-white' 
                          : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {filterLabels[key]}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button 
                onClick={() => handleDrawPCM(pcmDrawFilter)}
                className="h-14 md:h-16 px-10 bg-white text-slate-900 rounded-2xl font-black text-base md:text-lg hover:bg-indigo-50 transition-all active-scale shadow-xl shadow-black/20 flex items-center justify-center gap-2 whitespace-nowrap"
              >
                Roll Dice 🎲
              </button>
            </div>
          </div>
        </section>

        {/* Subject Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
          {(['Physics', 'Mathematics', 'Chemistry'] as Subject[]).map(subject => (
            <SubjectCard
              key={subject}
              subject={subject}
              allChapters={state.allChapters[subject] || []}
              completed={state.completedChapters[subject] || []}
              onDraw={handleDrawSubject}
              onToggleChapter={toggleChapter}
              onReset={(s) => {
                if(window.confirm(`Reset all progress for ${s}?`)) {
                    setState(prev => ({ ...prev, completedChapters: { ...prev.completedChapters, [s]: [] } }));
                }
              }}
              onAddChapter={(s, ch) => {
                  setState(prev => {
                      if (prev.allChapters[s].some(c => c.name === ch.name)) return prev;
                      return { ...prev, allChapters: { ...prev.allChapters, [s]: [...prev.allChapters[s], ch] } };
                  });
              }}
              onDeleteChapter={(s, name) => {
                  setState(prev => ({
                    ...prev,
                    allChapters: { ...prev.allChapters, [s]: prev.allChapters[s].filter(c => c.name !== name) },
                    completedChapters: { ...prev.completedChapters, [s]: prev.completedChapters[s].filter(c => c !== name) }
                  }));
              }}
              onRestoreDefaults={(s) => {
                  if(window.confirm(`Restore default chapter list for ${s}?`)) {
                      setState(prev => ({ ...prev, allChapters: { ...prev.allChapters, [s]: [...PREDEFINED_CHAPTERS[s]] } }));
                  }
              }}
            />
          ))}
        </div>
      </main>

      <footer className="mt-20 px-4 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
          </svg>
          Local Sync Enabled
        </div>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Persistence is the key to success</p>
        <h3 className="mt-4 font-black text-slate-800 text-3xl tracking-tighter italic">PADHAI KARLE BKL!</h3>
      </footer>

      {activeDraw && (
        <LuckyDrawModal
          subject={activeDraw.subject}
          chapter={activeDraw.chapter}
          onClose={() => setActiveDraw(null)}
          onComplete={() => {
              toggleChapter(activeDraw.subject, activeDraw.chapter.name);
              setActiveDraw(null);
          }}
          onRedraw={() => {
              activeDraw.source.type === 'subject' 
                ? handleDrawSubject(activeDraw.source.subject, activeDraw.source.filter)
                : handleDrawPCM(activeDraw.source.filter);
          }}
        />
      )}
    </div>
  );
};

export default App;