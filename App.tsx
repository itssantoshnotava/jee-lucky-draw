
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Subject, AppState, Chapter, Priority } from './types';
import { PREDEFINED_CHAPTERS } from './constants';
import SubjectCard from './components/SubjectCard';
import LuckyDrawModal from './components/LuckyDrawModal';

const STORAGE_KEY = 'jee_lucky_draw_state_v4_final';

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

  const [activeDraw, setActiveDraw] = useState<{ subject: Subject; chapter: Chapter; source: DrawSource } | null>(null);
  const [pcmDrawFilter, setPcmDrawFilter] = useState<Priority | 'All'>('All');
  const [isPcmDropdownOpen, setIsPcmDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

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
    <div className="min-h-screen pb-20 selection:bg-indigo-100">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 transition-all">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-200">
              <span className="text-white font-black text-lg">J</span>
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">JEE Lucky Draw</h1>
          </div>
          <div className="flex items-center gap-2 text-sm font-bold text-slate-600 bg-slate-100/80 px-4 py-2 rounded-full border border-slate-200">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
            Total Syllabus Progress: {totals.done}/{totals.total} ({totals.percent}%)
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-10 md:mt-14">
        {/* Total Syllabus Draw Section */}
        <section className="mb-14 relative group">
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-indigo-200 flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
            {/* Background Blobs Layer */}
            <div className="absolute inset-0 overflow-hidden rounded-[2.5rem] pointer-events-none">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-32 -mt-32 blur-[100px]" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400/20 rounded-full -ml-20 -mb-20 blur-[80px]" />
            </div>

            <div className="relative z-20 text-center md:text-left flex-1">
              <h2 className="text-4xl font-black mb-3 tracking-tight">Total Syllabus Draw</h2>
              <p className="text-indigo-100/80 max-w-lg text-lg font-medium leading-relaxed">
                The quickest way to start. Pick a random chapter from all three subjects combined using your chosen priority filter.
              </p>
            </div>

            <div className="relative z-20 flex flex-col sm:flex-row items-stretch gap-4 bg-white/10 p-3 rounded-3xl backdrop-blur-xl border border-white/20 shadow-inner min-w-[320px] md:min-w-[480px]">
              {/* Custom Dropdown Container - Fixed clipping by moving overflow constraints */}
              <div className="relative flex-1" ref={dropdownRef}>
                <button 
                  onClick={() => setIsPcmDropdownOpen(!isPcmDropdownOpen)}
                  className="flex items-center justify-between w-full h-16 px-6 bg-white/10 hover:bg-white/20 transition-all rounded-2xl border border-white/20 group"
                >
                  <div className="flex flex-col items-start">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200 opacity-90 leading-none mb-1.5">Focus:</span>
                    <span className="text-sm font-black tracking-widest uppercase">{filterLabels[pcmDrawFilter]}</span>
                  </div>
                  <svg className={`w-5 h-5 text-white transition-transform duration-300 ease-out ${isPcmDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isPcmDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] overflow-hidden z-[100] dropdown-animate border border-slate-100 p-2 min-w-[240px]">
                    {(Object.keys(filterLabels) as (keyof typeof filterLabels)[]).map((key) => (
                      <button
                        key={key}
                        onClick={() => { setPcmDrawFilter(key); setIsPcmDropdownOpen(false); }}
                        className={`w-full text-left px-5 py-4 text-[11px] font-black uppercase tracking-[0.15em] rounded-2xl transition-all duration-200 ${
                            pcmDrawFilter === key 
                            ? 'text-indigo-600 bg-indigo-50 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                            {filterLabels[key]}
                            {pcmDrawFilter === key && (
                                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                            )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button 
                onClick={() => handleDrawPCM(pcmDrawFilter)}
                className="bg-white text-indigo-700 px-10 h-16 rounded-2xl font-black text-lg hover:shadow-[0_20px_40px_rgba(255,255,255,0.2)] hover:-translate-y-0.5 transition-all active:scale-95 shadow-xl shadow-black/5"
              >
                Draw from PCM
              </button>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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

      {activeDraw && (
        <LuckyDrawModal
          subject={activeDraw.subject}
          chapter={activeDraw.chapter}
          onClose={() => setActiveDraw(null)}
          onComplete={handleCompleteFromDraw}
          onRedraw={handleRedraw}
        />
      )}

      <footer className="max-w-7xl mx-auto px-4 mt-20 text-center">
        <div className="inline-block px-6 py-2 bg-slate-100 rounded-full text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mb-4">
          Local Storage Persistence Active
        </div>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">KYA SCROLL KAR RAHA HEIN NICHE PADH NA JAAKE LODU</p>
        <p className="mt-3 font-black text-slate-800 text-lg italic tracking-tighter">PADHAI KARLE BKL</p>
      </footer>
    </div>
  );
};

export default App;
