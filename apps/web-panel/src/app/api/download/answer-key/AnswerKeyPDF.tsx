import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { evaluateQuestion, calculateSubjectBreakdown } from '@/lib/downloadAnswerKey';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    padding: 30,
    backgroundColor: '#ffffff',
  },
  title: {
    color: '#008080',
    fontSize: 24,
    marginBottom: 5,
    fontFamily: 'Helvetica-Bold',
  },
  subtitle: {
    color: '#555555',
    fontSize: 14,
    marginBottom: 15,
    fontFamily: 'Helvetica',
  },
  headerCard: {
    marginBottom: 20,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerText: {
    fontSize: 11,
    color: '#475569',
    marginBottom: 3,
  },
  headerBold: {
    fontFamily: 'Helvetica-Bold',
    color: '#1e293b',
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  scoreLabel: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#64748b',
    marginBottom: 2,
  },
  score: {
    color: '#008080',
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
  },
  subjectSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#cbd5e1',
  },
  subjectTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#64748b',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  subjectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  subjectCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    padding: 8,
    minWidth: 120,
    flex: 1,
  },
  subjectName: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#008080',
    marginBottom: 4,
    lineHeight: 1.3,
  },
  subjectMarks: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  subjectMaxMarks: {
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#64748b',
  },
  subjectStats: {
    fontSize: 8,
    marginTop: 2,
  },
  questionBox: {
    marginBottom: 18,
    backgroundColor: '#ffffff',
    padding: 14,
    borderWidth: 1,
    borderColor: '#e0f2f2',
    borderRadius: 8,
    wrap: false,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f9f9',
    paddingBottom: 6,
  },
  questionNumber: {
    fontFamily: 'Helvetica-Bold',
    color: '#008080',
    fontSize: 11,
  },
  marksPositive: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    color: '#22c55e',
  },
  marksNegative: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    color: '#ef4444',
  },
  marksZero: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    color: '#8ab8b8',
  },
  questionText: {
    fontSize: 11,
    lineHeight: 1.4,
    color: '#333333',
    marginBottom: 8,
  },
  summaryBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    padding: 6,
    marginBottom: 10,
  },
  summaryText: {
    fontSize: 10,
    color: '#475569',
  },
  optionsContainer: {
    marginTop: 8,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  optionBox: {
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0f2f2',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  optionBoxCorrect: {
    borderColor: '#22c55e',
    backgroundColor: '#f0fdf4',
    borderWidth: 2,
  },
  optionBoxPartial: {
    borderColor: '#f59e0b',
    backgroundColor: '#fffbeb',
    borderWidth: 2,
  },
  optionBoxWrong: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
    borderWidth: 2,
  },
  optionText: {
    fontSize: 10,
    color: '#333333',
  },
  optionLabelCorrect: {
    color: '#22c55e',
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
  },
  optionLabelPartial: {
    color: '#d97706',
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
  },
  optionLabelWrong: {
    color: '#ef4444',
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
  },
  natBox: {
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    marginTop: 8,
    gap: 4,
  },
  marksPartial: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    color: '#d97706',
  },
});

