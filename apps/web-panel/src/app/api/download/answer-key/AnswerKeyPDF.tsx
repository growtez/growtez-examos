import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { evaluateQuestion, calculateSubjectBreakdown } from '@/lib/downloadAnswerKey';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    paddingTop: 30,
    paddingBottom: 40,
    paddingHorizontal: 30,
    backgroundColor: '#ffffff',
    fontSize: 10,
  },
  headerBanner: {
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#0d9488',
    paddingBottom: 8,
    marginBottom: 10,
  },
  title: {
    color: '#0f766e',
    fontSize: 18,
    marginBottom: 2,
    fontFamily: 'Helvetica-Bold',
  },
  subtitle: {
    color: '#555555',
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headerCard: {
    marginBottom: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 7,
    padding: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerText: {
    fontSize: 9,
    color: '#475569',
    marginBottom: 2,
  },
  headerBold: {
    fontFamily: 'Helvetica-Bold',
    color: '#1e293b',
  },
  scoreContainer: {
    alignItems: 'center',
    backgroundColor: '#ccfbf1',
    borderWidth: 1,
    borderColor: '#99f6e4',
    borderRadius: 7,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  scoreLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#0f766e',
    marginBottom: 1,
  },
  score: {
    color: '#0f766e',
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
  },
  subjectSection: {
    marginTop: 7,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#cbd5e1',
  },
  subjectTitle: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#64748b',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  subjectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  subjectCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 4,
    padding: 6,
    minWidth: 100,
    flex: 1,
  },
  subjectName: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#0f766e',
    marginBottom: 2,
  },
  subjectMarks: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  subjectMaxMarks: {
    fontSize: 8,
    fontFamily: 'Helvetica',
    color: '#64748b',
  },
  subjectStats: {
    fontSize: 8,
    marginTop: 2,
  },
  // Single column question layout
  questionsContainer: {
    flexDirection: 'column',
  },
  questionBox: {
    width: '100%',
    marginBottom: 8,
    backgroundColor: '#ffffff',
    padding: 10,
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 6,
  },
  imagesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  imageItem: {
    width: '48.5%',
    maxHeight: 160,
    objectFit: 'contain',
    borderRadius: 4,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 4,
  },
  questionNumber: {
    fontFamily: 'Helvetica-Bold',
    color: '#0f766e',
    fontSize: 8,
  },
  marksPositive: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    color: '#22c55e',
  },
  marksNegative: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    color: '#ef4444',
  },
  marksZero: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    color: '#8ab8b8',
  },
  marksPartial: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    color: '#d97706',
  },
  questionText: {
    fontSize: 8,
    lineHeight: 1.35,
    color: '#333333',
    marginBottom: 5,
  },
  summaryBanner: {
    flexDirection: 'column',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    padding: 4,
    marginBottom: 5,
    gap: 2,
  },
  summaryText: {
    fontSize: 8,
    color: '#475569',
  },
  optionsContainer: {
    marginTop: 4,
    flexDirection: 'column',
    gap: 3,
  },
  optionBox: {
    padding: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e0f2f2',
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 3,
  },
  optionBoxCorrect: {
    borderColor: '#16a34a',
    backgroundColor: '#bbf7d0',
    borderWidth: 2,
  },
  optionBoxCorrectAnswer: {
    borderColor: '#1e293b',
    backgroundColor: '#f1f5f9',
    borderWidth: 2,
  },
  optionBoxPartial: {
    borderColor: '#f59e0b',
    backgroundColor: '#fde68a',
    borderWidth: 2,
  },
  optionBoxWrong: {
    borderColor: '#dc2626',
    backgroundColor: '#fecaca',
    borderWidth: 2,
  },
  optionText: {
    fontSize: 8,
    color: '#333333',
    flex: 1,
  },
  optionLabelBadge: {
    fontSize: 6,
    fontFamily: 'Helvetica-Bold',
    marginTop: 1,
  },
  optionLabelCorrect: {
    color: '#22c55e',
  },
  optionLabelPartial: {
    color: '#d97706',
  },
  optionLabelWrong: {
    color: '#ef4444',
  },
  natBox: {
    padding: 5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    marginTop: 4,
    gap: 2,
  },
  // Page number at bottom
  pageNumberText: {
    position: 'absolute',
    bottom: 14,
    right: 30,
    fontSize: 7,
    color: '#94a3b8',
  },
});

