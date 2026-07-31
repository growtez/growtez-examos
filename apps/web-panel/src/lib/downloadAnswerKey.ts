function escapeHtml(text: string): string {
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

  // Heuristic: If there are no $ signs, but it contains obvious LaTeX math commands,
  // treat the entire text as a block math equation.
  const hasMathCommands = /\\(frac|lim|int|sum|prod|sqrt|alpha|beta|theta|pi|infty|pm|leq|geq|neq|rightarrow|Rightarrow|begin|end|sin|cos|tan|csc|sec|cot|log|ln|to)\b/.test(processedText) || /[\^_]\{/.test(processedText);
  
  if (!processedText.includes("$") && hasMathCommands) {
    processedText = `$$${processedText.trim()}$$`;
  }

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
    const katexModule = await import('katex');
    const katex = katexModule.default || katexModule;
    // @ts-ignore
    const html2pdfModule = await import('html2pdf.js');
    const html2pdf = html2pdfModule.default || html2pdfModule;

    const testName = exam?.title || 'Exam';
    const rollNo = result.students?.roll_number || 'N/A';
    const marks = result.total_marks ?? 0;
    const studentAnswers = result.answers || {};

    // Calculate subject breakdown
    const subjectMap: Record<string, { subjectName: string; marks: number; maxMarks: number; correct: number; partial: number; wrong: number; unattempted: number; totalQuestions: number }> = {};

    questions.forEach((q: any) => {
      const sName = q.exam_subjects?.subject_name || 'General';
      if (!subjectMap[sName]) {
        subjectMap[sName] = { subjectName: sName, marks: 0, maxMarks: 0, correct: 0, partial: 0, wrong: 0, unattempted: 0, totalQuestions: 0 };
      }
      subjectMap[sName].totalQuestions++;
      const qMaxMarks = q.positive_marks || q.marks || 1;
      subjectMap[sName].maxMarks += qMaxMarks;

      const studentAns = studentAnswers[q.id]?.answer;
      const correctAns = q.correct_option;

      if (studentAns === undefined || studentAns === null || String(studentAns).trim() === '') {
        subjectMap[sName].unattempted++;
      } else {
        const isMsq = q.question_type === 'msq' || (correctAns && String(correctAns).includes(','));
        if (isMsq) {
          const selectedOpts = String(studentAns).split(',').filter(Boolean).map(s => s.trim().toUpperCase()).sort();
          const correctOpts = String(correctAns).split(',').filter(Boolean).map(s => s.trim().toUpperCase()).sort();
          let hasWrong = false;
          let correctCount = 0;
          selectedOpts.forEach(opt => {
            if (correctOpts.includes(opt)) correctCount++;
            else hasWrong = true;
          });

          const msqCorrect = q.positive_marks || q.marks || exam?.marking_scheme?.msq_correct || 4;
          const msqWrong = q.negative_marks ? -Math.abs(q.negative_marks) : (exam?.marking_scheme?.msq_wrong ?? 0);
          const msqPartialEnabled = exam?.marking_scheme?.msq_partial_enabled ?? false;

          const configuredPartial = exam?.marking_scheme?.msq_partial;
          const msqPartialVal = (configuredPartial !== undefined && configuredPartial !== null && Number(configuredPartial) > 0)
            ? Number(configuredPartial)
            : (correctOpts.length > 0 ? Math.max(1, msqCorrect / correctOpts.length) : 1);

          if (hasWrong) {
            subjectMap[sName].marks += msqWrong;
            subjectMap[sName].wrong++;
          } else if (correctCount === correctOpts.length) {
            subjectMap[sName].marks += msqCorrect;
            subjectMap[sName].correct++;
          } else if (correctCount > 0) {
            if (msqPartialEnabled) {
              const partialMarks = Math.round(msqPartialVal * correctCount * 100) / 100;
              subjectMap[sName].marks += partialMarks;
              subjectMap[sName].partial++;
            } else {
              // Partial marking disabled → treat as wrong
              subjectMap[sName].marks += msqWrong;
              subjectMap[sName].wrong++;
            }
          } else {
            subjectMap[sName].unattempted++;
          }
        } else if (String(studentAns).trim().toLowerCase() === String(correctAns).trim().toLowerCase()) {
          subjectMap[sName].marks += qMaxMarks;
          subjectMap[sName].correct++;
        } else {
          const negMarks = q.negative_marks ? -Math.abs(q.negative_marks) : (q.question_type === 'mcq' ? -1 : 0);
          subjectMap[sName].marks += negMarks;
          subjectMap[sName].wrong++;
        }
      }
    });

    const subjectBreakdownList = Object.values(subjectMap);

    // Separate questions into two columns for true masonry 2-column layout (no vertical gaps)
    let leftQuestionsHtml = '';
    let rightQuestionsHtml = '';

    questions.forEach((q: any, index: number) => {
      const studentAns = studentAnswers[q.id]?.answer;
      const correctAns = q.correct_option;
      
      let marksAwarded = 0;
      let isPartialMatch = false;

      if (studentAns !== undefined && studentAns !== null && String(studentAns).trim() !== '') {
        const isMsq = q.question_type === 'msq' || (correctAns && String(correctAns).includes(','));
        if (isMsq) {
          const selectedOpts = String(studentAns).split(',').filter(Boolean).map(s => s.trim().toUpperCase()).sort();
          const correctOpts = String(correctAns).split(',').filter(Boolean).map(s => s.trim().toUpperCase()).sort();
          let hasWrong = false;
          let correctCount = 0;
          selectedOpts.forEach(opt => {
            if (correctOpts.includes(opt)) correctCount++;
            else hasWrong = true;
          });

          const msqCorrect = q.positive_marks || q.marks || exam?.marking_scheme?.msq_correct || 4;
          const msqWrong = q.negative_marks ? -Math.abs(q.negative_marks) : (exam?.marking_scheme?.msq_wrong ?? 0);
          const msqPartialEnabled = exam?.marking_scheme?.msq_partial_enabled ?? false;

          const configuredPartial = exam?.marking_scheme?.msq_partial;
          const msqPartialVal = (configuredPartial !== undefined && configuredPartial !== null && Number(configuredPartial) > 0)
            ? Number(configuredPartial)
            : (correctOpts.length > 0 ? Math.max(1, msqCorrect / correctOpts.length) : 1);

          if (hasWrong) {
            marksAwarded = msqWrong;
          } else if (correctCount === correctOpts.length) {
            marksAwarded = msqCorrect;
          } else if (correctCount > 0) {
            if (msqPartialEnabled) {
              marksAwarded = Math.round(msqPartialVal * correctCount * 100) / 100;
              isPartialMatch = true;
            } else {
              marksAwarded = msqWrong;
            }
          }
        } else if (String(studentAns).trim().toLowerCase() === String(correctAns).trim().toLowerCase()) {
          marksAwarded = q.positive_marks || q.marks || 1;
        } else {
          marksAwarded = q.negative_marks ? -Math.abs(q.negative_marks) : (q.question_type === 'mcq' ? -1 : 0);
        }
      }

      // Option formatting
      const selectedOpts = (studentAns !== undefined && studentAns !== null && String(studentAns).trim() !== '')
        ? String(studentAns).split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
        : [];
      const correctOpts = (correctAns !== undefined && correctAns !== null && String(correctAns).trim() !== '')
        ? String(correctAns).split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
        : [];

      let userAnswerText = 'Not Answered';
      let correctAnswerText = correctAns !== undefined && correctAns !== null ? String(correctAns) : 'N/A';
      
      const hasOptions = q.options && typeof q.options === 'object' && Object.keys(q.options).some(k => ['A', 'B', 'C', 'D'].includes(k) && (q.options[k] || q.options[`${k}_image`]));

      if (hasOptions) {
        userAnswerText = selectedOpts.length > 0 ? selectedOpts.map(o => `Option ${o}`).join(', ') : 'Not Answered';
        correctAnswerText = correctOpts.length > 0 ? correctOpts.map(o => `Option ${o}`).join(', ') : (correctAns ? String(correctAns) : 'N/A');
      } else {
        userAnswerText = (studentAns !== undefined && studentAns !== null && String(studentAns).trim() !== '') ? String(studentAns) : 'Not Answered';
      }

      let userAnswerColor = '#64748b';
      if (studentAns !== undefined && studentAns !== null && String(studentAns).trim() !== '') {
        if (isPartialMatch) userAnswerColor = '#d97706';
        else if (marksAwarded > 0) userAnswerColor = '#16a34a';
        else if (marksAwarded < 0) userAnswerColor = '#dc2626';
        else userAnswerColor = '#d97706';
      }

      // Question images
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
              <img src="${url}" style="max-width: 100%; max-height: 140px; object-fit: contain; border-radius: 6px; border: 1px solid #e2e8f0;" />
            </div>
          `;
        });
      }

      // Generate Options HTML
      let optionsHtml = '';

      if (hasOptions) {
        optionsHtml += `<div style="margin-top: 8px; display: flex; flex-direction: column; gap: 5px;">`;
        
        ['A', 'B', 'C', 'D'].forEach((key) => {
          const val = q.options[key];
          const imgVal = q.options[`${key}_image`];
          
          if (!val && !imgVal) return;
          
          const isCorrect = q.question_type === 'msq' || (correctAns && String(correctAns).includes(','))
            ? correctOpts.includes(key)
            : String(correctAns).trim().toUpperCase() === key;
          const isStudentAns = selectedOpts.includes(key);
          const isWrong = isStudentAns && !isCorrect;

          let boxStyle = `
            padding: 5px 8px;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 11px;
            background-color: #ffffff;
            page-break-inside: avoid;
          `;
          
          if (isStudentAns && isCorrect && isPartialMatch) {
            boxStyle = `padding: 1px 8px 11px 8px; border-radius: 6px; border: 1.5px solid #f59e0b; background-color: #ffffff; font-size: 11px; display: flex; justify-content: space-between; align-items: center; page-break-inside: avoid;`;
          } else if (isStudentAns && isCorrect) {
            boxStyle = `padding: 1px 8px 11px 8px; border-radius: 6px; border: 1.5px solid #22c55e; background-color: #ffffff; font-size: 11px; display: flex; justify-content: space-between; align-items: center; page-break-inside: avoid;`;
          } else if (isStudentAns && isWrong) {
            boxStyle = `padding: 1px 8px 11px 8px; border-radius: 6px; border: 1.5px solid #fca5a5; background-color: #ffffff; font-size: 11px; display: flex; justify-content: space-between; align-items: center; page-break-inside: avoid;`;
          } else {
            boxStyle = `padding: 1px 8px 11px 8px; border-radius: 6px; border: 1px solid #e2e8f0; background-color: #ffffff; font-size: 11px; display: flex; justify-content: space-between; align-items: center; page-break-inside: avoid;`;
          }

          let optionTextHtml = renderLatexToHtml(val || '', katex);
          let optionImageHtml = imgVal ? `
            <div style="margin-top: 4px;">
              <img src="${imgVal}" style="max-width: 140px; max-height: 80px; object-fit: contain; border-radius: 4px;" />
            </div>
          ` : '';

          let badgeHtml = '';
          if (isCorrect && isStudentAns && isPartialMatch) {
            badgeHtml = `<span style="color: #d97706; font-weight: 800; font-size: 10px; whitespace: nowrap;">✓ Partial (Your Ans)</span>`;
          } else if (isCorrect && isStudentAns) {
            badgeHtml = `<span style="color: #16a34a; font-weight: 800; font-size: 10px; whitespace: nowrap;">✓ Correct (Your Ans)</span>`;
          } else if (isWrong) {
            badgeHtml = `<span style="color: #dc2626; font-weight: 800; font-size: 10px; whitespace: nowrap;">✗ Your Ans (Wrong)</span>`;
          } else if (isCorrect) {
            badgeHtml = `<span style="color: #0f172a; font-weight: 700; font-size: 10px; whitespace: nowrap;">✓ Correct</span>`;
          }

          optionsHtml += `
            <div style="${boxStyle}">
              <div style="flex: 1; min-width: 0; padding-right: 6px; display: flex; align-items: center; gap: 4px;">
                <span style="font-weight: 800; color: #0f172a; flex-shrink: 0;">${key})</span>
                <span style="line-height: 1.35; color: #1e293b;">${optionTextHtml}</span>
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
        // NAT / Numerical Answer Type box
        const isAttempted = studentAns !== undefined && studentAns !== null && String(studentAns).trim() !== '';
        const isCorrect = isAttempted && String(studentAns).trim().toLowerCase() === String(correctAns).trim().toLowerCase();
        
        let bgStyle = "background-color: #ffffff; border: 1px solid #e2e8f0;";
        if (isCorrect) bgStyle = "background-color: #ffffff; border: 1.5px solid #22c55e;";
        else if (isAttempted) bgStyle = "background-color: #ffffff; border: 1.5px solid #fca5a5;";

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


      // Marks badge styling (clean outline badge, no heavy background fill)
      const marksBadgeStyle = isPartialMatch
        ? 'background-color: #ffffff; color: #b45309; border: 1px solid #fde68a;'
        : (marksAwarded > 0
          ? 'background-color: #ffffff; color: #15803d; border: 1px solid #86efac;'
          : (marksAwarded < 0
            ? 'background-color: #ffffff; color: #be123c; border: 1px solid #fecdd3;'
            : 'background-color: #ffffff; color: #64748b; border: 1px solid #e2e8f0;'));

      const marksText = isPartialMatch
        ? `+${marksAwarded} (Partial)`
        : `${marksAwarded > 0 ? '+' : ''}${marksAwarded}`;

      let explanationHtml = '';
      if (q.explanation) {
        const explanationTextHtml = renderLatexToHtml(q.explanation, katex);
        explanationHtml = `
          <div style="margin-top: 8px; padding: 6px 10px; border-radius: 6px; border: 1px solid #bfdbfe; background-color: #eff6ff; font-size: 10.5px; line-height: 1.35;">
            <div style="font-weight: 800; color: #1d4ed8; margin-bottom: 2px;">Explanation:</div>
            <div style="color: #1e293b;">${explanationTextHtml}</div>
          </div>
        `;
      }

      const qCardHtml = `
        <div style="box-sizing: border-box; margin-bottom: 10px; padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #ffffff; box-shadow: 0 1px 2px rgba(0,0,0,0.03); page-break-inside: avoid; break-inside: avoid;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; margin-bottom: 8px;">
            <span style="font-weight: 800; color: #0d9488; font-size: 11px; tracking-wide: 0.02em;">
              Q.${q.question_number || index + 1} | ${q.exam_subjects?.subject_name || 'General'}
            </span>
            <span style="font-weight: 800; font-size: 10px; padding: 0px 8px 6px 8px; border-radius: 12px; ${marksBadgeStyle}">
              Marks: ${marksText}
            </span>
          </div>
          <div style="font-size: 12px; line-height: 1.4; color: #0f172a; margin-bottom: 6px;">
            ${renderLatexToHtml(q.question_text || '', katex)}
          </div>
          ${imagesHtml}
          ${optionsHtml}
          ${explanationHtml}
        </div>
      `;

      // Split into Left vs Right column for true masonry layout
      if (index % 2 === 0) {
        leftQuestionsHtml += qCardHtml;
      } else {
        rightQuestionsHtml += qCardHtml;
      }
    });

    const formattedDate = new Date().toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const fullHtml = `
      <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; padding: 16px; max-width: 800px; margin: 0 auto; background-color: #ffffff;">
        
        <!-- Header Banner -->
        <div style="text-align: center; border-bottom: 2px solid #0d9488; padding-bottom: 10px; margin-bottom: 14px;">
          <h1 style="color: #0f766e; font-size: 24px; margin: 0 0 3px 0; font-weight: 900; letter-spacing: -0.01em;">${schoolName || 'Student Answer Key'}</h1>
          <h3 style="color: #64748b; font-size: 13px; margin: 0; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Answer Key &amp; Detailed Report</h3>
        </div>

        <!-- Student & Test Metadata Box -->
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; margin-bottom: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px;">
            <div style="display: flex; flex-wrap: wrap; gap: 8px 24px; font-size: 12px; color: #334155;">
              <div><strong style="color: #64748b; text-transform: uppercase; font-size: 10px; letter-spacing: 0.04em;">Test:</strong> <span style="font-weight: 700; color: #0f172a;">${testName}</span></div>
              <div><strong style="color: #64748b; text-transform: uppercase; font-size: 10px; letter-spacing: 0.04em;">Student:</strong> <span style="font-weight: 700; color: #0f172a;">${studentName}</span></div>
              <div><strong style="color: #64748b; text-transform: uppercase; font-size: 10px; letter-spacing: 0.04em;">Roll No:</strong> <span style="font-weight: 700; color: #0f172a;">${rollNo}</span></div>
              <div><strong style="color: #64748b; text-transform: uppercase; font-size: 10px; letter-spacing: 0.04em;">Date:</strong> <span style="font-weight: 600; color: #334155;">${formattedDate}</span></div>
            </div>
            
            <!-- Perfectly Centered Total Score Badge -->
            <div style="display: flex; align-items: center; justify-content: center; gap: 6px; flex-shrink: 0; background-color: #ccfbf1; border: 1px solid #99f6e4; padding: 0px 14px 12px 14px; border-radius: 8px; white-space: nowrap;">
              <span style="font-size: 11px; font-weight: 800; color: #0f766e; letter-spacing: 0.05em; line-height: 1;">SCORE</span>
              <span style="font-size: 20px; font-weight: 900; color: #0f766e; line-height: 1;">${marks}</span>
            </div>
          </div>


          <!-- Compact Subject Pills (Horizontal Row, No Wasted Whitespace) -->
          ${subjectBreakdownList.length > 0 ? `
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
          ` : ''}
        </div>

        <!-- True 2-Column Masonry Wrapper (Left & Right Column Containers) -->
        <div style="display: flex; gap: 10px; width: 100%; align-items: flex-start;">
          <div style="width: calc(50% - 5px); display: flex; flex-direction: column;">
            ${leftQuestionsHtml}
          </div>
          <div style="width: calc(50% - 5px); display: flex; flex-direction: column;">
            ${rightQuestionsHtml}
          </div>
        </div>

      </div>
    `;

    // 4. Generate and save PDF using html2pdf
    const safeFilename = `${studentName.replace(/[^a-zA-Z0-9]/g, '_')}_AnswerKey.pdf`;
    const opt: any = {
      margin: [10, 10, 10, 10],
      filename: safeFilename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true,
        logging: false
      },
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
