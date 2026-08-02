export function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/\n/g, "<br/>");
}

export function renderLatexToHtml(text: string, katex: any): string {
  if (!text) return '';
  let processedText = text;

  // Convert LaTeX native block/inline delimiters to $$ and $
  processedText = processedText.replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$');
  processedText = processedText.replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$');

  const rawParts = processedText.split(/(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g);

  const processedParts = rawParts.map((part) => {
    if (
      (part.startsWith("$$") && part.endsWith("$$")) ||
      (part.startsWith("$") && part.endsWith("$"))
    ) {
      return part;
    }

    if (!/\\|[\^_]\{/.test(part)) {
      return part;
    }

    if (part.includes("\\begin{") && part.includes("\\end{")) {
      return `$$${part.trim()}$$`;
    }

    const ARG_GROUP = `(?:\\s*(?:\\[[^\\]]*\\]|\\{(?:[^{}]|\\{[^{}]*\\})*\\}|\\([^)]*\\)|[\\^_](?:[a-zA-Z0-9]+|\\{(?:[^{}]|\\{[^{}]*\\})*\\})))*`;

    const BARE_EXPR_RE = new RegExp(
      `(\\\\[a-zA-Z]+${ARG_GROUP}|\\\\[^a-zA-Z0-9\\s]|(?:[a-zA-Z0-9]|\\)|\\\]|\\})[\\^_](?:[a-zA-Z0-9]+|\\{(?:[^{}]|\\{[^{}]*\\})*\\}))`,
      'g'
    );

    return part.replace(BARE_EXPR_RE, (match) => {
      const trimmed = match.trim();
      if (!trimmed) return match;
      return `$${trimmed}$`;
    });
  });

  processedText = processedParts.join("");

  const parts = processedText.split(/(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g);

  return parts.map((part) => {
    if (part.startsWith("$$") && part.endsWith("$$")) {
      const latex = part.slice(2, -2).trim();
      try {
        return katex.renderToString(latex, {
          displayMode: true,
          throwOnError: false,
          output: "htmlAndMathml",
        });
      } catch (e) {
        return `<span style="color: #ef4444; font-family: monospace;">${escapeHtml(part)}</span>`;
      }
    } else if (part.startsWith("$") && part.endsWith("$")) {
      const latex = part.slice(1, -1).trim();
      try {
        return katex.renderToString(latex, {
          displayMode: false,
          throwOnError: false,
          output: "htmlAndMathml",
        });
      } catch (e) {
        return `<span style="color: #ef4444; font-family: monospace;">${escapeHtml(part)}</span>`;
      }
    }
    return escapeHtml(part);
  }).join('');
}

// Interfaces for better type safety
interface Question {
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

interface ExamScheme {
  msq_correct?: number;
  msq_wrong?: number;
  msq_partial_enabled?: boolean;
  msq_partial?: number;
}

interface QuestionEvaluation {
  isAttempted: boolean;
  marksAwarded: number;
  isPartialMatch: boolean;
  isCorrect: boolean; // Fully correct
  hasWrong: boolean; // For MSQ
  selectedOpts: string[];
  correctOpts: string[];
  studentAnsRaw: string | undefined | null;
}

interface SubjectBreakdown {
  subjectName: string;
  marks: number;
  maxMarks: number;
  correct: number;
  partial: number;
  wrong: number;
  unattempted: number;
  totalQuestions: number;
}

const GLOBAL_PDF_CSS = `
  * {
    word-wrap: break-word !important;
    overflow-wrap: break-word !important;
  }
  p {
    margin: 0 !important;
    padding: 0 !important;
  }
  .katex-display {
    max-width: 100% !important;
    white-space: normal !important;
    margin-top: 2px !important;
    margin-bottom: 4px !important;
  }
  .katex {
    max-width: 100% !important;
    white-space: normal !important;
  }
  .katex .hide-tail {
    overflow: hidden !important;
    position: relative !important;
  }
  .katex * {
    box-sizing: content-box !important;
    border-color: currentColor !important;
  }
`;

/**
 * Pure function to evaluate a single question based on the student's answer and the exam scheme.
 */
function evaluateQuestion(q: Question, studentAns: string | undefined | null, examScheme?: ExamScheme): QuestionEvaluation {
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

  const maxMarks = q.positive_marks || q.marks || 1;
  const negMarks = q.negative_marks ? -Math.abs(q.negative_marks) : (q.question_type === 'mcq' ? -1 : 0);

  if (isAttempted) {
    const isMsq = q.question_type === 'msq' || (correctAns && String(correctAns).includes(','));

    if (isMsq) {
      let correctCount = 0;
      selectedOpts.forEach(opt => {
        if (correctOpts.includes(opt)) correctCount++;
        else hasWrong = true;
      });

      const msqCorrect = maxMarks > 1 ? maxMarks : (examScheme?.msq_correct || 4);
      const msqWrong = q.negative_marks ? -Math.abs(q.negative_marks) : (examScheme?.msq_wrong ?? 0);
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
        if (msqPartialEnabled) {
          marksAwarded = Math.round(msqPartialVal * correctCount * 100) / 100;
          isPartialMatch = true;
        } else {
          marksAwarded = msqWrong;
          hasWrong = true; // Treated as wrong if partial is disabled
        }
      }
    } else {
      // MCQ or NAT
      if (String(studentAns).trim().toLowerCase() === String(correctAns).trim().toLowerCase()) {
        marksAwarded = maxMarks;
        isCorrect = true;
      } else {
        marksAwarded = negMarks;
        hasWrong = true;
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

/**
 * Calculates subject breakdown using pre-evaluated questions.
 */
function calculateSubjectBreakdown(questions: Question[], studentAnswers: Record<string, any>, examScheme?: ExamScheme): SubjectBreakdown[] {
  const subjectMap: Record<string, SubjectBreakdown> = {};

  questions.forEach((q) => {
    const sName = q.exam_subjects?.subject_name || 'General';
    if (!subjectMap[sName]) {
      subjectMap[sName] = { subjectName: sName, marks: 0, maxMarks: 0, correct: 0, partial: 0, wrong: 0, unattempted: 0, totalQuestions: 0 };
    }

    subjectMap[sName].totalQuestions++;
    subjectMap[sName].maxMarks += (q.positive_marks || q.marks || 1);

    const studentAns = studentAnswers[q.id]?.answer;
    const evalResult = evaluateQuestion(q, studentAns, examScheme);

    if (!evalResult.isAttempted) {
      subjectMap[sName].unattempted++;
    } else {
      subjectMap[sName].marks += evalResult.marksAwarded;
      if (evalResult.isCorrect) subjectMap[sName].correct++;
      else if (evalResult.isPartialMatch) subjectMap[sName].partial++;
      else subjectMap[sName].wrong++;
    }
  });

  return Object.values(subjectMap);
}

/**
 * Generates the Option Box Style to avoid massive duplication
 */
function getOptionBoxStyle(isStudentAns: boolean, isCorrect: boolean, isWrong: boolean, isPartialMatch: boolean) {
  const base = `padding: 1px 8px 11px 8px; border-radius: 6px; font-size: 11px; display: flex; justify-content: space-between; align-items: center; page-break-inside: avoid; background-color: #ffffff;`;
  if (isStudentAns && isCorrect && isPartialMatch) return `${base} border: 1.5px solid #f59e0b;`;
  if (isStudentAns && isCorrect) return `${base} border: 1.5px solid #22c55e;`;
  if (isStudentAns && isWrong) return `${base} border: 1.5px solid #fca5a5;`;
  return `${base} border: 1px solid #e2e8f0;`;
}

function getOptionBadgeHtml(isStudentAns: boolean, isCorrect: boolean, isWrong: boolean, isPartialMatch: boolean) {
  if (isCorrect && isStudentAns && isPartialMatch) return `<span style="color: #d97706; font-weight: 800; font-size: 10px; whitespace: nowrap;">✓ Partial (Your Ans)</span>`;
  if (isCorrect && isStudentAns) return `<span style="color: #16a34a; font-weight: 800; font-size: 10px; whitespace: nowrap;">✓ Correct (Your Ans)</span>`;
  if (isWrong) return `<span style="color: #dc2626; font-weight: 800; font-size: 10px; whitespace: nowrap;">✗ Your Ans (Wrong)</span>`;
  if (isCorrect) return `<span style="color: #0f172a; font-weight: 700; font-size: 10px; whitespace: nowrap;">✓ Correct</span>`;
  return '';
}

/**
 * Generates HTML for a single question card
 */
function generateQuestionCardHtml(q: Question, index: number, evalResult: QuestionEvaluation, katex: any) {
  // 1. Marks Badge
  const marksBadgeStyle = evalResult.isPartialMatch
    ? 'background-color: #ffffff; color: #b45309; border: 1px solid #fde68a;'
    : (evalResult.marksAwarded > 0
      ? 'background-color: #ffffff; color: #15803d; border: 1px solid #86efac;'
      : (evalResult.marksAwarded < 0
        ? 'background-color: #ffffff; color: #be123c; border: 1px solid #fecdd3;'
        : 'background-color: #ffffff; color: #64748b; border: 1px solid #e2e8f0;'));

  const marksText = evalResult.isPartialMatch
    ? `+${evalResult.marksAwarded} (Partial)`
    : `${evalResult.marksAwarded > 0 ? '+' : ''}${evalResult.marksAwarded}`;

  // 2. Question Images
  let imagesHtml = '';
  if (q.image_url) {
    const parseQuestionImages = (urlStr: string | null): string[] => {
      if (!urlStr) return [];
      const trimmed = urlStr.trim();
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try { return JSON.parse(trimmed); } catch (e) { return [trimmed]; }
      }
      return [trimmed];
    };
    const images = parseQuestionImages(q.image_url);
    images.forEach((url) => {
      imagesHtml += `
        <div style="margin-top: 6px; margin-bottom: 6px;">
          <img src="${url}" style="max-width: 50%; max-height: 140px; object-fit: contain; border-radius: 6px; border: 1px solid #e2e8f0;" />
        </div>
      `;
    });
  }

  // 3. Options HTML
  let optionsHtml = '';
  const hasOptions = q.options && typeof q.options === 'object' && Object.keys(q.options).some(k => ['A', 'B', 'C', 'D'].includes(k) && (q.options[k] || q.options[`${k}_image`]));

  if (hasOptions) {
    optionsHtml += `<div style="margin-top: 8px; display: flex; flex-direction: column; gap: 5px;">`;

    ['A', 'B', 'C', 'D'].forEach((key) => {
      const val = (q.options as any)[key];
      const imgVal = (q.options as any)[`${key}_image`];

      if (!val && !imgVal) return;

      const isCorrectOpt = q.question_type === 'msq' || (q.correct_option && String(q.correct_option).includes(','))
        ? evalResult.correctOpts.includes(key)
        : String(q.correct_option).trim().toUpperCase() === key;

      const isStudentAnsOpt = evalResult.selectedOpts.includes(key);
      const isWrongOpt = isStudentAnsOpt && !isCorrectOpt;

      const boxStyle = getOptionBoxStyle(isStudentAnsOpt, isCorrectOpt, isWrongOpt, evalResult.isPartialMatch);
      const optionTextHtml = renderLatexToHtml(val || '', katex);
      const optionImageHtml = imgVal ? `
        <div style="margin-top: 4px;">
          <img src="${imgVal}" style="max-width: 140px; max-height: 80px; object-fit: contain; border-radius: 4px;" />
        </div>
      ` : '';
      const badgeHtml = getOptionBadgeHtml(isStudentAnsOpt, isCorrectOpt, isWrongOpt, evalResult.isPartialMatch);

      optionsHtml += `
        <div style="${boxStyle}">
          <div style="flex: 1; min-width: 0; padding-right: 6px; display: flex; align-items: center; gap: 4px;">
            <span style="font-weight: 800; color: #0f172a; flex-shrink: 0;">${key})</span>
            <span style="line-height: 1.4; color: #1e293b; word-wrap: break-word; overflow-wrap: break-word; max-width: 100%;">${optionTextHtml}</span>
            ${optionImageHtml}
          </div>
          <div style="flex-shrink: 0; text-align: right; display: flex; align-items: center;">
            ${badgeHtml}
          </div>
        </div>
      `;
    });
    optionsHtml += `</div>`;
  } else {
    // NAT (Numerical Answer Type)
    let userAnswerText = evalResult.isAttempted ? String(evalResult.studentAnsRaw) : 'Not Answered';
    let correctAnswerText = q.correct_option !== undefined && q.correct_option !== null ? String(q.correct_option) : 'N/A';

    let bgStyle = "background-color: #ffffff; border: 1px solid #e2e8f0;";
    if (evalResult.isCorrect) bgStyle = "background-color: #ffffff; border: 1.5px solid #22c55e;";
    else if (evalResult.isAttempted) bgStyle = "background-color: #ffffff; border: 1.5px solid #fca5a5;";

    let userAnswerColor = '#64748b';
    if (evalResult.isAttempted) {
      if (evalResult.marksAwarded > 0) userAnswerColor = '#16a34a';
      else if (evalResult.marksAwarded < 0) userAnswerColor = '#dc2626';
      else userAnswerColor = '#d97706';
    }

    optionsHtml += `
      <div style="padding: 0px 10px 12px 10px; border-radius: 6px; ${bgStyle} margin-top: 8px; font-size: 11px; display: flex; justify-content: space-between; align-items: center; page-break-inside: avoid;">
        <div style="display: flex; align-items: center;">
          <span style="font-weight: 600; color: #64748b; margin-right: 4px;">Your Ans:</span>
          <span style="font-weight: 800; color: ${userAnswerColor};">${escapeHtml(userAnswerText)}</span>
        </div>
        <div style="display: flex; align-items: center;">
          <span style="font-weight: 600; color: #64748b; margin-right: 4px;">Correct:</span>
          <span style="font-weight: 800; color: #0f172a;">${escapeHtml(correctAnswerText)}</span>
        </div>
      </div>
    `;
  }

  // 4. Explanation
  let explanationHtml = '';
  if (q.explanation) {
    const explanationTextHtml = renderLatexToHtml(q.explanation, katex);
    explanationHtml = `
      <div style="margin-top: 8px; padding: 1px 10px 11px 10px; border-radius: 6px; border: 1px solid #bfdbfe; background-color: #eff6ff; font-size: 10.5px; line-height: 1.4;">
        <div style="font-weight: 800; color: #1d4ed8; margin-bottom: 2px;">Explanation:</div>
        <div style="color: #1e293b; word-wrap: break-word; overflow-wrap: break-word; max-width: 100%;">${explanationTextHtml}</div>
      </div>
    `;
  }

  return `
    <div style="box-sizing: border-box; width: 100%; max-width: 100%; margin-bottom: 10px; padding: 7px 12px 17px 12px; border: 1px solid #000000; border-radius: 8px; background-color: #ffffff; box-shadow: 0 1px 2px rgba(0,0,0,0.03); page-break-inside: avoid; break-inside: avoid;">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #000000; padding-bottom: 4px; margin-bottom: 4px;">
        <span style="font-weight: 800; color: #0d9488; font-size: 11px; tracking-wide: 0.02em;">
          Q.${q.question_number || index + 1} | ${q.exam_subjects?.subject_name || 'General'}
        </span>
        <span style="font-weight: 800; font-size: 10px; padding: 0px 8px 6px 8px; border-radius: 12px; ${marksBadgeStyle}">
          Marks: ${marksText}
        </span>
      </div>
      <div style="font-size: 12px; line-height: 1.4; color: #0f172a; margin-bottom: 6px; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word; max-width: 100%;">
        ${renderLatexToHtml(q.question_text || '', katex)}
      </div>
      ${imagesHtml}
      ${optionsHtml}
      ${explanationHtml}
    </div>
  `;
}

function generateHeaderHtml(schoolName: string, testName: string, studentName: string, rollNo: string, marks: number, formattedDate: string) {
  return `
    <!-- Header Banner -->
    <div style="text-align: center; border-bottom: 2px solid #0d9488; padding-bottom: 10px; margin-bottom: 14px;">
      <h1 style="color: #0f766e; font-size: 24px; margin: 0 0 3px 0; font-weight: 900; letter-spacing: -0.01em;">${escapeHtml(schoolName) || 'Student Answer Key'}</h1>
      <h3 style="color: #64748b; font-size: 13px; margin: 0; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Answer Key &amp; Detailed Report</h3>
    </div>

    <!-- Student & Test Metadata Box -->
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; margin-bottom: 14px;">
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px;">
        <div style="display: flex; flex-wrap: wrap; gap: 8px 24px; font-size: 12px; color: #334155;">
          <div><strong style="color: #64748b; text-transform: uppercase; font-size: 10px; letter-spacing: 0.04em;">Test:</strong> <span style="font-weight: 700; color: #0f172a;">${escapeHtml(testName)}</span></div>
          <div><strong style="color: #64748b; text-transform: uppercase; font-size: 10px; letter-spacing: 0.04em;">Student:</strong> <span style="font-weight: 700; color: #0f172a;">${escapeHtml(studentName)}</span></div>
          <div><strong style="color: #64748b; text-transform: uppercase; font-size: 10px; letter-spacing: 0.04em;">Roll No:</strong> <span style="font-weight: 700; color: #0f172a;">${escapeHtml(rollNo)}</span></div>
          <div><strong style="color: #64748b; text-transform: uppercase; font-size: 10px; letter-spacing: 0.04em;">Date:</strong> <span style="font-weight: 600; color: #334155;">${formattedDate}</span></div>
        </div>
        
        <!-- Perfectly Centered Total Score Badge -->
        <div style="display: flex; align-items: center; justify-content: center; gap: 6px; flex-shrink: 0; background-color: #ccfbf1; border: 1px solid #99f6e4; padding: 0px 14px 12px 14px; border-radius: 8px; white-space: nowrap;">
          <span style="font-size: 11px; font-weight: 800; color: #0f766e; letter-spacing: 0.05em; line-height: 1;">SCORE</span>
          <span style="font-size: 20px; font-weight: 900; color: #0f766e; line-height: 1;">${marks}</span>
        </div>
      </div>
  `;
}

function generateSubjectPillsHtml(subjectBreakdownList: SubjectBreakdown[]) {
  if (subjectBreakdownList.length === 0) return '</div>'; // close the metadata box
  return `
      <!-- Compact Subject Pills -->
      <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #e2e8f0; display: flex; flex-wrap: wrap; gap: 8px; align-items: center;">
        <span style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em;">Subjects:</span>
        ${subjectBreakdownList.map(sb => `
          <div style="display: inline-flex; align-items: center; gap: 6px; background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 0px 10px 10px 10px; font-size: 11px;">
            <span style="font-weight: 800; color: #0f766e;">${escapeHtml(sb.subjectName)}</span>
            <span style="font-weight: 800; color: #0f172a;">${sb.marks} <span style="font-size: 9.5px; font-weight: 500; color: #64748b;">/ ${sb.maxMarks}m</span></span>
            <span style="font-size: 9.5px; color: #475569; border-left: 1px solid #e2e8f0; padding-left: 6px;">
              <span style="color: #166534; font-weight: 800;">${sb.correct}C</span>
              ${sb.partial > 0 ? ` • <span style="color: #b45309; font-weight: 800;">${sb.partial}P</span>` : ''}
              • <span style="color: #be123c; font-weight: 800;">${sb.wrong}W</span>
              • <span style="color: #64748b;">${sb.unattempted}U</span>
            </span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

export async function downloadAnswerKey(resultId: string, onProgress?: (status: boolean) => void) {
  if (!resultId) return;

  if (onProgress) onProgress(true);

  try {
    // 1. Fetch JSON data from route
    const res = await fetch(`/api/download/answer-key?resultId=${resultId}&format=json`);
    if (!res.ok) {
      const errorText = await res.text().catch(() => res.statusText);
      throw new Error(`Failed to fetch data: ${errorText}`);
    }
    const data = await res.json();
    const { result, exam, questions, schoolName, studentName } = data;

    // 2. Load katex and html2pdf dynamically
    // @ts-ignore
    const [katexModule, html2pdfModule] = await Promise.all([
      import('katex'),
      import('html2pdf.js')
    ]);
    const katex = katexModule.default || katexModule;
    const html2pdf = html2pdfModule.default || html2pdfModule;

    const testName = exam?.title || 'Exam';
    const rollNo = result.students?.roll_number || 'N/A';
    const marks = result.total_marks ?? 0;
    const studentAnswers = result.answers || {};
    const formattedDate = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

    // 3. Process Data
    const subjectBreakdownList = calculateSubjectBreakdown(questions, studentAnswers, exam?.marking_scheme);

    let leftQuestionsHtml = '';
    let rightQuestionsHtml = '';

    questions.forEach((q: Question, index: number) => {
      const studentAns = studentAnswers[q.id]?.answer;
      const evalResult = evaluateQuestion(q, studentAns, exam?.marking_scheme);
      const qCardHtml = generateQuestionCardHtml(q, index, evalResult, katex);

      if (index % 2 === 0) leftQuestionsHtml += qCardHtml;
      else rightQuestionsHtml += qCardHtml;
    });

    // 4. Construct Final HTML
    const fullHtml = `
      <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; padding: 16px; max-width: 800px; margin: 0 auto; background-color: #ffffff;">
        <style>${GLOBAL_PDF_CSS}</style>
        ${generateHeaderHtml(schoolName, testName, studentName, rollNo, marks, formattedDate)}
        ${generateSubjectPillsHtml(subjectBreakdownList)}

        <!-- True 2-Column Masonry Wrapper -->
        <div style="display: flex; gap: 10px; width: 100%; align-items: flex-start; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 0; width: calc(50% - 5px); max-width: calc(50% - 5px); display: flex; flex-direction: column;">
            ${leftQuestionsHtml}
          </div>
          <div style="flex: 1; min-width: 0; width: calc(50% - 5px); max-width: calc(50% - 5px); display: flex; flex-direction: column;">
            ${rightQuestionsHtml}
          </div>
        </div>
      </div>
    `;

    // 5. Generate and save PDF using html2pdf
    const safeFilename = `${studentName.replace(/[^a-zA-Z0-9]/g, '_')}_AnswerKey.pdf`;
    const opt: any = {
      margin: [10, 10, 10, 10],
      filename: safeFilename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'] }
    };

    await html2pdf().set(opt).from(fullHtml).save();
  } catch (error) {
    console.error('Error generating client-side answer key:', error);
    alert('Failed to generate answer key PDF: ' + (error instanceof Error ? error.message : String(error)));
  } finally {
    if (onProgress) onProgress(false);
  }
}
