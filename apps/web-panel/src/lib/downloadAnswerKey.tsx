// Interfaces for better type safety
export interface Question {
  id: string;
  question_number?: number;
  question_type: 'mcq' | 'msq' | 'nat' | string;
  question_text: string | null;
  image_url: string | null;
  options: Record<string, string | null>;
  correct_option: string | null;
  explanation: string | null;
  positive_marks?: number;
  negative_marks?: number;
  marks?: number; // legacy fallback
  exam_subjects?: { subject_name: string };
}

export interface ExamScheme {
  msq_correct?: number;
  msq_wrong?: number;
  msq_partial_enabled?: boolean;
  msq_partial?: number;
}

export interface QuestionEvaluation {
  isAttempted: boolean;
  marksAwarded: number;
  isPartialMatch: boolean;
  isCorrect: boolean; // Fully correct
  hasWrong: boolean; // For MSQ
  selectedOpts: string[];
  correctOpts: string[];
  studentAnsRaw: string | undefined | null;
}

export interface SubjectBreakdown {
  subject_name: string;
  marks: number;
  maxMarks: number;
  correct: number;
  partial: number;
  wrong: number;
  unattempted: number;
  totalQuestions: number;
}

/**
 * Pure function to evaluate a single question based on the student's answer and the exam scheme.
 */
export function evaluateQuestion(q: Question, studentAns: string | undefined | null, examScheme?: ExamScheme): QuestionEvaluation {
  const correctAns = q.correct_option;
  const isAttempted = studentAns !== undefined && studentAns !== null && String(studentAns).trim() !== '';

  let marksAwarded = 0;
  let isPartialMatch = false;
  let isCorrect = false;
  let hasWrong = false;

  const selectedOpts = isAttempted ? String(studentAns).split(',').filter(Boolean).map(s => s.trim().toUpperCase()).sort() : [];
  const correctOpts = (correctAns !== undefined && correctAns !== null && String(correctAns).trim() !== '')
    ? String(correctAns).split(',').filter(Boolean).map(s => s.trim().toUpperCase()).sort()
    : [];

  const maxMarks = q.positive_marks ?? q.marks ?? 1;
  const negMarks = (q.negative_marks !== undefined && q.negative_marks !== null) 
    ? -Math.abs(Number(q.negative_marks)) 
    : (q.question_type === 'mcq' ? -1 : 0);

  if (isAttempted) {
    const isMsq = q.question_type === 'msq' || (correctAns && String(correctAns).includes(','));

    if (isMsq) {
      let correctCount = 0;
      selectedOpts.forEach(opt => {
        if (correctOpts.includes(opt)) correctCount++;
        else hasWrong = true;
      });

      const msqCorrect = (examScheme?.msq_correct !== undefined && examScheme?.msq_correct !== null) 
        ? Number(examScheme.msq_correct) 
        : (maxMarks > 1 ? maxMarks : 4);
      const msqWrong = (examScheme?.msq_wrong !== undefined && examScheme?.msq_wrong !== null)
        ? -Math.abs(Number(examScheme.msq_wrong))
        : ((q.negative_marks !== undefined && q.negative_marks !== null) ? -Math.abs(Number(q.negative_marks)) : 0);
      const msqPartialEnabled = examScheme?.msq_partial_enabled ?? false;
      const configuredPartial = examScheme?.msq_partial;
      const msqPartialVal = (configuredPartial !== undefined && configuredPartial !== null && Number(configuredPartial) > 0)
        ? Number(configuredPartial)
        : (correctOpts.length > 0 ? Math.max(1, msqCorrect / correctOpts.length) : 1);

      if (hasWrong) {
        marksAwarded = msqWrong;
      } else if (correctCount === correctOpts.length) {
        marksAwarded = msqCorrect;
        isCorrect = true;
      } else if (correctCount > 0) {
        isPartialMatch = true;
        marksAwarded = msqPartialEnabled ? Number((correctCount * msqPartialVal).toFixed(2)) : msqWrong;
      } else {
        marksAwarded = msqWrong;
      }
    } else {
      if (q.question_type === 'nat') {
        if (String(studentAns).trim() === String(correctAns).trim()) {
          marksAwarded = maxMarks;
          isCorrect = true;
        } else {
          marksAwarded = negMarks;
        }
      } else {
        if (selectedOpts.length === 1 && correctOpts.includes(selectedOpts[0])) {
          marksAwarded = maxMarks;
          isCorrect = true;
        } else {
          marksAwarded = negMarks;
        }
      }
    }
  }

  return {
    isAttempted,
    marksAwarded,
    isPartialMatch,
    isCorrect,
    hasWrong,
    selectedOpts,
    correctOpts,
    studentAnsRaw: studentAns
  };
}

