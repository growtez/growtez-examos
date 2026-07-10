'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Plus, Trash2 } from 'lucide-react';

const TEMPLATES: Record<string, { title: string; description: string; duration: number; mcqCorrect: number; mcqWrong: number; natCorrect: number; natWrong: number; subjects: { name: string; questionCount: number }[] }> = {
  neet: {
    title: 'NEET Mock Test',
    description: 'National Eligibility cum Entrance Test for medical admissions.',
    duration: 200,
    mcqCorrect: 4,
    mcqWrong: -1,
    natCorrect: 4,
    natWrong: 0,
    subjects: [
      { name: 'Physics', questionCount: 45 },
      { name: 'Chemistry', questionCount: 45 },
      { name: 'Biology', questionCount: 90 },
    ],
  },
  jee_main: {
    title: 'JEE Main Mock Test',
    description: 'Joint Entrance Examination Main for engineering admissions.',
    duration: 180,
    mcqCorrect: 4,
    mcqWrong: -1,
    natCorrect: 4,
    natWrong: 0,
    subjects: [
      { name: 'Physics', questionCount: 30 },
      { name: 'Chemistry', questionCount: 30 },
      { name: 'Mathematics', questionCount: 30 },
    ],
  },
  jee_advanced: {
    title: 'JEE Advanced Mock Test',
    description: 'Joint Entrance Examination Advanced for IIT admissions.',
    duration: 180,
    mcqCorrect: 3,
    mcqWrong: -1,
    natCorrect: 3,
    natWrong: 0,
    subjects: [
      { name: 'Physics', questionCount: 54 },
      { name: 'Chemistry', questionCount: 54 },
      { name: 'Mathematics', questionCount: 54 },
    ],
  },
};

