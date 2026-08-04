import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image, Svg, Path, Circle } from '@react-pdf/renderer';
import { LatexParser } from './LatexParser';

// Register Inter font via jsDelivr (@fontsource/inter) — stable versioned URLs
Font.register({
  family: 'Inter',
  fonts: [
    {
      src: 'https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.8/files/inter-latin-400-normal.woff',
      fontWeight: 400,
    },
    {
      src: 'https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.8/files/inter-latin-600-normal.woff',
      fontWeight: 600,
    },
    {
      src: 'https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.8/files/inter-latin-700-normal.woff',
      fontWeight: 700,
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Inter',
    backgroundColor: '#ffffff',
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
    fontSize: 24,
    marginBottom: 3,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  metaBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    flex: 1,
  },
  metaItem: {
    flexDirection: 'row',
    marginRight: 10,
  },
  metaLabel: {
    color: '#64748b',
    textTransform: 'uppercase',
    fontSize: 9,
    fontWeight: 'bold',
    marginRight: 4,
  },
  metaValue: {
    color: '#0f172a',
    fontSize: 9,
    fontWeight: 'bold',
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ccfbf1',
    borderWidth: 1,
    borderColor: '#99f6e4',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  scoreLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#0f766e',
    marginRight: 4,
  },
  scoreValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0f766e',
  },
  subjectRow: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    flexDirection: 'column',
  },
  subjectLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 6,
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
    borderColor: '#e2e8f0',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 4,
    width: '48%',
  },
  subjectCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  subjectCardName: {
    fontWeight: 'bold',
    color: '#0f766e',
    fontSize: 10,
  },
  subjectCardScore: {
    fontWeight: 'bold',
    color: '#0f172a',
    fontSize: 10,
  },
  subjectCardStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  statItem: {
    fontSize: 8,
    fontWeight: 'bold',
  },
  questionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '49%', // 2-column layout
    marginBottom: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 4,
    marginBottom: 6,
  },
  qNumber: {
    fontWeight: 'bold',
    color: '#0d9488',
    fontSize: 10,
  },
  qMarks: {
    fontWeight: 'bold',
    fontSize: 9,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  qText: {
    fontSize: 10,
    lineHeight: 1.4,
    color: '#0f172a',
    marginBottom: 6,
  },
  image: {
    width: '100%',
    maxHeight: 150,
    objectFit: 'contain',
    marginVertical: 4,
    borderRadius: 4,
  },
  optionsGrid: {
    flexDirection: 'column',
    marginTop: 6,
  },
  optionBox: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 6,
    padding: 4,
    marginBottom: 4,
  },
  optionLabel: {
    fontWeight: 'bold',
    marginRight: 4,
    fontSize: 10,
  },
  optionContent: {
    flex: 1,
  },
  badge: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#ffffff',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 'auto',
  },
  explanationBox: {
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  explanationLabel: {
    fontWeight: 'bold',
    color: '#1d4ed8',
    fontSize: 10,
    marginBottom: 2,
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
        <View style={styles.headerBanner}>
          <Text style={styles.schoolName}>{testName || 'Answer Key'}</Text>
          <Text style={styles.subtitle}>Answer Key & Detailed Report</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
            <Text style={{ fontSize: 10, color: '#64748b' }}>{schoolName}</Text>
            <Text style={{ fontSize: 10, color: '#64748b' }}>{formattedDate}</Text>
          </View>
        </View>

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
              <Text style={styles.subjectLabel}>Subject-wise Breakdown</Text>
              <View style={styles.subjectCardsRow}>
                {subjectBreakdownList.map((sb: any, i: number) => (
                  <View key={i} style={styles.subjectCard}>
                    <View style={styles.subjectCardHeader}>
                      <Text style={styles.subjectCardName}>{sb.subjectName}</Text>
                      <Text style={styles.subjectCardScore}>{sb.marks}/{sb.maxMarks} marks</Text>
                    </View>
                    <View style={styles.subjectCardStats}>
                      <Text style={[styles.statItem, { color: '#166534' }]}>{sb.correct} Correct</Text>
                      {sb.partial > 0 && <Text style={[styles.statItem, { color: '#b45309' }]}>{sb.partial} Partial</Text>}
                      <Text style={[styles.statItem, { color: '#be123c' }]}>{sb.wrong} Wrong</Text>
                      <Text style={[styles.statItem, { color: '#64748b' }]}>{sb.unattempted} Skipped</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        <View style={styles.questionsContainer}>
          {evaluatedQuestions.map((eq: any, index: number) => {
            const { q, evalResult, images, optionsList } = eq;
            
            // Badge color logic
            let badgeBg = '#f1f5f9';
            let badgeColor = '#475569';
            let marksText = '0';
            const formatMarks = (m: number) => {
              if (m > 0) return `+${m}`;
              return `${m}`;
            };
            
            if (evalResult.isCorrect) {
              badgeBg = '#dcfce3';
              badgeColor = '#166534';
              marksText = formatMarks(evalResult.marksAwarded);
            } else if (evalResult.isPartialMatch && !evalResult.hasWrong) {
              badgeBg = '#fef3c7';
              badgeColor = '#b45309';
              marksText = formatMarks(evalResult.marksAwarded);
            } else if (evalResult.isAttempted && evalResult.marksAwarded < 0) {
              badgeBg = '#ffe4e6';
              badgeColor = '#be123c';
              marksText = formatMarks(evalResult.marksAwarded);
            } else if (evalResult.isAttempted && evalResult.marksAwarded === 0) {
              badgeBg = '#ffe4e6';
              badgeColor = '#be123c';
              marksText = '0';
            } else {
              badgeBg = '#f1f5f9';
              badgeColor = '#475569';
              marksText = '0';
            }

            return (
              <View key={q.id || index} style={styles.card} wrap={false}>
                <View style={styles.cardHeader}>
                  <Text style={styles.qNumber}>Q.{q.question_number || index + 1} | {q.exam_subjects?.subject_name || 'General'}</Text>
                  <Text style={[styles.qMarks, { backgroundColor: badgeBg, color: badgeColor }]}>Marks: {marksText}</Text>
                </View>

                {q.question_text && <LatexParser content={q.question_text} style={{ marginBottom: 6 }} />}
                
                {images && images.map((img: string, i: number) => (
                  <Image key={i} src={img} style={styles.image} />
                ))}

                {q.question_type === 'nat' ? (
                  <View style={{ marginTop: 8 }}>
                    <Text style={{ fontSize: 10, fontWeight: 'bold' }}>Correct Answer: {q.correct_option}</Text>
                    {evalResult.studentAnsRaw && (
                      <Text style={{ fontSize: 10, color: evalResult.isCorrect ? '#166534' : '#be123c' }}>
                        Your Answer: {evalResult.studentAnsRaw}
                      </Text>
                    )}
                    {!evalResult.studentAnsRaw && (
                      <Text style={{ fontSize: 10, color: '#64748b' }}>Not Attempted</Text>
                    )}
                  </View>
                ) : (
                  <View style={styles.optionsGrid}>
                    {optionsList && optionsList.map((opt: any) => {
                      let borderColor = '#cbd5e1';
                      let bgColor = '#ffffff';
                      if (opt.isCorrect && opt.isStudentAns) {
                        borderColor = '#86efac'; bgColor = '#f0fdf4';
                      } else if (opt.isCorrect) {
                        borderColor = '#86efac'; bgColor = '#ffffff';
                      } else if (opt.isStudentAns) {
                        borderColor = '#fca5a5'; bgColor = '#fef2f2';
                      }

                      return (
                        <View key={opt.key} style={[styles.optionBox, { borderColor, backgroundColor: bgColor }]}>
                          <Text style={[styles.optionLabel, { color: opt.isCorrect ? '#166534' : (opt.isStudentAns ? '#b91c1c' : '#475569') }]}>
                            {opt.key})
                          </Text>
                          <View style={styles.optionContent}>
                            {opt.text && <LatexParser content={opt.text} />}
                            {opt.image && <Image src={opt.image} style={styles.image} />}
                          </View>
                          {opt.isCorrect && (
                            <Svg width="14" height="14" viewBox="0 0 24 24" style={{ marginLeft: 'auto' }}>
                              <Circle cx="12" cy="12" r="10" fill="#22c55e" />
                              <Path d="M8 12l3 3 5-5" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                            </Svg>
                          )}
                          {opt.isStudentAns && <Text style={[styles.badge, { backgroundColor: '#64748b', marginLeft: opt.isCorrect ? 4 : 'auto' }]}>Your Answer</Text>}
                        </View>
                      )
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
      </Page>
    </Document>
  );
};