export function calculateSubjectBreakdown(questions: Question[], studentAnswers: Record<string, any>, examScheme?: ExamScheme): SubjectBreakdown[] {
  const breakdown: Record<string, SubjectBreakdown> = {};

  questions.forEach(q => {
    const subjName = q.exam_subjects?.subject_name || 'General';
    if (!breakdown[subjName]) {
      breakdown[subjName] = { subject_name: subjName, marks: 0, maxMarks: 0, correct: 0, partial: 0, wrong: 0, unattempted: 0, totalQuestions: 0 };
    }

    const maxMarks = q.positive_marks ?? q.marks ?? 1;
    breakdown[subjName].totalQuestions += 1;
    breakdown[subjName].maxMarks += maxMarks;

    const studentAns = studentAnswers[q.id]?.answer;
    const evalResult = evaluateQuestion(q, studentAns, examScheme);

    if (!evalResult.isAttempted) {
      breakdown[subjName].unattempted += 1;
    } else {
      breakdown[subjName].marks += evalResult.marksAwarded;
      if (evalResult.isCorrect) breakdown[subjName].correct += 1;
      else if (evalResult.isPartialMatch && !evalResult.hasWrong) breakdown[subjName].partial += 1;
      else breakdown[subjName].wrong += 1;
    }
  });

  return Object.values(breakdown);
}

export async function downloadAnswerKey(resultId: string, onProgress?: (status: boolean) => void) {
  if (!resultId) return;

  if (onProgress) onProgress(true);

  try {
    const res = await fetch(`/api/download/answer-key?resultId=${resultId}&format=json`);
    if (!res.ok) {
      const errorText = await res.text().catch(() => res.statusText);
      throw new Error(`Failed to fetch data: ${errorText}`);
    }
    const data = await res.json();
    const { result, exam, questions, schoolName, studentName } = data;

    const testName = exam?.title || 'Exam';
    const rollNo = result.students?.roll_number || 'N/A';
    const marks = result.total_marks ?? 0;
    const studentAnswers = result.answers || {};
    const formattedDate = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

    const subjectBreakdownList = calculateSubjectBreakdown(questions, studentAnswers, exam?.marking_scheme);

    const parseQuestionImages = (urlStr: string | null): string[] => {
      if (!urlStr) return [];
      const trimmed = urlStr.trim();
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try { return JSON.parse(trimmed); } catch (e) { return [trimmed]; }
      }
      return [trimmed];
    };

    const evaluatedQuestions = questions.map((q: Question) => {
      const studentAns = studentAnswers[q.id]?.answer;
      const evalResult = evaluateQuestion(q, studentAns, exam?.marking_scheme);
      const images = parseQuestionImages(q.image_url);

      const hasOptions = q.options && typeof q.options === 'object' && Object.keys(q.options).some(k => ['A', 'B', 'C', 'D'].includes(k) && ((q.options as any)[k] || (q.options as any)[`${k}_image`]));

      let optionsList: any[] = [];
      if (hasOptions) {
        optionsList = ['A', 'B', 'C', 'D'].map(key => {
          const val = (q.options as any)[key];
          const imgVal = (q.options as any)[`${key}_image`];
          if (!val && !imgVal) return null;

          const isCorrectOpt = q.question_type === 'msq' || (q.correct_option && String(q.correct_option).includes(','))
            ? evalResult.correctOpts.includes(key)
            : String(q.correct_option).trim().toUpperCase() === key;

          const isStudentAnsOpt = evalResult.selectedOpts.includes(key);

          return {
            key,
            text: val,
            image: imgVal,
            isCorrect: isCorrectOpt,
            isStudentAns: isStudentAnsOpt
          };
        }).filter(Boolean);
      }

      return { q, evalResult, images, optionsList };
    });

    const totalExamMarks = exam?.total_marks || subjectBreakdownList.reduce((acc, sb) => acc + sb.maxMarks, 0);

    const pdfData = {
      schoolName,
      testName,
      studentName,
      rollNo,
      marks,
      totalExamMarks,
      formattedDate,
      subjectBreakdownList,
      evaluatedQuestions
    };

    const { pdf } = await import('@react-pdf/renderer');
    const { AnswerKeyDocument } = await import('@/components/pdf/AnswerKeyDocument');

    const blob = await pdf(<AnswerKeyDocument data={pdfData} /> as any).toBlob();
    
    // Create download link
    const safeFilename = `${studentName.replace(/[^a-zA-Z0-9]/g, '_')}_AnswerKey.pdf`;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = safeFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('Error generating client-side answer key:', error);
    alert('Failed to generate answer key PDF: ' + (error instanceof Error ? error.message : String(error)));
  } finally {
    if (onProgress) onProgress(false);
  }
}