export const AnswerKeyPDF = ({ result, exam, questions, schoolName }: any) => {
  const testName = exam?.title || 'Exam';
  const studentName = result.students?.full_name || 'Unknown';
  const rollNo = result.students?.roll_number || 'N/A';
  const studentAnswers = result.answers || {};

  // Calculate subject breakdown using shared logic
  const subjectBreakdownList = calculateSubjectBreakdown(questions, studentAnswers, exam?.marking_scheme);
  
  // Use dynamically calculated total instead of static DB total to ensure accuracy
  const totalScore = subjectBreakdownList.reduce((acc: number, subj: any) => acc + subj.marks, 0);
  const marks = totalScore;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{schoolName || 'Student Answer Key'}</Text>
        <Text style={styles.subtitle}>Answer Key &amp; Detailed Report</Text>
        
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerText}><Text style={styles.headerBold}>Test Name: </Text>{testName}</Text>
              <Text style={styles.headerText}><Text style={styles.headerBold}>Student Name: </Text>{studentName}</Text>
              <Text style={styles.headerText}><Text style={styles.headerBold}>Roll Number: </Text>{rollNo}</Text>
            </View>
            <View style={styles.scoreContainer}>
              <Text style={styles.scoreLabel}>TOTAL SCORE</Text>
              <Text style={styles.score}>{marks}</Text>
            </View>
          </View>

          {subjectBreakdownList.length > 0 && (
            <View style={styles.subjectSection}>
              <Text style={styles.subjectTitle}>Subject Marks Breakdown</Text>
              <View style={styles.subjectGrid}>
                {subjectBreakdownList.map((sb, idx) => (
                  <View key={idx} style={styles.subjectCard}>
                    <Text style={styles.subjectName}>{sb.subject_name}</Text>
                    <Text style={styles.subjectMarks}>
                      {sb.marks} <Text style={styles.subjectMaxMarks}>/ {sb.maxMarks} marks</Text>
                    </Text>
                    <Text style={styles.subjectStats}>
                      <Text style={{ color: '#22c55e', fontFamily: 'Helvetica-Bold' }}>{sb.correct} Correct  </Text>
                      {sb.partial > 0 && (
                        <Text style={{ color: '#d97706', fontFamily: 'Helvetica-Bold' }}>{sb.partial} Partial  </Text>
                      )}
                      <Text style={{ color: '#ef4444', fontFamily: 'Helvetica-Bold' }}>{sb.wrong} Wrong  </Text>
                      <Text style={{ color: '#64748b' }}>{sb.unattempted} Unattempted</Text>
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {questions.map((q: any, index: number) => {
          const studentAns = studentAnswers[q.id]?.answer;
          const evalResult = evaluateQuestion(q, studentAns, exam?.marking_scheme);
          const marksAwarded = evalResult.marksAwarded;
          const isPartialMatch = evalResult.isPartialMatch && !evalResult.hasWrong;

          const selectedOpts = (studentAns !== undefined && studentAns !== null && String(studentAns).trim() !== '')
            ? String(studentAns).split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
            : [];
          const correctAns = q.correct_option;
          const correctOpts = (correctAns !== undefined && correctAns !== null && String(correctAns).trim() !== '')
            ? String(correctAns).split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
            : [];

          const hasOptions = q.options && typeof q.options === 'object' && Object.keys(q.options).some(k => ['A', 'B', 'C', 'D'].includes(k) && (q.options[k] || q.options[`${k}_image`]));

          let userAnswerText = 'Not Answered';
          let correctAnswerText = correctAns !== undefined && correctAns !== null ? String(correctAns) : 'N/A';

          if (hasOptions) {
            userAnswerText = selectedOpts.length > 0 ? selectedOpts.map(o => `Option ${o}`).join(', ') : 'Not Answered';
            correctAnswerText = correctOpts.length > 0 ? correctOpts.map(o => `Option ${o}`).join(', ') : (correctAns ? String(correctAns) : 'N/A');
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
          
          return (
            <View key={q.id} style={styles.questionBox} wrap={false}>
              <View style={styles.questionHeader}>
                <Text style={styles.questionNumber}>
                  Q.{q.question_number || index + 1} | {q.exam_subjects?.subject_name || 'General'}
                </Text>
                <Text style={isPartialMatch ? styles.marksPartial : (marksAwarded > 0 ? styles.marksPositive : marksAwarded < 0 ? styles.marksNegative : styles.marksZero)}>
                  {isPartialMatch ? `Marks: +${marksAwarded} (Partial)` : `Marks: ${marksAwarded > 0 ? '+' : ''}${marksAwarded}`}
                </Text>
              </View>
              
              {q.question_text && <Text style={styles.questionText}>{q.question_text}</Text>}

              <View style={styles.summaryBanner}>
                <Text style={styles.summaryText}>
                  <Text style={styles.headerBold}>Your Answer: </Text>
                  <Text style={{ color: userAnswerColor, fontFamily: 'Helvetica-Bold' }}>{userAnswerText}</Text>
                </Text>
                <Text style={styles.summaryText}>
                  <Text style={styles.headerBold}>Correct Answer: </Text>
                  <Text style={{ color: '#22c55e', fontFamily: 'Helvetica-Bold' }}>{correctAnswerText}</Text>
                </Text>
              </View>

              {(() => {
                if (!q.image_url) return null;
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
                return images.map((url, idx) => (
                  <Image 
                    key={idx}
                    src={url} 
                    style={{ maxWidth: '100%', maxHeight: 200, marginBottom: 10, objectFit: 'contain' }} 
                  />
                ));
              })()}
              
              {hasOptions ? (
                <View style={styles.optionsContainer}>
                  {['A', 'B', 'C', 'D'].map(key => {
                    const val = q.options[key];
                    const imgVal = q.options[`${key}_image`];
                    
                    if (!val && !imgVal) return null;
                    
                    const isCorrect = q.question_type === 'msq' || (correctAns && String(correctAns).includes(','))
                      ? correctOpts.includes(key)
                      : String(correctAns).trim().toUpperCase() === key;
                    const isStudentAns = selectedOpts.includes(key);
                    const isWrong = isStudentAns && !isCorrect;

                    let boxStyle: any = { ...styles.optionBox };
                    if (isCorrect && isStudentAns && isPartialMatch) boxStyle = { ...boxStyle, ...styles.optionBoxPartial };
                    else if (isCorrect) boxStyle = { ...boxStyle, ...styles.optionBoxCorrect };
                    else if (isWrong) boxStyle = { ...boxStyle, ...styles.optionBoxWrong };

                    return (
                      <View key={key} style={boxStyle}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.optionText}>
                            <Text style={styles.headerBold}>{key}) </Text>
                            {val || ''}
                          </Text>
                          {imgVal && (
                            <Image 
                              src={imgVal} 
                              style={{ maxWidth: 200, maxHeight: 150, marginTop: 8, objectFit: 'contain' }} 
                            />
                          )}
                        </View>
                        <View style={{ width: 140, alignItems: 'flex-end' }}>
                          {isCorrect && isStudentAns && isPartialMatch && <Text style={styles.optionLabelPartial}>✓ Partial &amp; Your Answer</Text>}
                          {isCorrect && isStudentAns && !isPartialMatch && <Text style={styles.optionLabelCorrect}>✓ Correct &amp; Your Answer</Text>}
                          {isCorrect && !isStudentAns && <Text style={styles.optionLabelCorrect}>✓ Correct Answer</Text>}
                          {isWrong && <Text style={styles.optionLabelWrong}>✗ Your Answer (Incorrect)</Text>}
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.natBox}>
                  <Text style={styles.optionText}>
                    <Text style={styles.headerBold}>Your Answer: </Text>
                    <Text style={{ color: userAnswerColor, fontFamily: 'Helvetica-Bold' }}>{userAnswerText}</Text>
                  </Text>
                  <Text style={styles.optionText}>
                    <Text style={styles.headerBold}>Correct Answer: </Text>
                    <Text style={{ color: '#22c55e', fontFamily: 'Helvetica-Bold' }}>{correctAnswerText}</Text>
                  </Text>
                </View>
              )}
              {q.explanation && (
                <View style={{ marginTop: 6, padding: 6, borderRadius: 4, borderWidth: 1, borderColor: '#bfdbfe', backgroundColor: '#eff6ff' }}>
                  <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 9, color: '#1d4ed8', marginBottom: 2 }}>Explanation / Solution:</Text>
                  <Text style={{ fontSize: 9, color: '#1e293b' }}>{q.explanation}</Text>
                </View>
              )}
            </View>
          );
        })}
      </Page>
    </Document>
  );
};
