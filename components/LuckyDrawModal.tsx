import React, { useState, useEffect } from 'react';
import { Subject, Chapter } from '../types';
import { SUBJECT_COLORS, PRIORITY_COLORS } from '../constants';

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
      const timer = setTimeout(() => setIsAnimating(false), 800);
      return () => clearTimeout(timer);
    }
  }, [chapter]);

  if (!chapter) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800">
        <div className={`h-2 ${SUBJECT_COLORS[subject]}`} />
        
        <div className="p-8 text-center">
          <p className="text-slate-500 dark:text-slate-400 uppercase tracking-widest text-sm font-semibold mb-2">
            Target Locked: {subject}
          </p>
          
          <div className="min-h-[160px] flex flex-col items-center justify-center py-6">
            {isAnimating ? (
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-slate-200 dark:border-slate-800 border-t-slate-800 dark:border-t-white rounded-full animate-spin mb-4"></div>
                <p className="text-slate-400 font-medium text-lg">Shuffling {subject}...</p>
              </div>
            ) : (
              <>
                <div className={`mb-4 px-3 py-1 rounded-full text-xs font-bold uppercase border ${PRIORITY_COLORS[chapter.priority]} dark:bg-opacity-20`}>
                  {chapter.priority} Priority
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white leading-tight">
                  {chapter.name}
                </h2>
              </>
            )}
          </div>

          {!isAnimating && (
            <div className="space-y-3 mt-8">
              <button
                onClick={onComplete}
                className="w-full py-4 px-6 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-slate-800 dark:hover:bg-indigo-500 transition-colors shadow-lg"
              >
                Mark as Completed
              </button>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={onRedraw}
                  className="py-3 px-4 border-2 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Redraw
                </button>
                <button
                  onClick={onClose}
                  className="py-3 px-4 border-2 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Maybe Later
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