import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  headerBanner: {
    textAlign: 'center',
    marginBottom: 20,
  },
  examTitle: {
    color: '#0f766e',
    fontSize: 24,
    marginBottom: 5,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#475569',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  metaText: {
    color: '#64748b',
    fontSize: 11,
  },
  table: {
    width: '100%',
    flexDirection: 'column',
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingVertical: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 8,
  },
  colRollNo: { width: '15%', paddingHorizontal: 4 },
  colName: { width: '25%', paddingHorizontal: 4 },
  colCourse: { width: '15%', paddingHorizontal: 4 },
  colBatch: { width: '15%', paddingHorizontal: 4 },
  colSession: { width: '12%', paddingHorizontal: 4 },
  colScore: { width: '18%', paddingHorizontal: 4, textAlign: 'right' },
  headerText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#475569',
  },
  cellText: {
    fontSize: 10,
    color: '#0f172a',
  },
  scoreText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0f766e',
  },
  scoreTextNA: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94a3b8',
  }
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

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerBanner}>
          <Text style={styles.examTitle}>{examTitle}</Text>
          <Text style={styles.subtitle}>Exam Results</Text>
          <Text style={styles.metaText}>
            Date: {formattedDate} | Total Marks: {totalExamMarks} | {filterText}
          </Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <View style={styles.colRollNo}><Text style={styles.headerText}>Roll No</Text></View>
            <View style={styles.colName}><Text style={styles.headerText}>Name</Text></View>
            <View style={styles.colCourse}><Text style={styles.headerText}>Course</Text></View>
            <View style={styles.colBatch}><Text style={styles.headerText}>Batch</Text></View>
            <View style={styles.colSession}><Text style={styles.headerText}>Session</Text></View>
            <View style={styles.colScore}><Text style={styles.headerText}>Score</Text></View>
          </View>

          {results.map((row, index) => {
            const score = row.total_marks ?? 'N/A';
            const isNA = score === 'Absent' || score === 'N/A';

            return (
              <View key={row.id || index} style={styles.tableRow} wrap={false}>
                <View style={styles.colRollNo}><Text style={styles.cellText}>{row.students?.roll_number || ''}</Text></View>
                <View style={styles.colName}><Text style={styles.cellText}>{row.students?.full_name || ''}</Text></View>
                <View style={styles.colCourse}><Text style={styles.cellText}>{row.students?.course || ''}</Text></View>
                <View style={styles.colBatch}><Text style={styles.cellText}>{row.students?.batch || ''}</Text></View>
                <View style={styles.colSession}><Text style={styles.cellText}>{row.students?.session || ''}</Text></View>
                <View style={styles.colScore}>
                  <Text style={isNA ? styles.scoreTextNA : styles.scoreText}>{score}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </Page>
    </Document>
  );
};
