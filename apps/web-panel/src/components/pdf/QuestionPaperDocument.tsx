import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { LatexParser } from './LatexParser';
// Removing Question import from downloadAnswerKey to avoid TS error

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
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaLabel: {
    color: '#64748b',
    textTransform: 'uppercase',
    fontSize: 10,
    fontWeight: 'bold',
    marginRight: 4,
  },
  metaValue: {
    color: '#0f172a',
    fontSize: 10,
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
    backgroundColor: '#f1f5f9',
    color: '#475569',
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
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    padding: 4,
    marginBottom: 4,
  },
  optionLabel: {
    fontWeight: 'bold',
    marginRight: 4,
    fontSize: 10,
    color: '#475569',
  },
  optionContent: {
    flex: 1,
  },
  natBox: {
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  natLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748b',
  },
  natValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0f172a',
  }
});

interface QuestionPaperData {
  schoolName?: string;
  testName?: string;
  questions: any[];
}

export const QuestionPaperDocument = ({ data }: { data: QuestionPaperData }) => {
  const { schoolName = 'Growtez ExamOS', testName = 'Question Paper', questions = [] } = data;

  const parseQuestionImages = (urlStr: string | null): string[] => {
    if (!urlStr) return [];
    const trimmed = urlStr.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try { return JSON.parse(trimmed); } catch (e) { return [trimmed]; }
    }
    return [trimmed];
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerBanner}>
          <Text style={styles.schoolName}>{schoolName}</Text>
          <Text style={styles.subtitle}>Question Paper</Text>
        </View>

        <View style={styles.metaBox}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Test Name:</Text>
            <Text style={styles.metaValue}>{testName}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Total Questions:</Text>
            <Text style={styles.metaValue}>{questions.length}</Text>
          </View>
        </View>

        <View style={styles.questionsContainer}>
          {questions.map((q, index) => {
            const images = parseQuestionImages(q.image_url);
            
            const hasOptions = q.options && typeof q.options === 'object' && Object.keys(q.options).some(k => ['A', 'B', 'C', 'D'].includes(k) && ((q.options as any)[k] || (q.options as any)[`\${k}_image`]));
            let optionsList: any[] = [];
            
            if (hasOptions) {
              optionsList = ['A', 'B', 'C', 'D'].map(key => {
                const val = (q.options as any)[key];
                const imgVal = (q.options as any)[`\${key}_image`];
                if (!val && !imgVal) return null;
                return { key, text: val, image: imgVal };
              }).filter(Boolean);
            }

            const defaultMarks = q.positive_marks || q.marks || 1;

            return (
              <View key={q.id || index} style={styles.card} wrap={false}>
                <View style={styles.cardHeader}>
                  <Text style={styles.qNumber}>Q.{q.question_number || index + 1} | {q.exam_subjects?.subject_name || 'General'}</Text>
                  <Text style={styles.qMarks}>Marks: {defaultMarks}</Text>
                </View>

                {q.question_text && <LatexParser content={q.question_text} style={{ marginBottom: 6 }} />}
                
                {images && images.map((img: string, i: number) => (
                  <Image key={i} src={img} style={styles.image} />
                ))}

                {q.question_type === 'nat' ? (
                  <View style={styles.natBox}>
                    <Text style={styles.natLabel}>Numerical Answer Type</Text>
                  </View>
                ) : (
                  <View style={styles.optionsGrid}>
                    {optionsList && optionsList.map((opt: any) => (
                      <View key={opt.key} style={styles.optionBox}>
                        <Text style={styles.optionLabel}>{opt.key})</Text>
                        <View style={styles.optionContent}>
                          {opt.text && <LatexParser content={opt.text} />}
                          {opt.image && <Image src={opt.image} style={styles.image} />}
                        </View>
                      </View>
                    ))}
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
