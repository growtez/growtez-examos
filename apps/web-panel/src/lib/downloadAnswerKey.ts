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
            const partialMarks = Math.round(msqPartialVal * correctCount * 100) / 100;
            subjectMap[sName].marks += partialMarks;
            subjectMap[sName].partial++;
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

    // 3. Construct HTML
    let questionsHtml = '';
    
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
          
          const configuredPartial = exam?.marking_scheme?.msq_partial;
          const msqPartialVal = (configuredPartial !== undefined && configuredPartial !== null && Number(configuredPartial) > 0)
            ? Number(configuredPartial)
            : (correctOpts.length > 0 ? Math.max(1, msqCorrect / correctOpts.length) : 1);

          if (hasWrong) {
            marksAwarded = msqWrong;
          } else if (correctCount === correctOpts.length) {
            marksAwarded = msqCorrect;
          } else if (correctCount > 0) {
            marksAwarded = Math.round(msqPartialVal * correctCount * 100) / 100;
            isPartialMatch = true;
          }
        } else if (String(studentAns).trim().toLowerCase() === String(correctAns).trim().toLowerCase()) {
          marksAwarded = q.positive_marks || q.marks || 1;
        } else {
          marksAwarded = q.negative_marks ? -Math.abs(q.negative_marks) : (q.question_type === 'mcq' ? -1 : 0);
        }
      }

      // Generate summary texts for Your Answer and Correct Answer
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

      let userAnswerColor = '#64748b'; // default gray for unattempted
      if (studentAns !== undefined && studentAns !== null && String(studentAns).trim() !== '') {
        if (isPartialMatch) userAnswerColor = '#d97706';
        else if (marksAwarded > 0) userAnswerColor = '#22c55e';
        else if (marksAwarded < 0) userAnswerColor = '#ef4444';
        else userAnswerColor = '#d97706';
      }

      const answerSummaryHtml = `
        <div style="margin-top: 8px; margin-bottom: 12px; padding: 8px 12px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 8px; font-size: 12px;">
          <div>
            <span style="font-weight: 700; color: #475569; margin-right: 4px;">Your Answer:</span>
            <span style="font-weight: 700; color: ${userAnswerColor};">${escapeHtml(userAnswerText)}</span>
          </div>
          <div>
            <span style="font-weight: 700; color: #475569; margin-right: 4px;">Correct Answer:</span>
            <span style="font-weight: 700; color: #22c55e;">${escapeHtml(correctAnswerText)}</span>
          </div>
        </div>
      `;

      // Parse question images
      let imagesHtml = '';
      if (q.image_url) {
        const parseQuestionImages = (urlStr: string | null): string[] => {
          if (!urlStr) return [];
          const trimmed = urlStr.trim();
          if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            try {
              return JSON.parse(trimmed);
            } catch (e) {
              return [trimmed];
            }
          }
          return [trimmed];
        };
        const images = parseQuestionImages(q.image_url);
        images.forEach((url) => {
          imagesHtml += `
            <div style="margin-top: 10px; margin-bottom: 10px;">
              <img src="${url}" style="max-width: 100%; max-height: 200px; object-fit: contain; border-radius: 4px;" />
            </div>
          `;
        });
      }

      // Generate Options HTML
      let optionsHtml = '';

      if (hasOptions) {
        optionsHtml += `<div style="margin-top: 12px; display: flex; flex-direction: column; gap: 8px;">`;
        
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
            padding: 10px 12px;
            border-radius: 6px;
            border: 1px solid #e0f2f2;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
            page-break-inside: avoid;
          `;
          
          if (isCorrect && isStudentAns && isPartialMatch) {
            boxStyle += `
              border: 2px solid #f59e0b;
              background-color: #fffbeb;
            `;
          } else if (isCorrect) {
            boxStyle += `
              border: 2px solid #22c55e;
              background-color: #f0fdf4;
            `;
          } else if (isWrong) {
            boxStyle += `
              border: 2px solid #ef4444;
              background-color: #fef2f2;
            `;
          }

          let optionTextHtml = renderLatexToHtml(val || '', katex);
          let optionImageHtml = imgVal ? `
            <div style="margin-top: 6px;">
              <img src="${imgVal}" style="max-width: 200px; max-height: 120px; object-fit: contain; border-radius: 4px;" />
            </div>
          ` : '';

          let badgeHtml = '';
          if (isCorrect && isStudentAns && isPartialMatch) {
            badgeHtml = `<span style="color: #d97706; font-weight: bold; font-size: 11px;">✓ Partial &amp; Your Answer</span>`;
          } else if (isCorrect && isStudentAns) {
            badgeHtml = `<span style="color: #22c55e; font-weight: bold; font-size: 11px;">✓ Correct &amp; Your Answer</span>`;
          } else if (isCorrect) {
            badgeHtml = `<span style="color: #22c55e; font-weight: bold; font-size: 11px;">✓ Correct Answer</span>`;
          } else if (isWrong) {
            badgeHtml = `<span style="color: #ef4444; font-weight: bold; font-size: 11px;">✗ Your Answer (Incorrect)</span>`;
          }

          optionsHtml += `
            <div style="${boxStyle}">
              <div style="flex: 1; min-width: 0; padding-right: 15px;">
                <span style="font-weight: bold; margin-right: 4px; font-size: 13px;">${key})</span>
                <span style="font-size: 13px; line-height: 1.4;">${optionTextHtml}</span>
                ${optionImageHtml}
              </div>
              <div style="flex-shrink: 0; text-align: right; width: 150px;">
                ${badgeHtml}
              </div>
            </div>
          `;
        });

        optionsHtml += `</div>`;
      } else {
        // Handle NAT or other types without options
        let boxStyle = `
          padding: 12px;
          border-radius: 6px;
          border: 1px solid #e0f2f2;
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 12px;
          background-color: #f8fafc;
          page-break-inside: avoid;
        `;

        optionsHtml += `
          <div style="${boxStyle}">
            <div style="font-size: 13px; color: #334155;">
              <span style="font-weight: 600; margin-right: 8px;">Your Answer:</span>
              <span style="color: ${userAnswerColor}; font-weight: 700;">${escapeHtml(userAnswerText)}</span>
            </div>
            <div style="font-size: 13px; color: #334155;">
              <span style="font-weight: 600; margin-right: 8px;">Correct Answer:</span>
              <span style="color: #22c55e; font-weight: 700;">${escapeHtml(correctAnswerText)}</span>
            </div>
          </div>
        `;
      }

      // Combine Question HTML
      const questionTextHtml = renderLatexToHtml(q.question_text || '', katex);
      const marksColor = isPartialMatch
        ? '#d97706'
        : (marksAwarded > 0 ? '#22c55e' : (marksAwarded < 0 ? '#ef4444' : '#8ab8b8'));
      const marksText = isPartialMatch
        ? `Marks: +${marksAwarded} (Partial)`
        : `Marks: ${marksAwarded > 0 ? '+' : ''}${marksAwarded}`;

      questionsHtml += `
        <div style="margin-bottom: 25px; padding: 15px; border: 1px solid #e0f2f2; border-radius: 8px; background-color: #ffffff; page-break-inside: avoid;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f5f9f9; padding-bottom: 8px; margin-bottom: 10px;">
            <span style="font-weight: bold; color: #008080; font-size: 13px;">
              Q.${q.question_number || index + 1} | ${q.exam_subjects?.subject_name || 'General'}
            </span>
            <span style="font-weight: bold; color: ${marksColor}; font-size: 13px;">
              ${marksText}
            </span>
          </div>
          <div style="font-size: 14px; line-height: 1.5; color: #333333; margin-bottom: 10px;">
            ${questionTextHtml}
          </div>
          ${answerSummaryHtml}
          ${imagesHtml}
          ${optionsHtml}
        </div>
      `;
    });

    const formattedDate = new Date().toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const fullHtml = `
      <div style="font-family: system-ui, -apple-system, sans-serif; color: #1a2e2e; padding: 20px; max-width: 800px; margin: 0 auto; background-color: #ffffff;">
        <div style="text-align: center; border-bottom: 2px solid #e0f2f2; padding-bottom: 15px; margin-bottom: 20px;">
          <h1 style="color: #008080; font-size: 26px; margin: 0 0 5px 0; font-weight: 800;">${schoolName || 'Student Answer Key'}</h1>
          <h3 style="color: #555555; font-size: 16px; margin: 0 0 10px 0; font-weight: 600;">Answer Key &amp; Detailed Report</h3>
        </div>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 25px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 15px;">
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <div style="font-size: 13px; color: #475569;"><strong style="color: #1e293b;">Test Name:</strong> ${testName}</div>
              <div style="font-size: 13px; color: #475569;"><strong style="color: #1e293b;">Student Name:</strong> ${studentName}</div>
              <div style="font-size: 13px; color: #475569;"><strong style="color: #1e293b;">Roll Number:</strong> ${rollNo}</div>
              <div style="font-size: 13px; color: #475569;"><strong style="color: #1e293b;">Date Generated:</strong> ${formattedDate}</div>
            </div>
            <div style="text-align: right; display: flex; flex-direction: column; justify-content: center; height: 100%;">
              <div style="font-size: 11px; text-transform: uppercase; font-weight: bold; color: #64748b; letter-spacing: 0.05em; margin-bottom: 4px;">Total Score</div>
              <div style="font-size: 32px; font-weight: 900; color: #008080; line-height: 1;">${marks}</div>
            </div>
          </div>

          ${subjectBreakdownList.length > 0 ? `
            <div style="margin-top: 15px; padding-top: 12px; border-top: 1px solid #e2e8f0;">
              <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748b; letter-spacing: 0.05em; margin-bottom: 8px;">
                Subject Marks Breakdown
              </div>
              <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                ${subjectBreakdownList.map(sb => `
                  <div style="flex: 1; min-width: 140px; background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 14px;">
                    <div style="font-size: 13px; font-weight: 700; color: #008080; line-height: 1.4; padding-bottom: 2px; margin-bottom: 4px; word-break: break-word;">${escapeHtml(sb.subjectName)}</div>
                    <div style="font-size: 15px; font-weight: 800; color: #0f172a; margin: 2px 0 4px 0;">
                      ${sb.marks} <span style="font-size: 11px; font-weight: 500; color: #64748b;">/ ${sb.maxMarks} marks</span>
                    </div>
                    <div style="font-size: 10px; color: #475569; font-weight: 500; line-height: 1.4;">
                      <span style="color: #22c55e; font-weight: 700;">${sb.correct} Correct</span> • 
                      ${sb.partial > 0 ? `<span style="color: #d97706; font-weight: 700;">${sb.partial} Partial</span> • ` : ''}
                      <span style="color: #ef4444; font-weight: 700;">${sb.wrong} Wrong</span> • 
                      <span style="color: #64748b;">${sb.unattempted} Unattempted</span>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>

        <div style="margin-top: 20px;">
          ${questionsHtml}
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