export default function NewGlobalExamTemplatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Exam details
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(180);
  const [mcqCorrect, setMcqCorrect] = useState(4);
  const [mcqWrong, setMcqWrong] = useState(-1);
  const [natCorrect, setNatCorrect] = useState(4);
  const [natWrong, setNatWrong] = useState(0);

  // Step 2: Subjects
  const [subjects, setSubjects] = useState<Array<{
    name: string;
    questionCount: number;
  }>>([{ name: '', questionCount: 10 }]);

  const addSubject = () => {
    setSubjects([...subjects, { name: '', questionCount: 10 }]);
  };

  const removeSubject = (index: number) => {
    setSubjects(subjects.filter((_, i) => i !== index));
  };

  const updateSubject = (index: number, field: string, value: any) => {
    const updated = [...subjects];
    (updated[index] as any)[field] = value;
    setSubjects(updated);
  };

  // Pre-fill from template query param
  useEffect(() => {
    const tpl = searchParams.get('template');
    if (tpl && TEMPLATES[tpl]) {
      const t = TEMPLATES[tpl];
      setTitle(t.title);
      setDescription(t.description);
      setDurationMinutes(t.duration);
      setMcqCorrect(t.mcqCorrect);
      setMcqWrong(t.mcqWrong);
      setNatCorrect(t.natCorrect);
      setNatWrong(t.natWrong);
      setSubjects(t.subjects);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (subjects.some(s => !s.name.trim())) throw new Error('All subjects must have a name');

      // Placeholder for actual creation logic
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      router.refresh();
      router.push(`/exams`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <Link href="/exams" className="inline-flex items-center gap-1 text-text-muted hover:text-text-main text-sm transition-colors mb-4">
          <ChevronLeft size={16} />
          Back to Exams
        </Link>
        <h2 className="text-2xl font-bold text-text-main">Create Global Exam Template</h2>
        <p className="text-text-muted mt-1">Configure global exam details, marking scheme, and subjects</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Exam Details */}
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-text-main mb-4">Template Details</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1.5 uppercase tracking-wider text-[11px]">Title *</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required
                className="w-full px-4 py-3 bg-surface-hover border border-border rounded-xl text-text-main placeholder-text-muted/40 focus:outline-none focus:ring-2 focus:ring-accent-primary/50 transition-all text-sm"
                placeholder="JEE Main Global Mock" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1.5 uppercase tracking-wider text-[11px]">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
                className="w-full px-4 py-3 bg-surface-hover border border-border rounded-xl text-text-main placeholder-text-muted/40 focus:outline-none focus:ring-2 focus:ring-accent-primary/50 transition-all resize-none text-sm"
                placeholder="Global template covering all standardized topics..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1.5 uppercase tracking-wider text-[11px]">Duration (minutes) *</label>
              <input type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(parseInt(e.target.value))} min={1} required
                className="w-full px-4 py-3 bg-surface-hover border border-border rounded-xl text-text-main focus:outline-none focus:ring-2 focus:ring-accent-primary/50 transition-all text-sm" />
            </div>
          </div>
        </div>

        {/* Marking Scheme */}
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-text-main mb-4">Default Marking Scheme</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1.5 uppercase tracking-wider text-[11px]">MCQ Correct</label>
              <input type="number" value={mcqCorrect} onChange={(e) => setMcqCorrect(parseInt(e.target.value))}
                className="w-full px-4 py-3 bg-surface-hover border border-border rounded-xl text-text-main focus:outline-none focus:ring-2 focus:ring-accent-primary/50 transition-all text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1.5 uppercase tracking-wider text-[11px]">MCQ Wrong</label>
              <input type="number" value={mcqWrong} onChange={(e) => setMcqWrong(parseInt(e.target.value))}
                className="w-full px-4 py-3 bg-surface-hover border border-border rounded-xl text-text-main focus:outline-none focus:ring-2 focus:ring-accent-primary/50 transition-all text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1.5 uppercase tracking-wider text-[11px]">NAT Correct</label>
              <input type="number" value={natCorrect} onChange={(e) => setNatCorrect(parseInt(e.target.value))}
                className="w-full px-4 py-3 bg-surface-hover border border-border rounded-xl text-text-main focus:outline-none focus:ring-2 focus:ring-accent-primary/50 transition-all text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1.5 uppercase tracking-wider text-[11px]">NAT Wrong</label>
              <input type="number" value={natWrong} onChange={(e) => setNatWrong(parseInt(e.target.value))}
                className="w-full px-4 py-3 bg-surface-hover border border-border rounded-xl text-text-main focus:outline-none focus:ring-2 focus:ring-accent-primary/50 transition-all text-sm" />
            </div>
          </div>
        </div>

        {/* Subjects */}
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text-main">Required Subjects</h3>
            <button type="button" onClick={addSubject}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent-primary/10 border border-accent-primary/20 text-accent-primary rounded-lg text-sm font-medium hover:bg-accent-primary/20 transition-colors">
              <Plus size={14} />
              Add Subject
            </button>
          </div>

          <div className="space-y-4">
            {subjects.map((subject, index) => (
              <div key={index} className="bg-surface-hover border border-border rounded-xl p-4 relative group">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-text-main">Subject {index + 1}</span>
                  {subjects.length > 1 && (
                    <button type="button" onClick={() => removeSubject(index)} className="text-red-400 hover:text-red-500 text-sm opacity-0 group-hover:opacity-100 transition-opacity absolute right-4 top-4">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-text-muted mb-1 uppercase tracking-wide font-semibold">Subject Name</label>
                    <input type="text" value={subject.name} onChange={(e) => updateSubject(index, 'name', e.target.value)} required
                      className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-main placeholder-text-muted/40 focus:outline-none focus:ring-2 focus:ring-accent-primary/50 transition-all text-sm"
                      placeholder="e.g. Physics" />
                  </div>
                  <div>
                    <label className="block text-xs text-text-muted mb-1 uppercase tracking-wide font-semibold">No. of Questions</label>
                    <input type="number" value={subject.questionCount} onChange={(e) => updateSubject(index, 'questionCount', parseInt(e.target.value))} min={1}
                      className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-main focus:outline-none focus:ring-2 focus:ring-accent-primary/50 transition-all text-sm" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-500 text-sm font-medium">{error}</div>}

        <div className="flex items-center gap-3">
          <button type="submit" disabled={loading}
            className="px-6 py-3 bg-accent-primary text-white font-bold tracking-wide uppercase text-sm rounded-xl hover:bg-accent-primary/90 transition-all disabled:opacity-50 shadow-sm">
            {loading ? 'Creating...' : 'Create Template'}
          </button>
          <Link href="/exams" className="px-6 py-3 bg-surface border border-border text-text-main font-bold tracking-wide uppercase text-sm rounded-xl hover:bg-surface-hover transition-colors shadow-sm">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
