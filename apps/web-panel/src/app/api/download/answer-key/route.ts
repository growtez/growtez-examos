import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { renderToStream } from '@react-pdf/renderer';
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';

// Note: React-PDF requires you to define styles with StyleSheet.create
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
  },
  headerBox: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#e0f2f2',
    borderBottomStyle: 'solid',
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerText: {
    fontSize: 12,
    color: '#555555',
    marginBottom: 4,
  },
  headerBold: {
    fontFamily: 'Helvetica-Bold',
  },
  score: {
    color: '#008080',
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
  },
  questionBox: {
    marginBottom: 20,
    backgroundColor: '#ffffff',
    padding: 15,
    borderWidth: 1,
    borderColor: '#e0f2f2',
    borderRadius: 8,
    // prevent breaking across pages if possible
    wrap: false,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f9f9',
    paddingBottom: 8,
  },
  questionNumber: {
    fontFamily: 'Helvetica-Bold',
    color: '#008080',
    fontSize: 12,
  },
  marksPositive: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
    color: '#22c55e',
  },
  marksNegative: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
    color: '#ef4444',
  },
  marksZero: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
    color: '#8ab8b8',
  },
  questionText: {
    fontSize: 12,
    lineHeight: 1.5,
    color: '#333333',
    marginBottom: 10,
  },
  optionsContainer: {
    marginTop: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: 6, // polyfill via margin
  },
  optionBox: {
    padding: 10,
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
  optionBoxWrong: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
    borderWidth: 2,
  },
  optionText: {
    fontSize: 11,
    color: '#333333',
  },
  optionLabelCorrect: {
    color: '#22c55e',
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
  },
  optionLabelWrong: {
    color: '#ef4444',
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
  },
});

const AnswerKeyPDF = ({ result, exam, questions, schoolName }: any) => {
  const testName = exam?.title || 'Exam';
  const studentName = result.students?.full_name || 'Unknown';
  const rollNo = result.students?.roll_number || 'N/A';
  const marks = result.total_marks ?? 0;
  const studentAnswers = result.answers || {};

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{schoolName || 'Student Answer Key'}</Text>
        
        <View style={styles.headerBox}>
          <View>
            <Text style={styles.headerText}><Text style={styles.headerBold}>Test Name: </Text>{testName}</Text>
            <Text style={styles.headerText}><Text style={styles.headerBold}>Student Name: </Text>{studentName}</Text>
            <Text style={styles.headerText}><Text style={styles.headerBold}>Roll Number: </Text>{rollNo}</Text>
          </View>
          <Text style={styles.score}>Total Score: {marks}</Text>
        </View>

        {questions.map((q: any, index: number) => {
          const studentAns = studentAnswers[q.id]?.answer;
          const correctAns = q.correct_option;
          
          let marksAwarded = 0;
          if (studentAns !== undefined && studentAns !== null && studentAns !== '') {
              if (String(studentAns).trim().toLowerCase() === String(correctAns).trim().toLowerCase()) {
                  marksAwarded = q.positive_marks || q.marks || 1;
              } else {
                  marksAwarded = q.negative_marks ? -Math.abs(q.negative_marks) : (q.question_type === 'mcq' ? -1 : 0);
              }
          }
          
          return (
            <View key={q.id} style={styles.questionBox} wrap={false}>
              <View style={styles.questionHeader}>
                <Text style={styles.questionNumber}>
                  Q.{q.question_number || index + 1} | {q.exam_subjects?.subject_name || 'General'}
                </Text>
                <Text style={marksAwarded > 0 ? styles.marksPositive : marksAwarded < 0 ? styles.marksNegative : styles.marksZero}>
                  Marks: {marksAwarded > 0 ? '+' : ''}{marksAwarded}
                </Text>
              </View>
              
              {q.question_text && <Text style={styles.questionText}>{q.question_text}</Text>}
              {q.image_url && (
                <Image 
                  src={q.image_url} 
                  style={{ maxWidth: '100%', maxHeight: 200, marginBottom: 10, objectFit: 'contain' }} 
                />
              )}
              
              {q.options && typeof q.options === 'object' && (
                <View style={styles.optionsContainer}>
                  {['A', 'B', 'C', 'D'].map(key => {
                    const val = q.options[key];
                    const imgVal = q.options[`${key}_image`];
                    
                    if (!val && !imgVal) return null;
                    
                    const isCorrect = String(correctAns).trim().toUpperCase() === key;
                    const isStudentAns = studentAns !== undefined && studentAns !== null && String(studentAns).trim().toUpperCase() === key;
                    const isWrong = isStudentAns && !isCorrect;

                    let boxStyle: any = { ...styles.optionBox };
                    if (isCorrect) boxStyle = { ...boxStyle, ...styles.optionBoxCorrect };
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
                        <View style={{ width: 100, alignItems: 'flex-end' }}>
                          {isCorrect && <Text style={styles.optionLabelCorrect}>✓ Correct Answer</Text>}
                          {isWrong && <Text style={styles.optionLabelWrong}>✗ Your Answer</Text>}
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
      </Page>
    </Document>
  );
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const resultId = searchParams.get('resultId');

  if (!resultId) {
    return new NextResponse('Missing resultId', { status: 400 });
  }

  const supabase = createClient();

  // 1. Fetch Result
  const { data: result, error: resultError } = await supabase
    .from('results')
    .select('*, students:student_id(full_name, roll_number)')
    .eq('id', resultId)
    .single();

  if (resultError || !result) {
    return new NextResponse('Result not found', { status: 404 });
  }

  // 2. Fetch Exam
  const { data: exam, error: examError } = await supabase
    .from('exams')
    .select('*, schools:school_id(name)')
    .eq('id', result.exam_id)
    .single();
    
  if (examError || !exam) {
    return new NextResponse('Exam not found', { status: 404 });
  }

  // 3. Fetch Questions
  const { data: questions, error: questionsError } = await supabase
    .from('questions')
    .select('*, exam_subjects(subject_name)')
    .eq('exam_id', result.exam_id)
    .order('question_number', { ascending: true });

  if (questionsError || !questions) {
    return new NextResponse('Error fetching questions', { status: 500 });
  }

  const schoolName = exam.schools?.name || '';
  const studentName = result.students?.full_name || 'Unknown';

  try {
    const pdfStream = await renderToStream(
      <AnswerKeyPDF 
        result={result} 
        exam={exam} 
        questions={questions} 
        schoolName={schoolName} 
      />
    );
    
    // We need to convert the Node.js Readable stream into a web ReadableStream
    const readableStream = new ReadableStream({
      start(controller) {
        pdfStream.on('data', (chunk) => controller.enqueue(chunk));
        pdfStream.on('end', () => controller.close());
        pdfStream.on('error', (err) => controller.error(err));
      }
    });

    const safeFilename = `${studentName.replace(/[^a-zA-Z0-9]/g, '_')}_AnswerKey.pdf`;

    return new NextResponse(readableStream, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeFilename}"`
      }
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return new NextResponse('Error generating PDF', { status: 500 });
  }
}
