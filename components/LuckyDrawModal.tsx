import React, { useState, useEffect } from 'react';
import { Subject, Chapter } from '../types';
import { SUBJECT_COLORS } from '../constants';

interface LuckyDrawModalProps {
  subject: Subject;
  chapter: Chapter | null;
  onClose: () => void;
  onComplete: () => void;
  onRedraw: () => void;
}

const LuckyDrawModal: React.FC<LuckyDrawModalProps> = ({
  subject,
  chapter,
  onClose,
  onComplete,
  onRedraw
}) => {
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    if (chapter) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [chapter]);

  if (!chapter) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.5)] overflow-hidden animate-slide-up border border-transparent dark:border-slate-800">
        <div className={`h-3 ${SUBJECT_COLORS[subject]}`} />
        
        <div className="p-8 md:p-12 text-center">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.3em] mb-4">
            New Study Target: {subject}
          </p>
          
          <div className="min-h-[200px] flex flex-col items-center justify-center">
            {isAnimating ? (
              <div className="flex flex-col items-center gap-6">
                <div className="w-16 h-16 border-[6px] border-slate-100 dark:border-slate-800 border-t-indigo-600 rounded-full animate-spin"></div>
                <h3 className="text-xl font-black italic text-slate-300 dark:text-slate-600 uppercase tracking-tighter">Choosing Wisely...</h3>
              </div>
            ) : (
              <div className="animate-fade-in">
                <div className={`mb-4 inline-block px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border-2 ${
                    chapter.priority === 'High' ? 'text-rose-600 border-rose-100 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30' : 
                    chapter.priority === 'Medium' ? 'text-amber-600 border-amber-100 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30' : 
                    'text-indigo-600 border-indigo-100 dark:border-indigo-900/50 bg-indigo-50 dark:bg-indigo-950/30'
                }`}>
                  {chapter.priority} Priority
                </div>
                <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white leading-[1.1] tracking-tighter mb-4">
                  {chapter.name}
                </h2>
                <div className="h-1 w-12 bg-indigo-600 mx-auto rounded-full" />
              </div>
            )}
          </div>

          {!isAnimating && (
            <div className="space-y-4 mt-10">
              <button
                onClick={onComplete}
                className="w-full h-16 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl font-black text-lg uppercase tracking-widest hover:bg-black dark:hover:bg-indigo-500 transition-all active-scale shadow-2xl shadow-indigo-200 dark:shadow-none"
              >
                Mark as Done ✅
              </button>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={onRedraw}
                  className="h-14 border-2 border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active-scale"
                >
                  Redraw 🎲
                </button>
                <button
                  onClick={onClose}
                  className="h-14 border-2 border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active-scale"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LuckyDrawModal;