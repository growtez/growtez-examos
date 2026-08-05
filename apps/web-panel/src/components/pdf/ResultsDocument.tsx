import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

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
    padding: 36,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
    fontSize: 10,
  },
  headerBanner: {
    textAlign: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#0d9488',
  },
  examTitle: {
    color: '#0f766e',
    fontSize: 20,
    marginBottom: 4,
    fontFamily: 'Helvetica-Bold',
  },
  subtitle: {
    color: '#475569',
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  metaText: {
    color: '#64748b',
    fontSize: 9,
  },
  table: {
    width: '100%',
    flexDirection: 'column',
    marginTop: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 1.5,
    borderBottomColor: '#94a3b8',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 5,
    paddingHorizontal: 4,
    backgroundColor: '#f8fafc',
  },
  colRank:    { width: '8%',  paddingHorizontal: 2 },
  colRollNo:  { width: '13%', paddingHorizontal: 2 },
  colName:    { width: '27%', paddingHorizontal: 2 },
  colCourse:  { width: '15%', paddingHorizontal: 2 },
  colBatch:   { width: '15%', paddingHorizontal: 2 },
  colScore:   { width: '12%', paddingHorizontal: 2, textAlign: 'right' },
  colStatus:  { width: '10%', paddingHorizontal: 2, textAlign: 'center' },
  headerText: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cellText: {
    fontSize: 9,
    color: '#1e293b',
  },
  cellMuted: {
    fontSize: 9,
    color: '#64748b',
  },
  rankText: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#64748b',
  },
  scoreText: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#0f766e',
  },
  scoreTextNA: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#94a3b8',
  },
  absentBadge: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#dc2626',
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

interface ResultsData {
  examTitle: string;
  formattedDate: string;
  totalExamMarks: number | string;
  filterText: string;
  results: any[];
}

export const ResultsDocument = ({ data }: { data: ResultsData }) => {
  const { examTitle, formattedDate, totalExamMarks, filterText, results } = data;

  // Assign ranks (skip absent)
  let rank = 1;
  const rankedResults = results.map((row, i) => {
    const isAbsent = row.total_marks === null || row.total_marks === 'N/A' || row.isAbsent;
    const displayRank = isAbsent ? '—' : String(rank++);
    return { ...row, displayRank, isAbsent };
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerBanner}>
          <Text style={styles.examTitle}>{examTitle}</Text>
          <Text style={styles.subtitle}>Exam Results</Text>
          <Text style={styles.metaText}>
            Date: {formattedDate}  |  Total Marks: {totalExamMarks}  |  {filterText}  |  Total Students: {results.length}
          </Text>
        </View>

        {/* Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <View style={styles.colRank}><Text style={styles.headerText}>#</Text></View>
            <View style={styles.colRollNo}><Text style={styles.headerText}>Roll No</Text></View>
            <View style={styles.colName}><Text style={styles.headerText}>Name</Text></View>
            <View style={styles.colCourse}><Text style={styles.headerText}>Course</Text></View>
            <View style={styles.colBatch}><Text style={styles.headerText}>Batch</Text></View>
            <View style={styles.colScore}><Text style={[styles.headerText, { textAlign: 'right' }]}>Score</Text></View>
            <View style={styles.colStatus}><Text style={[styles.headerText, { textAlign: 'center' }]}>Status</Text></View>
          </View>

          {rankedResults.map((row, index) => {
            const score = row.isAbsent ? 'Absent' : (row.total_marks ?? 'N/A');
            const isNA = score === 'Absent' || score === 'N/A';
            const rowStyle = index % 2 === 0 ? styles.tableRow : styles.tableRowAlt;

            return (
              <View key={row.id || index} style={rowStyle} wrap={false}>
                <View style={styles.colRank}><Text style={styles.rankText}>{row.displayRank}</Text></View>
                <View style={styles.colRollNo}><Text style={styles.cellText}>{row.students?.roll_number || '—'}</Text></View>
                <View style={styles.colName}><Text style={styles.cellText}>{row.students?.full_name || '—'}</Text></View>
                <View style={styles.colCourse}><Text style={styles.cellMuted}>{row.students?.course || '—'}</Text></View>
                <View style={styles.colBatch}><Text style={styles.cellMuted}>{row.students?.batch || '—'}</Text></View>
                <View style={styles.colScore}>
                  <Text style={isNA ? styles.scoreTextNA : styles.scoreText}>{score}</Text>
                </View>
                <View style={styles.colStatus}>
                  {row.isAbsent
                    ? <Text style={styles.absentBadge}>Absent</Text>
                    : <Text style={[styles.cellText, { color: '#0f766e' }]}>Done</Text>
                  }
                </View>
              </View>
            );
          })}
        </View>

        {/* Page number */}
        <Text style={[styles.footerText, { position: 'absolute', bottom: 14, right: 36 }]} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} fixed />
      </Page>
    </Document>
  );
};
