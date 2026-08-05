import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
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
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaLabel: {
    color: '#64748b',
    textTransform: 'uppercase',
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    marginRight: 4,
  },
  metaValue: {
    color: '#0f172a',
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },
  // Section heading
  sectionHeading: {
    backgroundColor: '#f1f5f9',
    borderLeftWidth: 3,
    borderLeftColor: '#0d9488',
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom: 8,
    marginTop: 4,
  },
  sectionHeadingText: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#0f766e',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Single column layout
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
    backgroundColor: '#f1f5f9',
    color: '#475569',
  },
  image: {
    maxWidth: '100%',
    maxHeight: 130,
    marginTop: 4,
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
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 5,
    padding: 4,
  },
  optionLabel: {
    fontFamily: 'Helvetica-Bold',
    marginRight: 3,
    fontSize: 9,
    color: '#475569',
  },
  optionContent: {
    flex: 1,
  },
  natBox: {
    padding: 7,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 7,
    backgroundColor: '#f8fafc',
  },
  natLabel: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#64748b',
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

  // Group questions by subject for section headings
  const subjectOrder: string[] = [];
  const subjectGroups: Record<string, any[]> = {};
  questions.forEach(q => {
    const subj = q.exam_subjects?.subject_name || 'General';
    if (!subjectGroups[subj]) {
      subjectGroups[subj] = [];
      subjectOrder.push(subj);
    }
    subjectGroups[subj].push(q);
  });

  const renderCard = (q: any, index: number) => {
    const images = parseQuestionImages(q.image_url);
    const hasOptions = q.options && typeof q.options === 'object' &&
      Object.keys(q.options).some(k => ['A', 'B', 'C', 'D'].includes(k) &&
        ((q.options as any)[k] || (q.options as any)[`${k}_image`]));
    let optionsList: any[] = [];
    if (hasOptions) {
      optionsList = ['A', 'B', 'C', 'D'].map(key => {
        const val = (q.options as any)[key];
        const imgVal = (q.options as any)[`${key}_image`];
        if (!val && !imgVal) return null;
        return { key, text: val, image: imgVal };
      }).filter(Boolean);
    }
    const defaultMarks = q.positive_marks || q.marks || 1;

    return (
      <View key={q.id || index} style={styles.card} wrap={false}>
        <View style={styles.cardHeader}>
          <Text style={styles.qNumber}>Q.{q.question_number || index + 1}</Text>
          <Text style={styles.qMarks}>{defaultMarks} Mark{defaultMarks !== 1 ? 's' : ''}</Text>
        </View>

        {q.question_text && <LatexParser content={q.question_text} style={{ marginBottom: 5 }} />}

        {images && images.length > 0 && (
          <View style={styles.imagesRow}>
            {images.map((img: string, i: number) => (
              <Image key={i} src={img} style={styles.imageItem} />
            ))}
          </View>
        )}

        {q.question_type === 'nat' ? (
          <View style={styles.natBox}>
            <Text style={styles.natLabel}>Numerical Answer Type — Write your answer</Text>
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
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header — fixed so it repeats on each page */}
        <View style={styles.headerBanner} fixed>
          <Text style={styles.schoolName}>{schoolName}</Text>
          <Text style={styles.subtitle}>Question Paper</Text>
        </View>

        {/* Meta info (only on first page, not fixed) */}
        <View style={styles.metaBox}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Test:</Text>
            <Text style={styles.metaValue}>{testName}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Total Questions:</Text>
            <Text style={styles.metaValue}>{questions.length}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Sections:</Text>
            <Text style={styles.metaValue}>{subjectOrder.length}</Text>
          </View>
        </View>

        {/* Questions grouped by subject */}
        {subjectOrder.map((subj, si) => (
          <View key={subj}>
            {/* Section heading */}
            <View style={styles.sectionHeading} wrap={false}>
              <Text style={styles.sectionHeadingText}>
                Section {si + 1}: {subj} ({subjectGroups[subj].length} Questions)
              </Text>
            </View>

            {/* Cards in 2-col grid */}
            <View style={styles.questionsContainer}>
              {subjectGroups[subj].map((q, qi) => renderCard(q, qi))}
            </View>
          </View>
        ))}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{schoolName} — {testName}</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
};
