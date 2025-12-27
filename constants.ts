
import { Subject, Chapter, Priority } from './types';

const toChapters = (names: string[]): Chapter[] => 
  names.map(name => ({ name, priority: 'Medium' as Priority }));

export const PREDEFINED_CHAPTERS: Record<Subject, Chapter[]> = {
  Physics: toChapters([
    "Units and Measurements",
    "Heat and Thermodynamics",
    "Modern Physics",
    "Newton’s Laws of Motion & Work Power Energy",
    "Gravitation",
    "Electrostatics",
    "Current Electricity",
    "Wave Optics",
    "Magnetism",
    "EMI",
    "AC"
  ]),
  Mathematics: toChapters([
    "Vectors and 3D",
    "Matrices and Determinants",
    "Quadratic Equations",
    "NCERT Integration",
    "Differential Equations",
    "Application of Integration (AOI)",
    "Limits, Continuity, Differentiability (LCD)",
    "Application of Derivatives (AOD)",
    "Basics of Straight Line",
    "Circle",
    "Parabola",
    "Ellipse",
    "Sequences and Series"
  ]),
  Chemistry: toChapters([
    "Chemical Bonding",
    "Mole Concept",
    "Chemical Kinetics",
    "Thermodynamics",
    "Atomic Structure",
    "Solutions",
    "Electrochemistry",
    "Periodic Table",
    "D and F Blocks",
    "P Block",
    "Coordination Compounds",
    "GOC",
    "Hydrocarbons",
    "Haloalkanes and Haloarenes",
    "Alcohols, Phenols and Esters",
    "Aldehydes, Ketones and Acids",
    "Amines"
  ])
};

export const SUBJECT_COLORS: Record<Subject, string> = {
  Physics: 'bg-blue-600',
  Mathematics: 'bg-emerald-600',
  Chemistry: 'bg-amber-600'
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  High: 'bg-rose-100 text-rose-700 border-rose-200',
  Medium: 'bg-amber-100 text-amber-700 border-amber-200',
  Low: 'bg-blue-100 text-blue-700 border-blue-200'
};