const renderTextWithMathOffset = (text: string | null | undefined) => {
  if (!text) return null;
  // Match mathematical alphanumeric symbols (U+1D400 - U+1D7FF) and letterlike symbols (U+2100 - U+214F)
  const mathRegex = /([\u2100-\u214F\u{1D400}-\u{1D7FF}]+)/gu;
  
  if (!text.match(mathRegex)) {
    return text;
  }

  const parts = text.split(mathRegex);
  return parts.map((part, index) => {
    if (part.match(mathRegex)) {
      // Shift math Unicode characters up slightly to align with Helvetica's baseline
      return <Text key={index} style={{ position: 'relative', top: -1.5 }}>{part}</Text>;
    }
    return <Text key={index}>{part}</Text>;
  });
};

export const AnswerKeyPDF = ({ result, exam, questions, schoolName }: any) => {
  const testName = exam?.title || 'Exam';
  const studentName = result.students?.full_name || 'Unknown';
  const rollNo = result.students?.roll_number || 'N/A';
  const studentAnswers = result.answers || {};
  const formattedDate = exam?.start_time
    ? new Date(exam.start_time).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'N/A';

  // Calculate subject breakdown
  const subjectMap: Record<string, {
    subjectName: string; marks: number; maxMarks: number;
    correct: number; partial: number; wrong: number; unattempted: number;
  }> = {};

  questions.forEach((q: any) => {
    const sName = q.exam_subjects?.subject_name || 'General';
    if (!subjectMap[sName]) {
      subjectMap[sName] = { subjectName: sName, marks: 0, maxMarks: 0, correct: 0, partial: 0, wrong: 0, unattempted: 0 };
    }
    const qMaxMarks = q.positive_marks || q.marks || 1;
    subjectMap[sName].maxMarks += qMaxMarks;

    const studentAns = studentAnswers[q.id]?.answer;
    const correctAns = q.correct_option;

    if (studentAns === undefined || studentAns === null || String(studentAns).trim() === '') {
      subjectMap[sName].unattempted++;
    } else {
      const isMsq = q.question_type === 'msq' || (correctAns && String(correctAns).includes(','));
      if (isMsq) {
        const selectedOpts = String(studentAns).split(',').filter(Boolean).map((s: string) => s.trim().toUpperCase()).sort();
        const correctOpts = String(correctAns).split(',').filter(Boolean).map((s: string) => s.trim().toUpperCase()).sort();
        let hasWrong = false; let correctCount = 0;
        selectedOpts.forEach((opt: string) => { if (correctOpts.includes(opt)) correctCount++; else hasWrong = true; });
        const msqCorrect = q.positive_marks || q.marks || exam?.marking_scheme?.msq_correct || 4;
        const msqWrong = q.negative_marks ? -Math.abs(q.negative_marks) : (exam?.marking_scheme?.msq_wrong ?? 0);
        const configuredPartial = exam?.marking_scheme?.msq_partial;
        const msqPartialVal = (configuredPartial !== undefined && configuredPartial !== null && Number(configuredPartial) > 0)
          ? Number(configuredPartial) : (correctOpts.length > 0 ? Math.max(1, msqCorrect / correctOpts.length) : 1);
        if (hasWrong) { subjectMap[sName].marks += msqWrong; subjectMap[sName].wrong++; }
        else if (correctCount === correctOpts.length) { subjectMap[sName].marks += msqCorrect; subjectMap[sName].correct++; }
        else if (correctCount > 0) { subjectMap[sName].marks += Math.round(msqPartialVal * correctCount * 100) / 100; subjectMap[sName].partial++; }
        else { subjectMap[sName].unattempted++; }
      } else if (String(studentAns).trim().toLowerCase() === String(correctAns).trim().toLowerCase()) {
        subjectMap[sName].marks += qMaxMarks; subjectMap[sName].correct++;
      } else {
        const negMarks = q.negative_marks ? -Math.abs(q.negative_marks) : (q.question_type === 'mcq' ? -1 : 0);
        subjectMap[sName].marks += negMarks; subjectMap[sName].wrong++;
      }
    }
  });

  const subjectBreakdownList = Object.values(subjectMap);
  const totalScore = subjectBreakdownList.reduce((acc, sb) => acc + sb.marks, 0);
  const maxScore = subjectBreakdownList.reduce((acc, sb) => acc + sb.maxMarks, 0);
  const marks = `${totalScore} / ${maxScore}`;

  // Pre-compute per-question evaluation
  const evaluatedQuestions = questions.map((q: any, index: number) => {
    const studentAns = studentAnswers[q.id]?.answer;
    const correctAns = q.correct_option;
    let marksAwarded = 0;
    let isPartialMatch = false;

    if (studentAns !== undefined && studentAns !== null && String(studentAns).trim() !== '') {
      const isMsq = q.question_type === 'msq' || (correctAns && String(correctAns).includes(','));
      if (isMsq) {
        const selectedOpts = String(studentAns).split(',').filter(Boolean).map((s: string) => s.trim().toUpperCase()).sort();
        const correctOpts = String(correctAns).split(',').filter(Boolean).map((s: string) => s.trim().toUpperCase()).sort();
        let hasWrong = false; let correctCount = 0;
        selectedOpts.forEach((opt: string) => { if (correctOpts.includes(opt)) correctCount++; else hasWrong = true; });
        const msqCorrect = q.positive_marks || q.marks || exam?.marking_scheme?.msq_correct || 4;
        const msqWrong = q.negative_marks ? -Math.abs(q.negative_marks) : (exam?.marking_scheme?.msq_wrong ?? 0);
        const configuredPartial = exam?.marking_scheme?.msq_partial;
        const msqPartialVal = (configuredPartial !== undefined && configuredPartial !== null && Number(configuredPartial) > 0)
          ? Number(configuredPartial) : (correctOpts.length > 0 ? Math.max(1, msqCorrect / correctOpts.length) : 1);
        if (hasWrong) marksAwarded = msqWrong;
        else if (correctCount === correctOpts.length) marksAwarded = msqCorrect;
        else if (correctCount > 0) { marksAwarded = Math.round(msqPartialVal * correctCount * 100) / 100; isPartialMatch = true; }
      } else if (String(studentAns).trim().toLowerCase() === String(correctAns).trim().toLowerCase()) {
        marksAwarded = q.positive_marks || q.marks || 1;
      } else {
        marksAwarded = q.negative_marks ? -Math.abs(q.negative_marks) : (q.question_type === 'mcq' ? -1 : 0);
      }
    }

    const selectedOpts = (studentAns !== undefined && studentAns !== null && String(studentAns).trim() !== '')
      ? String(studentAns).split(',').map((s: string) => s.trim().toUpperCase()).filter(Boolean) : [];
    const correctOpts = (correctAns !== undefined && correctAns !== null && String(correctAns).trim() !== '')
      ? String(correctAns).split(',').map((s: string) => s.trim().toUpperCase()).filter(Boolean) : [];

    const hasOptions = q.options && typeof q.options === 'object' &&
      Object.keys(q.options).some(k => ['A', 'B', 'C', 'D'].includes(k) && (q.options[k] || q.options[`${k}_image`]));

    let userAnswerText = 'Not Answered';
    let correctAnswerText = correctAns !== undefined && correctAns !== null ? String(correctAns) : 'N/A';
    if (hasOptions) {
      userAnswerText = selectedOpts.length > 0 ? selectedOpts.join(', ') : 'Not Answered';
      correctAnswerText = correctOpts.length > 0 ? correctOpts.join(', ') : (correctAns ? String(correctAns) : 'N/A');
    } else {
      userAnswerText = (studentAns !== undefined && studentAns !== null && String(studentAns).trim() !== '') ? String(studentAns) : 'Not Answered';
    }

    let userAnswerColor = '#64748b';
    if (studentAns !== undefined && studentAns !== null && String(studentAns).trim() !== '') {
      if (isPartialMatch) userAnswerColor = '#d97706';
      else if (marksAwarded > 0) userAnswerColor = '#22c55e';
      else if (marksAwarded < 0) userAnswerColor = '#ef4444';
      else userAnswerColor = '#d97706';
    }

    // Parse question images
    const parseImages = (urlStr: string | null): string[] => {
      if (!urlStr) return [];
      const trimmed = urlStr.trim();
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try { return JSON.parse(trimmed); } catch { return [trimmed]; }
      }
      return [trimmed];
    };

    return {
      q, index, marksAwarded, isPartialMatch, selectedOpts, correctOpts,
      hasOptions, userAnswerText, correctAnswerText, userAnswerColor,
      images: parseImages(q.image_url),
    };
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header — rendered once, no 'fixed' */}
        <View style={styles.headerBanner}>
          <Text style={styles.title}>{schoolName || 'Student Answer Key'}</Text>
          <Text style={styles.subtitle}>Answer Key & Detailed Report</Text>
        </View>

        {/* Student info card */}
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerText}>
                <Text style={styles.headerBold}>Test: </Text>{testName}
              </Text>
              <Text style={styles.headerText}>
                <Text style={styles.headerBold}>Student: </Text>{studentName}
              </Text>
              <Text style={styles.headerText}>
                <Text style={styles.headerBold}>Roll No: </Text>{rollNo}
              </Text>
              <Text style={styles.headerText}>
                <Text style={styles.headerBold}>Date: </Text>{formattedDate}
              </Text>
            </View>
            <View style={styles.scoreContainer}>
              <Text style={styles.scoreLabel}>SCORE</Text>
              <Text style={styles.score}>{marks}</Text>
            </View>
          </View>

          {subjectBreakdownList.length > 0 && (
            <View style={styles.subjectSection}>
              <Text style={styles.subjectTitle}>Subject Breakdown</Text>
              <View style={styles.subjectGrid}>
                {subjectBreakdownList.map((sb, idx) => (
                  <View key={idx} style={styles.subjectCard}>
                    <Text style={styles.subjectName}>{sb.subjectName}</Text>
                    <Text style={styles.subjectMarks}>
                      {sb.marks}<Text style={styles.subjectMaxMarks}> / {sb.maxMarks}m</Text>
                    </Text>
                    <Text style={styles.subjectStats}>
                      <Text style={{ color: '#22c55e', fontFamily: 'Helvetica-Bold' }}>{sb.correct}C </Text>
                      {sb.partial > 0 && <Text style={{ color: '#d97706', fontFamily: 'Helvetica-Bold' }}>{sb.partial}P </Text>}
                      <Text style={{ color: '#ef4444', fontFamily: 'Helvetica-Bold' }}>{sb.wrong}W </Text>
                      <Text style={{ color: '#64748b' }}>{sb.unattempted}U</Text>
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Questions — 2-col grid, flows naturally across pages */}
        <View style={styles.questionsContainer}>
          {evaluatedQuestions.map(({ q, index, marksAwarded, isPartialMatch, selectedOpts, correctOpts, hasOptions, userAnswerText, correctAnswerText, userAnswerColor, images }: {
            q: any; index: number; marksAwarded: number; isPartialMatch: boolean;
            selectedOpts: string[]; correctOpts: string[]; hasOptions: boolean;
            userAnswerText: string; correctAnswerText: string; userAnswerColor: string;
            images: string[];
          }) => {
            const marksStyle = isPartialMatch ? styles.marksPartial
              : marksAwarded > 0 ? styles.marksPositive
              : marksAwarded < 0 ? styles.marksNegative
              : styles.marksZero;

            const marksLabel = isPartialMatch
              ? `+${marksAwarded} (Partial)`
              : `${marksAwarded > 0 ? '+' : ''}${marksAwarded}`;

            return (
              <View key={q.id || index} style={styles.questionBox} wrap={false}>
                {/* Card header */}
                <View style={styles.questionHeader}>
                  <Text style={styles.questionNumber}>
                    Q.{q.question_number || index + 1} | {q.exam_subjects?.subject_name || 'General'}
                  </Text>
                  <Text style={marksStyle}>{marksLabel}</Text>
                </View>

                {/* Question text */}
                {q.question_text && (
                  <Text style={styles.questionText}>{q.question_text}</Text>
                )}

                {/* Question image */}
                {images.length > 0 && (
                  <View style={styles.imagesRow}>
                    {images.map((url: string, idx: number) => (
                      <Image key={idx} src={url} style={styles.imageItem} />
                    ))}
                  </View>
                )}

                {/* Answer summary */}
                <View style={styles.summaryBanner}>
                  <Text style={styles.summaryText}>
                    <Text style={styles.headerBold}>Your Answer: </Text>
                    <Text style={{ color: userAnswerColor, fontFamily: 'Helvetica-Bold' }}>{renderTextWithMathOffset(userAnswerText)}</Text>
                  </Text>
                  <Text style={styles.summaryText}>
                    <Text style={styles.headerBold}>Correct: </Text>
                    <Text style={{ color: '#22c55e', fontFamily: 'Helvetica-Bold' }}>{correctAnswerText}</Text>
                  </Text>
                </View>

                {/* Options (MCQ / MSQ) */}
                {hasOptions ? (
                  <View style={styles.optionsContainer}>
                    {['A', 'B', 'C', 'D'].map(key => {
                      const val = q.options[key];
                      const imgVal = q.options[`${key}_image`];
                      if (!val && !imgVal) return null;

                      const isCorrect = (q.question_type === 'msq' || (q.correct_option && String(q.correct_option).includes(',')))
                        ? correctOpts.includes(key)
                        : String(q.correct_option || '').trim().toUpperCase() === key;
                      const isStudentAns = selectedOpts.includes(key);
                      const isWrong = isStudentAns && !isCorrect;

                      let boxStyle: any = { ...styles.optionBox };
                      if (isCorrect && isStudentAns && isPartialMatch) boxStyle = { ...boxStyle, ...styles.optionBoxPartial };
                      else if (isCorrect && isStudentAns) boxStyle = { ...boxStyle, ...styles.optionBoxCorrect };
                      else if (isCorrect && !isStudentAns) boxStyle = { ...boxStyle, ...styles.optionBoxCorrectAnswer };
                      else if (isWrong) boxStyle = { ...boxStyle, ...styles.optionBoxWrong };

                      return (
                        <View key={key} style={boxStyle}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.optionText}>
                              <Text style={styles.headerBold}>{key}) </Text>{val || ''}
                            </Text>
                            {imgVal && <Image src={imgVal} style={{ maxWidth: '100%', maxHeight: 80, marginTop: 3, objectFit: 'contain' }} />}
                            {isCorrect && isStudentAns && isPartialMatch && <Text style={[styles.optionLabelBadge, styles.optionLabelPartial]}>✓ Partial & Your Ans</Text>}
                            {isCorrect && isStudentAns && !isPartialMatch && <Text style={[styles.optionLabelBadge, styles.optionLabelCorrect]}>✓ Correct & Your Ans</Text>}
                            {isCorrect && !isStudentAns && <Text style={[styles.optionLabelBadge, { color: '#334155' }]}>✓ Correct Answer</Text>}
                            {isWrong && <Text style={[styles.optionLabelBadge, styles.optionLabelWrong]}>✗ Your Wrong Ans</Text>}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  /* NAT question */
                  <View style={styles.natBox}>
                    <Text style={styles.optionText}>
                      <Text style={styles.headerBold}>Correct: </Text>
                      <Text style={{ color: '#22c55e', fontFamily: 'Helvetica-Bold' }}>{correctAnswerText}</Text>
                    </Text>
                    <Text style={styles.optionText}>
                      <Text style={styles.headerBold}>Your Answer: </Text>
                      <Text style={{ color: userAnswerColor, fontFamily: 'Helvetica-Bold' }}>{userAnswerText}</Text>
                    </Text>
                  </View>
                )}

                {/* Explanation */}
                {q.explanation && (
                  <View style={{ marginTop: 4, padding: 4, borderRadius: 3, borderWidth: 1, borderColor: '#bfdbfe', backgroundColor: '#eff6ff' }}>
                    <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 7, color: '#1d4ed8', marginBottom: 1 }}>Explanation:</Text>
                    <Text style={{ fontSize: 7, color: '#1e293b', lineHeight: 1.3 }}>{q.explanation}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Page numbers — absolute at bottom of every page */}
        <Text
          style={styles.pageNumberText}
          render={({ pageNumber, totalPages }) => `${schoolName || 'Growtez ExamOS'} — Page ${pageNumber} of ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
};
