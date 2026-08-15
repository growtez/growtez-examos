import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
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

  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let result: any = null;

  if (resultId.startsWith('no-res-')) {
    const studentId = resultId.replace('no-res-', '');
    const { data: student } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();
    
    if (!student) {
      return new NextResponse('Student not found', { status: 404 });
    }
    
    result = {
      id: resultId,
      student_id: studentId,
      exam_id: student.exam_id,
      total_marks: 0,
      answers: {},
      students: student
    };
  } else {
    // 1. Fetch Result
    const { data: resData, error: resultError } = await supabase
      .from('results')
      .select('*')
      .eq('id', resultId)
      .single();

    if (resultError || !resData) {
      console.error('API Error fetching result:', resultError);
      return new NextResponse(`Result not found. DB Error: ${resultError?.message || 'Unknown'} - Details: ${resultError?.details || ''} - Hint: ${resultError?.hint || ''}`, { status: 404 });
    }
    
    result = resData;

    // 1b. Fetch Student manually since there's no foreign key
    const { data: student } = await supabase
      .from('students')
      .select('full_name, roll_number')
      .eq('id', result.student_id)
      .single();
      
    if (student) {
      result.students = student;
    }
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
    .select('*, exam_subjects(subject_name, sort_order)')
    .eq('exam_id', result.exam_id);

  if (questions) {
    questions.sort((a, b) => {
      const orderA = (a.exam_subjects as any)?.sort_order ?? 0;
      const orderB = (b.exam_subjects as any)?.sort_order ?? 0;
      if (orderA !== orderB) return orderA - orderB;
      return (a.question_number || 0) - (b.question_number || 0);
    });
  }

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
