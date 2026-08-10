import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { LatexParser } from './LatexParser';

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
    fontSize: 10,
  },
  headerBanner: {
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#0d9488',
    paddingBottom: 10,
    marginBottom: 14,
  },
  schoolName: {
    color: '#0f766e',
    fontSize: 20,
    marginBottom: 3,
    fontFamily: 'Helvetica-Bold',
  },
  subtitle: {
    color: '#64748b',
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  metaBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  metaDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    marginRight: 8,
    marginBottom: 3,
  },
  metaLabel: {
    color: '#64748b',
    textTransform: 'uppercase',
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    marginRight: 3,
  },
  metaValue: {
    color: '#0f172a',
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
  },
  scoreBadge: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#ccfbf1',
    borderWidth: 1,
    borderColor: '#99f6e4',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  scoreLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#0f766e',
    marginBottom: 1,
  },
  scoreValue: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#0f766e',
  },
  subjectRow: {
    marginTop: 8,
    paddingTop: 7,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
  },
  subjectLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#64748b',
    textTransform: 'uppercase',
    marginRight: 6,
  },
  subjectCardsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  subjectCard: {
    flexDirection: 'column',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 5,
    paddingVertical: 3,
    paddingHorizontal: 7,
    marginBottom: 3,
  },
  pillName: {
    fontFamily: 'Helvetica-Bold',
    color: '#0f766e',
    fontSize: 9,
    marginRight: 5,
  },
  pillMarks: {
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    fontSize: 9,
  },
  pillMax: {
    fontSize: 8,
    color: '#64748b',
  },
  subjectCardStats: {
    flexDirection: 'row',
    borderLeftWidth: 1,
    borderLeftColor: '#e2e8f0',
    paddingLeft: 5,
    marginLeft: 5,
    gap: 3,
  },
  statText: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
  },
  subjectPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 5,
    marginBottom: 3,
  },
  pillStats: {
    flexDirection: 'row',
    gap: 3,
    borderLeftWidth: 1,
    borderLeftColor: '#e2e8f0',
    paddingLeft: 5,
    marginLeft: 5,
  },
  // Single column cards
  questionsContainer: {
    flexDirection: 'column',
  },
  card: {
    width: '100%',
    marginBottom: 8,
    padding: 9,
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 6,
    backgroundColor: '#ffffff',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 4,
    marginBottom: 5,
  },
  qNumber: {
    fontFamily: 'Helvetica-Bold',
    color: '#0d9488',
    fontSize: 9,
  },
  qMarks: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    paddingVertical: 2,
    paddingHorizontal: 5,
    borderRadius: 6,
  },
  image: {
    maxWidth: '100%',
    maxHeight: 120,
    marginTop: 5,
    objectFit: 'contain',
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
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
    gap: 4,
  },
  optionBox: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 5,
    padding: 4,
  },
  optionLabel: {
    fontFamily: 'Helvetica-Bold',
    marginRight: 3,
    fontSize: 9,
  },
  optionContent: {
    flex: 1,
  },
  badge: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 'auto',
  },
  explanationBox: {
    marginTop: 6,
    paddingTop: 5,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  explanationLabel: {
    fontFamily: 'Helvetica-Bold',
    color: '#1d4ed8',
    fontSize: 8,
    marginBottom: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 36,
    right: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderTopColor: '#e2e8f0',
    paddingTop: 6,
  },
  footerText: {
    fontSize: 8,
    color: '#94a3b8',
  },
});

