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

    // 3. Construct HTML
    let questionsHtml = '';
    
    questions.forEach((q: any, index: number) => {
      const studentAns = studentAnswers[q.id]?.answer;
      const correctAns = q.correct_option;
      
      let marksAwarded = 0;
      if (studentAns !== undefined && studentAns !== null && studentAns !== '') {
        if (q.question_type === 'msq') {
          const selectedOpts = String(studentAns).split(',').filter(Boolean).sort();
          const correctOpts = String(q.correct_option).split(',').filter(Boolean).sort();
          let hasWrong = false;
          let correctCount = 0;
          selectedOpts.forEach(opt => {
            if (correctOpts.includes(opt)) correctCount++;
            else hasWrong = true;
          });
          const msqCorrect = exam?.marking_scheme?.msq_correct ?? 4;
          const msqPartial = exam?.marking_scheme?.msq_partial ?? 1;
          const msqWrong = exam?.marking_scheme?.msq_wrong ?? 0;
          const msqPartialEnabled = exam?.marking_scheme?.msq_partial_enabled ?? true;

          if (hasWrong) {
            marksAwarded = msqWrong;
          } else if (correctCount === correctOpts.length) {
            marksAwarded = msqCorrect;
          } else {
            if (msqPartialEnabled) {
              marksAwarded = msqPartial * correctCount;
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
      const hasOptions = q.options && typeof q.options === 'object' && Object.keys(q.options).some(k => ['A', 'B', 'C', 'D'].includes(k) && (q.options[k] || q.options[`${k}_image`]));

      if (hasOptions) {
        optionsHtml += `<div style="margin-top: 12px; display: flex; flex-direction: column; gap: 8px;">`;
        
        ['A', 'B', 'C', 'D'].forEach((key) => {
          const val = q.options[key];
          const imgVal = q.options[`${key}_image`];
          
          if (!val && !imgVal) return;
          
          const isCorrect = q.question_type === 'msq'
            ? String(correctAns).trim().toUpperCase().split(',').includes(key)
            : String(correctAns).trim().toUpperCase() === key;
          const isStudentAns = q.question_type === 'msq'
            ? studentAns !== undefined && studentAns !== null && String(studentAns).trim().toUpperCase().split(',').includes(key)
            : studentAns !== undefined && studentAns !== null && String(studentAns).trim().toUpperCase() === key;
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
          
          if (isCorrect) {
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
          if (isCorrect) {
            badgeHtml = `<span style="color: #22c55e; font-weight: bold; font-size: 11px;">✓ Correct Answer</span>`;
          } else if (isWrong) {
            badgeHtml = `<span style="color: #ef4444; font-weight: bold; font-size: 11px;">✗ Your Answer</span>`;
          }

          optionsHtml += `
            <div style="${boxStyle}">
              <div style="flex: 1; min-width: 0; padding-right: 15px;">
                <span style="font-weight: bold; margin-right: 4px; font-size: 13px;">${key})</span>
                <span style="font-size: 13px; line-height: 1.4;">${optionTextHtml}</span>
                ${optionImageHtml}
              </div>
              <div style="flex-shrink: 0; text-align: right; width: 120px;">
                ${badgeHtml}
              </div>
            </div>
          `;
        });

        optionsHtml += `</div>`;
      } else {
        // Handle NAT or other types without options
        const isCorrect = marksAwarded > 0;
        const hasAnswered = studentAns !== undefined && studentAns !== null && studentAns !== '';
        
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

        let studentAnsText = hasAnswered ? String(studentAns) : 'Not Answered';
        let studentAnsColor = hasAnswered ? (isCorrect ? '#22c55e' : '#ef4444') : '#94a3b8';
        let correctAnsText = (correctAns !== undefined && correctAns !== null) ? String(correctAns) : 'N/A';

        optionsHtml += `
          <div style="${boxStyle}">
            <div style="font-size: 13px; color: #334155;">
              <span style="font-weight: 600; margin-right: 8px;">Your Answer:</span>
              <span style="color: ${studentAnsColor}; font-weight: 600;">${escapeHtml(studentAnsText)}</span>
            </div>
            <div style="font-size: 13px; color: #334155;">
              <span style="font-weight: 600; margin-right: 8px;">Correct Answer:</span>
              <span style="color: #22c55e; font-weight: 600;">${escapeHtml(correctAnsText)}</span>
            </div>
          </div>
        `;
      }

      // Combine Question HTML
      const questionTextHtml = renderLatexToHtml(q.question_text || '', katex);
      const marksColor = marksAwarded > 0 ? '#22c55e' : (marksAwarded < 0 ? '#ef4444' : '#8ab8b8');
      const marksText = `${marksAwarded > 0 ? '+' : ''}${marksAwarded}`;

      questionsHtml += `
        <div style="margin-bottom: 25px; padding: 15px; border: 1px solid #e0f2f2; border-radius: 8px; background-color: #ffffff; page-break-inside: avoid;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f5f9f9; padding-bottom: 8px; margin-bottom: 10px;">
            <span style="font-weight: bold; color: #008080; font-size: 13px;">
              Q.${q.question_number || index + 1} | ${q.exam_subjects?.subject_name || 'General'}
            </span>
            <span style="font-weight: bold; color: ${marksColor}; font-size: 13px;">
              Marks: ${marksText}
            </span>
          </div>
          <div style="font-size: 14px; line-height: 1.5; color: #333333; margin-bottom: 10px;">
            ${questionTextHtml}
          </div>
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
          <h3 style="color: #555555; font-size: 16px; margin: 0 0 10px 0; font-weight: 600;">Answer Key & Detailed Report</h3>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: flex-start; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 25px;">
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
