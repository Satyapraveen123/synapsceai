export interface NarrationCue {
  id: string;
  timestamp: number; // in seconds
  endTimestamp: number;
  text: string;
  activeLatexId: string;
  action: string;
}

export interface DerivationStep {
  id: string;
  stepNumber: number;
  label: string;
  latex: string;
  explanation: string;
  sympyRule: string;
  timestampStart: number;
  supplementaryClip?: SupplementaryClip;
}

export interface SupplementaryClip {
  id: string;
  conceptTitle: string;
  prompt: string;
  videoUrl: string;
  duration?: number;
  generatedAt: string;
  stepId?: string;
  aspectRatio?: '16:9' | '9:16';
}

export interface TextbookCitation {
  id: string;
  bookTitle: string;
  section: string;
  pageNumber: number;
  equationLatex?: string;
  excerpt: string;
  relevanceScore: number;
  videoTimestamp: number;
}

export interface LessonData {
  id: string;
  title: string;
  category: string;
  bloomLevel: 'Remember' | 'Understand' | 'Apply' | 'Analyze' | 'Evaluate' | 'Create';
  duration: number; // in seconds
  description: string;
  primaryEquation: string;
  manimPythonCode: string;
  steps: DerivationStep[];
  cues: NarrationCue[];
  citations: TextbookCitation[];
  interactiveType: 'fourier' | 'gradient_descent' | 'maxwell' | 'quantum_bloch';
  tags: string[];
  supplementaryClips?: SupplementaryClip[];
}

export interface BloomQuizQuestion {
  id: string;
  bloomLevel: string;
  prompt: string;
  latex?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface DAGNode {
  id: string;
  title: string;
  category: string;
  prerequisites: string[];
  bloomLevel: 'Remember' | 'Understand' | 'Apply' | 'Analyze' | 'Evaluate' | 'Create';
  masteryPercentage: number;
  isUnlocked: boolean;
  summary: string;
  keyFormula: string;
  questions: BloomQuizQuestion[];
  x?: number;
  y?: number;
}

export interface PipelineExecutionLog {
  nodeName: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'healed';
  timestamp: string;
  message: string;
  detail?: string;
}