export const AnswerKeyDocument = ({ data }: { data: any }) => {
  const {
    schoolName,
    testName,
    studentName,
    rollNo,
    marks,
    totalExamMarks,
    formattedDate,
    subjectBreakdownList,
    evaluatedQuestions
  } = data;

  const maxMarksSum = subjectBreakdownList && subjectBreakdownList.length > 0
    ? subjectBreakdownList.reduce((acc: number, sb: any) => acc + (sb.maxMarks || 0), 0)
    : 0;
  const maxTotal = totalExamMarks || maxMarksSum;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Fixed header on every page */}
        <View style={styles.headerBanner}>
          <Text style={styles.schoolName}>{testName || 'Answer Key'}</Text>
          <Text style={styles.subtitle}>Answer Key & Detailed Report</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
            <Text style={{ fontSize: 10, color: '#64748b' }}>{schoolName}</Text>
            <Text style={{ fontSize: 10, color: '#64748b' }}>{formattedDate}</Text>
          </View>
        </View>

        {/* Student meta info — first page only */}
        <View style={styles.metaBox}>
          <View style={styles.metaRow}>
            <View style={styles.metaDetails}>
              <View style={styles.metaItem}><Text style={styles.metaLabel}>Student:</Text><Text style={styles.metaValue}>{studentName}</Text></View>
              <View style={styles.metaItem}><Text style={styles.metaLabel}>Roll No:</Text><Text style={styles.metaValue}>{rollNo}</Text></View>
            </View>
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreLabel}>SCORE</Text>
              <Text style={styles.scoreValue}>{marks}{maxTotal ? `/${maxTotal}` : ''}</Text>
            </View>
          </View>

          {subjectBreakdownList && subjectBreakdownList.length > 0 && (
            <View style={styles.subjectRow}>
              <Text style={styles.subjectLabel}>Subjects:</Text>
              {subjectBreakdownList.map((sb: any, i: number) => (
                <View key={i} style={styles.subjectPill}>
                  <Text style={styles.pillName}>{sb.subjectName}</Text>
                  <Text style={styles.pillMarks}>{sb.marks}<Text style={styles.pillMax}> / {sb.maxMarks}m</Text></Text>
                  <View style={styles.pillStats}>
                    <Text style={[styles.statText, { color: '#166534' }]}>{sb.correct}C</Text>
                    {sb.partial > 0 && <Text style={[styles.statText, { color: '#b45309' }]}>•{sb.partial}P</Text>}
                    <Text style={[styles.statText, { color: '#be123c' }]}>•{sb.wrong}W</Text>
                    <Text style={[styles.statText, { color: '#64748b' }]}>•{sb.unattempted}U</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Question cards in 2-column layout */}
        <View style={styles.questionsContainer}>
          {evaluatedQuestions.map((eq: any, index: number) => {
            const { q, evalResult, images, optionsList } = eq;

            let badgeBg = '#f1f5f9';
            let badgeColor = '#475569';
            let marksText = '0.00';

            if (evalResult.isCorrect) {
              badgeBg = '#dcfce7'; badgeColor = '#166534';
              marksText = `+${evalResult.marksAwarded}`;
            } else if (evalResult.isPartialMatch && !evalResult.hasWrong) {
              badgeBg = '#fef3c7'; badgeColor = '#b45309';
              marksText = `+${evalResult.marksAwarded}`;
            } else if (evalResult.isAttempted && evalResult.marksAwarded < 0) {
              badgeBg = '#ffe4e6'; badgeColor = '#be123c';
              marksText = `${evalResult.marksAwarded}`;
            } else if (evalResult.isAttempted && evalResult.marksAwarded === 0) {
              badgeBg = '#ffe4e6'; badgeColor = '#be123c';
              marksText = '0';
            }

            return (
              <View key={q.id || index} style={styles.card} wrap={false}>
                <View style={styles.cardHeader}>
                  <Text style={styles.qNumber}>Q.{q.question_number || index + 1} | {q.exam_subjects?.subject_name || 'General'}</Text>
                  <Text style={[styles.qMarks, { backgroundColor: badgeBg, color: badgeColor }]}>{marksText}</Text>
                </View>

                {q.question_text && <LatexParser content={q.question_text} style={{ marginBottom: 5, fontSize: 9 }} />}

                {images && images.length > 0 && (
                  <View style={styles.imagesRow}>
                    {images.map((img: string, i: number) => (
                      <Image key={i} src={img} style={styles.imageItem} />
                    ))}
                  </View>
                )}

                {q.question_type === 'nat' ? (
                  <View style={{ marginTop: 6, padding: 5, borderRadius: 5, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc' }}>
                    <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#64748b' }}>Correct: {q.correct_option}</Text>
                    <Text style={{ fontSize: 8, color: evalResult.isCorrect ? '#166534' : '#be123c' }}>
                      Your Answer: {evalResult.studentAnsRaw || 'Not Attempted'}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.optionsGrid}>
                    {optionsList && optionsList.map((opt: any) => {
                      let borderColor = '#cbd5e1';
                      let bgColor = '#ffffff';
                      if (opt.isCorrect && opt.isStudentAns) { borderColor = '#16a34a'; bgColor = '#bbf7d0'; }
                      else if (opt.isCorrect && !opt.isStudentAns) { borderColor = '#1e293b'; bgColor = '#f1f5f9'; }
                      else if (opt.isStudentAns) { borderColor = '#dc2626'; bgColor = '#fecaca'; }

                      return (
                        <View key={opt.key} style={[styles.optionBox, { borderColor, backgroundColor: bgColor }]}>
                          <Text style={[styles.optionLabel, { color: opt.isCorrect && opt.isStudentAns ? '#166534' : opt.isCorrect && !opt.isStudentAns ? '#1e293b' : opt.isStudentAns ? '#b91c1c' : '#475569' }]}>
                              {opt.key})
                            </Text>
                            <View style={styles.optionContent}>
                              {opt.text && <LatexParser content={opt.text} />}
                              {opt.image && <Image src={opt.image} style={styles.image} />}
                              {opt.isStudentAns && opt.isCorrect && <Text style={[styles.badge, { backgroundColor: '#22c55e' }]}>✓ Your Correct Ans</Text>}
                              {!opt.isStudentAns && opt.isCorrect && <Text style={[styles.badge, { backgroundColor: '#334155', color: '#ffffff' }]}>✓ Correct Answer</Text>}
                              {opt.isStudentAns && !opt.isCorrect && <Text style={[styles.badge, { backgroundColor: '#ef4444' }]}>✗ Your Wrong Ans</Text>}
                            </View>
                        </View>
                      );
                    })}
                  </View>
                )}

                {q.explanation && (
                  <View style={styles.explanationBox}>
                    <Text style={styles.explanationLabel}>Explanation:</Text>
                    <LatexParser content={q.explanation} />
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `${schoolName} — Page ${pageNumber} of ${totalPages}`} fixed />
      </Page>
    </Document>
  );
};
