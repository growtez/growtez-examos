import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { renderToStream } from '@react-pdf/renderer';
import React from 'react';
import { AnswerKeyPDF } from './AnswerKeyPDF';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const resultId = searchParams.get('resultId');
  const format = searchParams.get('format');

  if (!resultId) {
    return new NextResponse('Missing resultId', { status: 400 });
  }

  const supabase = createClient();

  // 1. Fetch Result
  const { data: result, error: resultError } = await supabase
    .from('results')
    .select('*')
    .eq('id', resultId)
    .single();

  if (resultError || !result) {
    console.error('API Error fetching result:', resultError);
    return new NextResponse(`Result not found. DB Error: ${resultError?.message || 'Unknown'} - Details: ${resultError?.details || ''} - Hint: ${resultError?.hint || ''}`, { status: 404 });
  }

  // 1b. Fetch Student manually since there's no foreign key
  const { data: student } = await supabase
    .from('students')
    .select('full_name, roll_number')
    .eq('id', result.student_id)
    .single();
    
  if (student) {
    result.students = student;
  }

  // 2. Fetch Exam
  const { data: exam, error: examError } = await supabase
    .from('exams')
    .select('*, schools(name)')
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

  if (format === 'json') {
    return NextResponse.json({
      result,
      exam,
      questions,
      schoolName,
      studentName
    });
  }

  try {
    const pdfStream = await renderToStream(
      React.createElement(AnswerKeyPDF, {
        result,
        exam,
        questions,
        schoolName,
      })
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
